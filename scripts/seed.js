/**
 * Seed script — run once to populate the DB with demo data.
 * Usage: MONGODB_URI=mongodb://... node scripts/seed.js
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1); }

// ── inline schemas (avoids ESM/CJS issues) ──────────────────
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
});

const MatchSchema = new mongoose.Schema({
  matchday: Number,
  group: String,
  phase: { type: String, default: "Gruppenphase" },
  home: String, homeFlag: String,
  away: String, awayFlag: String,
  kickoff: Date,
  result: { h: Number, a: Number },
  finished: { type: Boolean, default: false },
});

const TipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  match: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
  h: Number, a: Number,
  lateStatus: { type: String, default: null },
  submittedAt: { type: Date, default: Date.now },
});

const User  = mongoose.model("User",  UserSchema);
const Match = mongoose.model("Match", MatchSchema);
const Tip   = mongoose.model("Tip",   TipSchema);

await mongoose.connect(MONGODB_URI, { bufferCommands: false });
console.log("Connected");

// clean up
await Promise.all([User.deleteMany(), Match.deleteMany(), Tip.deleteMany()]);

// users
const pw = (p) => bcrypt.hashSync(p, 10);
const users = await User.insertMany([
  { username: "admin",   passwordHash: pw("admin123"),  isAdmin: true  },
  { username: "anna",    passwordHash: pw("anna123"),   isAdmin: false },
  { username: "tom",     passwordHash: pw("tom123"),    isAdmin: false },
  { username: "max",     passwordHash: pw("max123"),    isAdmin: false },
]);

const [admin, anna, tom, max] = users;
console.log("Users created");

// matches — kickoff in the past so tips are unlocked and visible
const now = Date.now();
const past = (daysAgo, hour = 21) => new Date(now - daysAgo * 86_400_000 + hour * 3_600_000);
const future = (daysFromNow, hour = 18) => new Date(now + daysFromNow * 86_400_000 + hour * 3_600_000);

const matches = await Match.insertMany([
  {
    matchday: 1, group: "A", phase: "Gruppenphase",
    home: "Deutschland", homeFlag: "🇩🇪",
    away: "Schottland",  awayFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    kickoff: past(7), result: { h: 5, a: 1 }, finished: true,
  },
  {
    matchday: 1, group: "A", phase: "Gruppenphase",
    home: "Ungarn",    homeFlag: "🇭🇺",
    away: "Schweiz",   awayFlag: "🇨🇭",
    kickoff: past(7, 15), result: { h: 1, a: 1 }, finished: true,
  },
  {
    matchday: 2, group: "A", phase: "Gruppenphase",
    home: "Deutschland", homeFlag: "🇩🇪",
    away: "Ungarn",      awayFlag: "🇭🇺",
    kickoff: future(2, 18), finished: false,
  },
  {
    matchday: 2, group: "B", phase: "Gruppenphase",
    home: "Spanien",  homeFlag: "🇪🇸",
    away: "Kroatien", awayFlag: "🇭🇷",
    kickoff: future(3, 21), finished: false,
  },
  {
    matchday: 3, group: "C", phase: "Gruppenphase",
    home: "Frankreich", homeFlag: "🇫🇷",
    away: "Polen",       awayFlag: "🇵🇱",
    kickoff: future(8, 21), finished: false,
  },
]);

const [m1, m2, m3, m4, m5] = matches;
console.log("Matches created");

// tips for finished matches
await Tip.insertMany([
  { user: anna._id, match: m1._id, h: 3, a: 0 },
  { user: tom._id,  match: m1._id, h: 3, a: 0 },
  { user: max._id,  match: m1._id, h: 1, a: 0 },
  { user: anna._id, match: m2._id, h: 1, a: 1 },
  { user: tom._id,  match: m2._id, h: 0, a: 2 },
  { user: max._id,  match: m2._id, h: 1, a: 1 },
  // tip for upcoming match
  { user: anna._id, match: m3._id, h: 2, a: 0 },
]);

console.log("Tips created");
console.log("\nSeed complete! Credentials:");
console.log("  admin / admin123  (admin)");
console.log("  anna  / anna123");
console.log("  tom   / tom123");
console.log("  max   / max123");

await mongoose.disconnect();
