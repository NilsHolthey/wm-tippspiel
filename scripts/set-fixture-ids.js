/**
 * One-off migration: populates fixtureId on existing matches from openfootball num field.
 * Safe to run on a live DB — only sets fixtureId, touches nothing else.
 *
 * Usage:
 *   MONGODB_URI=... node scripts/set-fixture-ids.js
 */
import mongoose from "mongoose";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1); }

const MatchSchema = new mongoose.Schema({
  matchday: Number, group: String, phase: String,
  home: String, homeFlag: String, away: String, awayFlag: String,
  kickoff: Date, fixtureId: { type: Number, default: null },
  result: { h: Number, a: Number }, finished: Boolean,
});
const Match = mongoose.models.Match || mongoose.model("Match", MatchSchema);

function parseKickoff(dateStr, timeStr) {
  const [hhmm, tzPart] = timeStr.split(" ");
  const [h, m] = hhmm.split(":").map(Number);
  const offset = parseInt(tzPart.replace("UTC", ""), 10);
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, h - offset, m));
}

console.log(`Fetching ${OPENFOOTBALL_URL} …`);
const raw = await fetch(OPENFOOTBALL_URL);
if (!raw.ok) { console.error(`Fetch failed: ${raw.status}`); process.exit(1); }
const { matches } = await raw.json();
console.log(`Got ${matches.length} matches from openfootball`);

await mongoose.connect(MONGODB_URI, { bufferCommands: false });
console.log("Connected to MongoDB");

let updated = 0, skipped = 0, notFound = 0;

for (const m of matches) {
  if (!m.num) { skipped++; continue; }

  const kickoff = parseKickoff(m.date, m.time);

  // Match by exact kickoff time
  const dbMatch = await Match.findOne({ kickoff });
  if (!dbMatch) { notFound++; continue; }

  if (dbMatch.fixtureId === m.num) { skipped++; continue; }

  await Match.findByIdAndUpdate(dbMatch._id, { fixtureId: m.num });
  console.log(`  #${m.num} → ${dbMatch.home} vs ${dbMatch.away} (${kickoff.toISOString()})`);
  updated++;
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${notFound} not found`);
await mongoose.disconnect();
