import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema({
  matchday: { type: Number, required: true },
  group: { type: String },
  phase: { type: String, default: "Gruppenphase" },
  home: { type: String, required: true },
  homeFlag: { type: String },
  away: { type: String, required: true },
  awayFlag: { type: String },
  kickoff: { type: Date, required: true },
  fixtureId: { type: Number, default: null },
  result: {
    h: { type: Number },
    a: { type: Number },
  },
  finished: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Match || mongoose.model("Match", MatchSchema);
