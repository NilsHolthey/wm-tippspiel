import mongoose from "mongoose";

const LateRequestSchema = new mongoose.Schema({
  tip: { type: mongoose.Schema.Types.ObjectId, ref: "Tip", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  requestedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.LateRequest || mongoose.model("LateRequest", LateRequestSchema);
