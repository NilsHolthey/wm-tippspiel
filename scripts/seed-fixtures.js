/**
 * Imports all WM 2026 fixtures from the openfootball GitHub repo.
 * Clears existing matches and tips — users are preserved.
 *
 * Usage:
 *   npm run seed-fixtures
 */
import mongoose from "mongoose";
import { mapTeam } from "../lib/teamMap.js";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1); }

// ── inline schemas ──────────────────────────────────────────────────────────
const MatchSchema = new mongoose.Schema({
  matchday: Number, group: String, phase: { type: String, default: "Gruppenphase" },
  home: String, homeFlag: String, away: String, awayFlag: String,
  kickoff: Date, fixtureId: { type: Number, default: null },
  result: { h: Number, a: Number }, finished: { type: Boolean, default: false },
});
const TipSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId, match: mongoose.Schema.Types.ObjectId,
  h: Number, a: Number, lateStatus: String,
});
const LateReqSchema = new mongoose.Schema({
  tip: mongoose.Schema.Types.ObjectId, user: mongoose.Schema.Types.ObjectId,
  match: mongoose.Schema.Types.ObjectId, status: String,
});

const Match       = mongoose.models.Match       || mongoose.model("Match",       MatchSchema);
const Tip         = mongoose.models.Tip         || mongoose.model("Tip",         TipSchema);
const LateRequest = mongoose.models.LateRequest || mongoose.model("LateRequest", LateReqSchema);

// ── helpers ─────────────────────────────────────────────────────────────────
function parseKickoff(dateStr, timeStr) {
  const [hhmm, tzPart] = timeStr.split(" ");
  const [h, m] = hhmm.split(":").map(Number);
  const offset = parseInt(tzPart.replace("UTC", ""), 10);
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, h - offset, m));
}

function mapRound(round) {
  const md = round.match(/^Matchday\s+(\d+)$/i);
  if (md) return { phase: "Gruppenphase", matchday: parseInt(md[1]) };
  if (/Round of 32/i.test(round))     return { phase: "Runde der 32",     matchday: 18 };
  if (/Round of 16/i.test(round))     return { phase: "Achtelfinale",      matchday: 19 };
  if (/Quarter/i.test(round))         return { phase: "Viertelfinale",     matchday: 20 };
  if (/Semi/i.test(round))            return { phase: "Halbfinale",        matchday: 21 };
  if (/third place/i.test(round))     return { phase: "Spiel um Platz 3",  matchday: 22 };
  if (/Final/i.test(round))           return { phase: "Finale",            matchday: 23 };
  return { phase: round, matchday: 0 };
}

// ── main ────────────────────────────────────────────────────────────────────
console.log(`Fetching ${OPENFOOTBALL_URL} …`);
const raw = await fetch(OPENFOOTBALL_URL);
if (!raw.ok) { console.error(`Fetch failed: ${raw.status}`); process.exit(1); }
const { matches } = await raw.json();
console.log(`Got ${matches.length} matches`);

await mongoose.connect(MONGODB_URI, { bufferCommands: false });
console.log("Connected to MongoDB");

await Promise.all([Match.deleteMany(), Tip.deleteMany(), LateRequest.deleteMany()]);
console.log("Cleared matches, tips, late requests");

let count = 0;
for (const m of matches) {
  const { phase, matchday } = mapRound(m.round);
  const group   = m.group ? m.group.replace(/^Group\s*/i, "") : null;
  const kickoff = parseKickoff(m.date, m.time);
  const home    = mapTeam(m.team1);
  const away    = mapTeam(m.team2);

  const doc = {
    matchday, group, phase,
    home: home.name, homeFlag: home.flag,
    away: away.name, awayFlag: away.flag,
    kickoff, finished: false,
  };

  if (m.score?.ft) {
    doc.result = { h: m.score.ft[0], a: m.score.ft[1] };
    doc.finished = true;
  }

  await Match.create(doc);
  count++;
}

console.log(`\n✅ Imported ${count} matches from openfootball`);
await mongoose.disconnect();
