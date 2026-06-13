import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { shortName } from "../../../lib/teamNames";

import { LOCK_MIN } from "../../../lib/constants";

function isDeadlinePast(kickoff) {
  return Date.now() >= new Date(kickoff).getTime() - LOCK_MIN * 60 * 1000;
}
function getDefaultMatchday(matches) {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const days = {};
  for (const m of matches) { if (!days[m.matchday]) days[m.matchday] = []; days[m.matchday].push(m); }
  const sorted = Object.keys(days).map(Number).sort((a, b) => a - b);
  for (const d of sorted) if (days[d].some(m => !m.finished && new Date(m.kickoff).getTime() <= now)) return d;
  for (const d of sorted) if (days[d].some(m => !m.finished && new Date(m.kickoff).getTime() <= now + week)) return d;
  for (const d of sorted) if (days[d].some(m => !m.finished)) return d;
  return sorted[sorted.length - 1] ?? 1;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { connectDB } = await import("../../../lib/db");
  const { default: Match } = await import("../../../models/Match");
  const { default: Tip } = await import("../../../models/Tip");

  await connectDB();
  const userId = session.user.id;

  const { default: User } = await import("../../../models/User");

  const [rawMatches, tips, allUsers] = await Promise.all([
    Match.find().sort({ kickoff: 1 }).lean(),
    Tip.find().populate("user", "username").lean(),
    User.find().select("username").lean(),
  ]);

  const teamForm = {};
  for (const m of rawMatches) {
    if (!m.finished || !m.result) continue;
    const { h, a } = m.result;
    if (!teamForm[m.home]) teamForm[m.home] = [];
    if (!teamForm[m.away]) teamForm[m.away] = [];
    teamForm[m.home].push(h > a ? "S" : h < a ? "N" : "U");
    teamForm[m.away].push(a > h ? "S" : a < h ? "N" : "U");
  }
  const form5 = (team) => (teamForm[team] ?? []).slice(-5);

  const myTipsMap = {};
  const otherTipsMap = {};
  const tippedPerMatch = {}; // matchId -> Set of usernames who tipped

  for (const tip of tips) {
    if (!tip.user) continue;
    const mId = tip.match.toString();
    const name = tip.user.username;

    if (!tippedPerMatch[mId]) tippedPerMatch[mId] = new Set();
    if (tip.lateStatus === null || tip.lateStatus === "approved") {
      tippedPerMatch[mId].add(name);
    }

    if (tip.user._id.toString() === userId) {
      myTipsMap[mId] = { h: tip.h, a: tip.a, lateStatus: tip.lateStatus };
    } else {
      const match = rawMatches.find(m => m._id.toString() === mId);
      if (!match) continue;
      if (isDeadlinePast(match.kickoff) && (tip.lateStatus === null || tip.lateStatus === "approved")) {
        if (!otherTipsMap[mId]) otherTipsMap[mId] = [];
        otherTipsMap[mId].push({ name, h: tip.h, a: tip.a });
      }
    }
  }

  // Pre-deadline tip status: green/red per user per match (no scores)
  const allUsernames = allUsers.map(u => u.username);
  const tipStatusMap = {};
  for (const m of rawMatches) {
    if (m.finished || isDeadlinePast(m.kickoff)) continue;
    const mId = m._id.toString();
    const tipped = tippedPerMatch[mId] ?? new Set();
    tipStatusMap[mId] = allUsernames.map(name => ({ name, hasTip: tipped.has(name) }));
  }

  const matches = rawMatches.map(m => ({
    _id: m._id.toString(),
    matchday: m.matchday,
    group: m.group ?? null,
    phase: m.phase || "Gruppenphase",
    home: shortName(m.home),
    homeFlag: m.homeFlag ?? "",
    homeForm: form5(m.home),
    away: shortName(m.away),
    awayFlag: m.awayFlag ?? "",
    awayForm: form5(m.away),
    kickoff: m.kickoff.toISOString(),
    finished: m.finished,
    result: m.result ?? null,
  }));

  res.setHeader("Cache-Control", "private, max-age=0");
  return res.json({ matches, myTipsMap, otherTipsMap, tipStatusMap, defaultMatchday: getDefaultMatchday(matches) });
}
