/**
 * Maps API-Football round strings → { phase (German), matchday (number) }
 * WM 2026 has 48 teams: Group Stage (3 matchdays) + Round of 32 + R16 + QF + SF + Final
 */
const ROUND_MAP = [
  { match: /Group Stage\s*-\s*1/i,   phase: "Gruppenphase",       matchday: 1 },
  { match: /Group Stage\s*-\s*2/i,   phase: "Gruppenphase",       matchday: 2 },
  { match: /Group Stage\s*-\s*3/i,   phase: "Gruppenphase",       matchday: 3 },
  { match: /Round of 32/i,           phase: "Runde der 32",       matchday: 4 },
  { match: /Round of 16/i,           phase: "Achtelfinale",       matchday: 5 },
  { match: /Quarter-final/i,         phase: "Viertelfinale",      matchday: 6 },
  { match: /Semi-final/i,            phase: "Halbfinale",         matchday: 7 },
  { match: /3rd Place/i,             phase: "Spiel um Platz 3",   matchday: 8 },
  { match: /Final/i,                 phase: "Finale",             matchday: 9 },
];

export function mapRound(round = "") {
  for (const r of ROUND_MAP) {
    if (r.match.test(round)) return { phase: r.phase, matchday: r.matchday };
  }
  return { phase: round, matchday: 0 };
}
