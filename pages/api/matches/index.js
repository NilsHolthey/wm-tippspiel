import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import Match from "../../../models/Match";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  await connectDB();

  if (req.method === "GET") {
    const matches = await Match.find().sort({ kickoff: 1 }).lean();
    return res.status(200).json(matches);
  }

  return res.status(405).end();
}
