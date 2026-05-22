import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../lib/db";
import Match from "../../../models/Match";
import { mapTeam } from "../../../lib/teamMap";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

function parseKickoff(dateStr, timeStr) {
  const [hhmm, tzPart] = timeStr.split(" ");
  const [h, m] = hhmm.split(":").map(Number);
  const offset = parseInt(tzPart.replace("UTC", ""), 10);
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, h - offset, m));
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  if (req.method !== "POST") return res.status(405).end();

  const apiRes = await fetch(OPENFOOTBALL_URL);
  if (!apiRes.ok) return res.status(502).json({ error: `GitHub fetch failed: ${apiRes.status}` });
  const { matches } = await apiRes.json();

  await connectDB();

  let updated = 0;
  let namesUpdated = 0;
  const details = [];

  for (const m of matches) {
    const home    = mapTeam(m.team1);
    const away    = mapTeam(m.team2);
    const kickoff = parseKickoff(m.date, m.time);
    const hasScore = !!m.score?.ft;
    const isPlaceholder = /^[WL]\d+$|^\d+[A-Z]$/.test(m.team1);

    if (!hasScore && isPlaceholder) continue;

    // Match by (kickoff + home name). Fallback: kickoff only (knockout placeholder still in DB).
    let dbMatch = await Match.findOne({ kickoff, home: home.name });
    if (!dbMatch) dbMatch = await Match.findOne({ kickoff });
    if (!dbMatch) continue;

    const update = {};

    // Update team names/flags when they change (e.g. placeholder → real team)
    if (dbMatch.home !== home.name || dbMatch.away !== away.name) {
      update.home     = home.name;
      update.homeFlag = home.flag;
      update.away     = away.name;
      update.awayFlag = away.flag;
      namesUpdated++;
    }

    if (hasScore && !dbMatch.finished) {
      update.result   = { h: m.score.ft[0], a: m.score.ft[1] };
      update.finished = true;
      details.push({ match: `${home.name} vs ${away.name}`, result: `${m.score.ft[0]}:${m.score.ft[1]}` });
      updated++;
    }

    if (Object.keys(update).length) {
      await Match.findByIdAndUpdate(dbMatch._id, update);
    }
  }

  return res.status(200).json({ updated, namesUpdated, details, checked: matches.length });
}
