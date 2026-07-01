import mongoose from "mongoose";

const TipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
  h: { type: Number, required: true, min: 0 },
  a: { type: Number, required: true, min: 0 },
  lateStatus: { type: String, enum: [null, "pending", "approved", "rejected"], default: null },
  submittedAt: { type: Date, default: Date.now },
  username:  { type: String },
  matchInfo: { type: String },
}, { timestamps: true });

TipSchema.index({ user: 1, match: 1 }, { unique: true });

export default mongoose.models.Tip || mongoose.model("Tip", TipSchema);
