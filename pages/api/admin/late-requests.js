import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import LateRequest from "../../../models/LateRequest";
import Tip from "../../../models/Tip";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  await connectDB();

  if (req.method === "GET") {
    const requests = await LateRequest.find({ status: "pending" })
      .populate("user", "username")
      .populate("match")
      .populate("tip")
      .lean();
    return res.status(200).json(requests);
  }

  if (req.method === "PUT") {
    const { requestId, action } = req.body;
    if (!requestId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "requestId and action (approve|reject) required" });
    }

    const status = action === "approve" ? "approved" : "rejected";
    const request = await LateRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: "Request not found" });

    await Tip.findByIdAndUpdate(request.tip, {
      lateStatus: status,
    });

    return res.status(200).json(request);
  }

  return res.status(405).end();
}
