import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { connectDB } from "../../lib/db";
import User from "../../models/User";
import Tip from "../../models/Tip";
import Match from "../../models/Match";
import { calcPoints } from "../../lib/scoring";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "GET") return res.status(405).end();

  await connectDB();

  const users = await User.find().lean();
  const finishedMatches = await Match.find({ finished: true }).lean();
  const tips = await Tip.find({ lateStatus: { $in: [null, "approved"] } }).lean();

  const tipMap = {};
  for (const t of tips) {
    tipMap[`${t.user}-${t.match}`] = t;
  }

  const board = users.map((u) => {
    let pts = 0, correct = 0, diff = 0, tendency = 0, tipped = 0;
    for (const m of finishedMatches) {
      const tip = tipMap[`${u._id}-${m._id}`];
      if (!tip) continue;
      tipped++;
      const p = calcPoints({ h: tip.h, a: tip.a }, m.result);
      pts += p;
      if (p === 3) correct++;
      else if (p === 2) diff++;
      else if (p === 1) tendency++;
    }
    return { id: u._id.toString(), name: u.username, pts, correct, diff, tendency, tipped };
  });

  board.sort((a, b) => b.pts - a.pts || b.correct - a.correct || b.diff - a.diff);

  return res.status(200).json(board);
}
