import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import Match from "../../../models/Match";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  if (req.method !== "PUT") return res.status(405).end();

  const { matchId, home, homeFlag, away, awayFlag } = req.body;
  if (!matchId) return res.status(400).json({ error: "matchId required" });

  await connectDB();

  const update = {};
  if (home     !== undefined) update.home     = home;
  if (homeFlag !== undefined) update.homeFlag = homeFlag;
  if (away     !== undefined) update.away     = away;
  if (awayFlag !== undefined) update.awayFlag = awayFlag;

  const match = await Match.findByIdAndUpdate(matchId, { $set: update });
  if (!match) return res.status(404).json({ error: "Match not found" });

  res.json({ ok: true });
}
