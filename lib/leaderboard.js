import { connectDB } from "./db";
import User from "../models/User";
import Match from "../models/Match";
import Tip from "../models/Tip";

export async function getLeaderboardBase() {
  await connectDB();

  const [users, finishedMatches, tips] = await Promise.all([
    User.find().lean(),
    Match.find({ finished: true }).sort({ kickoff: 1 }).lean(),
    Tip.find({ lateStatus: { $in: [null, "approved"] } }).lean(),
  ]);

  const tipMap = {};
  for (const t of tips) tipMap[`${t.user}-${t.match}`] = t;

  const matchdaySet = new Set(finishedMatches.map(m => m.matchday));
  const matchdays = [...matchdaySet].sort((a, b) => a - b);

  return { users, finishedMatches, tips, tipMap, matchdays };
}
