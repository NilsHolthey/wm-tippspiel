// FIFA WM 2026 tiebreaker order (when equal on points):
// 1. Head-to-head points
// 2. Head-to-head goal difference
// 3. Head-to-head goals scored
// 4. If 3+ teams still level on all h2h criteria → restart h2h for the subset
// 5. Overall goal difference
// 6. Overall goals scored
// 7. Alphabetical (fallback)

function calcH2H(teams, matches) {
  const names = new Set(teams.map(t => t.team));
  const h2h = {};
  for (const t of teams) h2h[t.team] = { pts: 0, gd: 0, gf: 0 };

  for (const m of matches) {
    if (!names.has(m.home) || !names.has(m.away)) continue;
    const { h, a } = m.result;
    h2h[m.home].gf += h; h2h[m.home].gd += (h - a);
    h2h[m.away].gf += a; h2h[m.away].gd += (a - h);
    if      (h > a) h2h[m.home].pts += 3;
    else if (h < a) h2h[m.away].pts += 3;
    else          { h2h[m.home].pts++; h2h[m.away].pts++; }
  }
  return h2h;
}

function sortByH2H(teams, groupMatches) {
  if (teams.length <= 1) return teams;

  const h2h = calcH2H(teams, groupMatches);

  const sorted = [...teams].sort((a, b) => {
    const ha = h2h[a.team], hb = h2h[b.team];
    return hb.pts - ha.pts || hb.gd - ha.gd || hb.gf - ha.gf;
  });

  // Within the h2h-sorted list, find sub-groups still tied on all h2h criteria
  const result = [];
  let i = 0;
  while (i < sorted.length) {
    const ref = h2h[sorted[i].team];
    let j = i + 1;
    while (j < sorted.length) {
      const cur = h2h[sorted[j].team];
      if (cur.pts !== ref.pts || cur.gd !== ref.gd || cur.gf !== ref.gf) break;
      j++;
    }
    const still = sorted.slice(i, j);
    if (still.length === 1) {
      result.push(still[0]);
    } else if (still.length < teams.length) {
      // Proper subset still tied → FIFA says restart h2h for this smaller group
      result.push(...sortByH2H(still, groupMatches));
    } else {
      // All original teams tied on every h2h metric → use overall criteria
      result.push(...still.sort((a, b) =>
        (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.team.localeCompare(b.team)
      ));
    }
    i = j;
  }
  return result;
}

export function calcStandings(matches) {
  const groups = {};

  for (const m of matches) {
    if (!m.group) continue;
    if (!groups[m.group]) groups[m.group] = {};
    const g = groups[m.group];
    if (!g[m.home]) g[m.home] = { team: m.home, flag: m.homeFlag, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
    if (!g[m.away]) g[m.away] = { team: m.away, flag: m.awayFlag, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
    if (!m.finished || !m.result) continue;
    const { h, a } = m.result;
    const home = g[m.home], away = g[m.away];
    home.played++; away.played++;
    home.gf += h; home.ga += a;
    away.gf += a; away.ga += h;
    if      (h > a) { home.won++;   away.lost++;  home.pts += 3; }
    else if (h < a) { away.won++;   home.lost++;  away.pts += 3; }
    else            { home.drawn++; away.drawn++; home.pts++;    away.pts++; }
  }

  const result = {};
  for (const [grp, teamsObj] of Object.entries(groups)) {
    const teams = Object.values(teamsObj);
    const groupMatches = matches.filter(m => m.group === grp && m.finished && m.result);

    // Sort by points first, then resolve ties with h2h
    const byPts = [...teams].sort((a, b) => b.pts - a.pts);
    const sorted = [];
    let i = 0;
    while (i < byPts.length) {
      let j = i + 1;
      while (j < byPts.length && byPts[j].pts === byPts[i].pts) j++;
      const tied = byPts.slice(i, j);
      sorted.push(...(tied.length > 1 ? sortByH2H(tied, groupMatches) : tied));
      i = j;
    }
    result[grp] = sorted;
  }
  return result;
}
