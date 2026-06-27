import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session?.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  if (req.method !== "PUT") return res.status(405).end();

  const { matchId, home, homeFlag, away, awayFlag } = req.body;
  if (!matchId) return res.status(400).json({ error: "matchId required" });

  const { connectDB } = await import("../../../lib/db");
  const { default: Match } = await import("../../../models/Match");
  await connectDB();

  const update = {};
  if (home     !== undefined) update.home     = home;
  if (homeFlag !== undefined) update.homeFlag = homeFlag;
  if (away     !== undefined) update.away     = away;
  if (awayFlag !== undefined) update.awayFlag = awayFlag;

  await Match.findByIdAndUpdate(matchId, { $set: update });
  res.json({ ok: true });
}
