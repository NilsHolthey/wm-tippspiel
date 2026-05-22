import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import Match from "../../../models/Match";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  await connectDB();

  if (req.method === "PUT") {
    const { matchId, h, a } = req.body;
    if (matchId == null || h == null || a == null) {
      return res.status(400).json({ error: "matchId, h, a required" });
    }
    const match = await Match.findByIdAndUpdate(
      matchId,
      { result: { h, a }, finished: true },
      { new: true }
    );
    if (!match) return res.status(404).json({ error: "Match not found" });
    return res.status(200).json(match);
  }

  return res.status(405).end();
}
