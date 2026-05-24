import Head from "next/head";
import { getSession } from "next-auth/react";
import Nav from "../components/Nav";
import s from "../styles/Page.module.css";

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

function calcStandings(matches) {
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

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })
    + " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function StandingsTable({ rows }) {
  return (
    <div className={s.grpTable}>
      <div className={s.grpRow + " " + s.grpHead}>
        <span className={s.grpTeamCol} />
        <span className={s.grpNum}>Sp</span>
        <span className={s.grpNum}>S</span>
        <span className={s.grpNum}>U</span>
        <span className={s.grpNum}>N</span>
        <span className={s.grpNum}>T</span>
        <span className={s.grpNum}>±</span>
        <span className={`${s.grpNum} ${s.grpPts}`}>P</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.team} className={`${s.grpRow}${i < 2 ? " " + s.grpQual : ""}`}>
          <span className={s.grpTeamCol}>
            <span className={s.grpRank}>{i + 1}</span>
            <span className={s.grpFlag}>{r.flag}</span>
            <span className={s.grpTeam}>{r.team}</span>
          </span>
          <span className={s.grpNum}>{r.played}</span>
          <span className={s.grpNum}>{r.won}</span>
          <span className={s.grpNum}>{r.drawn}</span>
          <span className={s.grpNum}>{r.lost}</span>
          <span className={s.grpNum}>{r.gf}:{r.ga}</span>
          <span className={s.grpNum}>{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</span>
          <span className={`${s.grpNum} ${s.grpPts}`}>{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

function MatchList({ matches }) {
  if (!matches.length) return null;
  return (
    <div className={s.grpMatches}>
      {matches.map(m => (
        <div key={m._id} className={`${s.grpMatch}${m.finished ? " " + s.grpMatchDone : ""}`}>
          <span className={s.grpMatchDate}>{formatDate(m.kickoff)}</span>
          <div className={s.grpMatchTeams}>
            <span className={s.grpMatchFlag}>{m.homeFlag}</span>
            <span className={s.grpMatchName}>{m.home}</span>
            {m.finished
              ? <span className={s.grpMatchScore}>{m.result.h} : {m.result.a}</span>
              : <span className={s.grpMatchVs}>–:–</span>}
            <span className={s.grpMatchName}>{m.away}</span>
            <span className={s.grpMatchFlag}>{m.awayFlag}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GruppenPage({ groups, standings }) {
  return (
    <>
      <Head><title>Gruppen – WM Tippspiel</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph} style={{ marginBottom: 22 }}>
            <div className={s.ptitle}>⚽ <span>GRUPPEN</span></div>
          </div>

          <div className={s.grpGrid}>
            {GROUPS.filter(g => groups[g]).map(g => (
              <div key={g} className={s.grpCard}>
                <div className={s.grpCardTitle}>Gruppe {g}</div>
                <StandingsTable rows={standings[g] ?? []} />
                <MatchList matches={groups[g]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { connectDB } = await import("../lib/db");
  const { default: Match } = await import("../models/Match");

  await connectDB();

  const rawMatches = await Match.find({ group: { $ne: null } }).sort({ kickoff: 1 }).lean();

  const groups = {};
  for (const m of rawMatches) {
    if (!groups[m.group]) groups[m.group] = [];
    groups[m.group].push({
      _id: m._id.toString(),
      home: m.home, homeFlag: m.homeFlag ?? "",
      away: m.away, awayFlag: m.awayFlag ?? "",
      kickoff: m.kickoff.toISOString(),
      finished: m.finished,
      result: m.result ?? null,
      group: m.group,
    });
  }

  const standings = calcStandings(
    rawMatches.map(m => ({ ...m, _id: m._id.toString(), kickoff: m.kickoff.toISOString() }))
  );

  return { props: { groups, standings } };
}
