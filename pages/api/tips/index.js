import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import Match from "../../../models/Match";
import Tip from "../../../models/Tip";
import LateRequest from "../../../models/LateRequest";

import { LOCK_MIN } from "../../../lib/constants";

function isLocked(kickoff) {
  return Date.now() >= new Date(kickoff).getTime() - LOCK_MIN * 60 * 1000;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  await connectDB();
  const userId = session.user.id;

  if (req.method === "GET") {
    const tips = await Tip.find({ user: userId }).lean();
    return res.status(200).json(tips);
  }

  if (req.method === "POST") {
    const { matchId, h, a } = req.body;
    if (matchId == null || h == null || a == null) {
      return res.status(400).json({ error: "matchId, h, a required" });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: "Match not found" });
    if (match.finished) return res.status(400).json({ error: "Match already finished" });

    const locked = isLocked(match.kickoff);

    const existing = await Tip.findOne({ user: userId, match: matchId });

    if (locked) {
      if (existing?.lateStatus === "pending") {
        return res.status(400).json({ error: "Late request already pending" });
      }
      const tip = await Tip.findOneAndUpdate(
        { user: userId, match: matchId },
        { h, a, lateStatus: "pending", submittedAt: new Date() },
        { upsert: true, new: true }
      );
      await LateRequest.findOneAndUpdate(
        { user: userId, match: matchId },
        { tip: tip._id, user: userId, match: matchId, status: "pending", requestedAt: new Date() },
        { upsert: true, new: true }
      );
      return res.status(200).json({ tip, late: true });
    }

    const tip = await Tip.findOneAndUpdate(
      { user: userId, match: matchId },
      { h, a, lateStatus: null, submittedAt: new Date() },
      { upsert: true, new: true }
    );
    return res.status(200).json({ tip });
  }

  return res.status(405).end();
}
