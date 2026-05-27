export function calcStandings(matches) {
  const groups = {};
  for (const m of matches) {
    if (!m.group) continue;
    if (!groups[m.group]) groups[m.group] = {};
    if (!groups[m.group][m.home]) groups[m.group][m.home] = { team: m.home, flag: m.homeFlag, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
    if (!groups[m.group][m.away]) groups[m.group][m.away] = { team: m.away, flag: m.awayFlag, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
    if (!m.finished || !m.result) continue;
    const { h, a } = m.result;
    const home = groups[m.group][m.home];
    const away = groups[m.group][m.away];
    home.played++; away.played++;
    home.gf += h;  home.ga += a;
    away.gf += a;  away.ga += h;
    if (h > a)      { home.won++; away.lost++; home.pts += 3; }
    else if (h < a) { away.won++; home.lost++; away.pts += 3; }
    else            { home.drawn++; away.drawn++; home.pts++; away.pts++; }
  }
  const result = {};
  for (const [grp, teams] of Object.entries(groups)) {
    result[grp] = Object.values(teams).sort((a, b) =>
      b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.team.localeCompare(b.team)
    );
  }
  return result;
}
