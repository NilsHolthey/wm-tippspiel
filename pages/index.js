import { motion } from "framer-motion";
import Head from "next/head";
import Link from "next/link";
import { shortName } from "../lib/teamNames";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import { IconTrophy, IconSoccer, IconBarChart, IconList, IconClock } from "../components/Icons";
import s from "../styles/Page.module.css";
import h from "../styles/Home.module.css";
import { calcPoints } from "../lib/scoring";
import { LOCK_MIN, PTS_LBL } from "../lib/constants";
import { formatDate } from "../lib/format";

const PTS_CLS = { 3: s.pts3, 2: s.pts2, 1: s.pts1, 0: null };

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
    home.gf += h; home.ga += a;
    away.gf += a; away.ga += h;
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

function MatchRowTeams({ m, center }) {
  return (
    <div className={h.nmTeams}>
      <div className={h.nmHome}>
        <span className={h.nmFlag}>{m.homeFlag}</span>
        <span className={h.nmName}>{m.home}</span>
      </div>
      {center}
      <div className={h.nmAway}>
        <span className={h.nmName}>{m.away}</span>
        <span className={h.nmFlag}>{m.awayFlag}</span>
      </div>
    </div>
  );
}

function UpcomingMatches({ matches, myTipsMap }) {
  if (!matches.length) return <p className={s.empty}>Keine bevorstehenden Spiele.</p>;
  return (
    <div>
      {matches.map(m => {
        const tip = myTipsMap[m._id];
        return (
          <div key={m._id} className={h.nmRow}>
            <MatchRowTeams m={m} center={<span className={h.nmVs}>–:–</span>} />
            <div className={h.nmFooter}>
              <span className={h.nmDate}>{formatDate(m.kickoff)}</span>
              {tip
                ? <span className={`${h.nmTip} ${h.nmTipYes}`}>{tip.h}:{tip.a}</span>
                : <span className={`${h.nmTip} ${h.nmTipNo}`}>Kein Tipp</span>
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentResults({ results, myTipsMap }) {
  if (!results.length) {
    return <p className={s.empty}>Noch keine Ergebnisse. Das Turnier startet am 11. Juni 2026.</p>;
  }
  return (
    <div>
      {results.map(m => {
        const tip = myTipsMap[m._id];
        const pts = tip ? calcPoints({ h: tip.h, a: tip.a }, m.result) : null;
        return (
          <div key={m._id} className={h.nmRow}>
            <MatchRowTeams m={m} center={
              <span className={h.rScore}>{m.result.h}:{m.result.a}</span>
            } />
            <div className={h.nmFooter}>
              {tip ? (
                <span className={h.nmDate}>Tipp: {tip.h}:{tip.a}</span>
              ) : (
                <span className={h.nmDate} style={{ fontStyle: "italic" }}>Kein Tipp</span>
              )}
              {tip && (
                <span className={`${h.rPts} ${PTS_CLS[pts] ?? ""}`}>
                  {PTS_LBL[pts]} · {pts} Pkt
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniLeaderboard({ board, currentUserId }) {
  const top5 = board.slice(0, 5);
  const myIdx = board.findIndex(p => p.id === currentUserId);
  const myEntry = board[myIdx];
  const showMe = myIdx >= 5 && myEntry;

  return (
    <div className={h.miniBoard}>
      {top5.map((p, i) => (
        <div key={p.id} className={`${h.mbRow}${p.id === currentUserId ? " " + h.mbRowMe : ""}`}>
          <span className={h.mbRank}>{i + 1}</span>
          <span className={h.mbName}>{p.name}{p.id === currentUserId && " (Du)"}</span>
          <span className={h.mbPts}>{p.pts}</span>
        </div>
      ))}
      {showMe && (
        <>
          <div className={h.mbSep}>· · ·</div>
          <div className={`${h.mbRow} ${h.mbRowMe}`}>
            <span className={h.mbRank}>{myIdx + 1}</span>
            <span className={h.mbName}>{myEntry.name} (Du)</span>
            <span className={h.mbPts}>{myEntry.pts}</span>
          </div>
        </>
      )}
    </div>
  );
}

function FullLeaderboard({ board, currentUserId }) {
  return (
    <div className={h.miniBoard}>
      {board.map((p, i) => (
        <div key={p.id} className={`${h.mbRow}${p.id === currentUserId ? " " + h.mbRowMe : ""}`}>
          <span className={h.mbRank}>{i + 1}</span>
          <span className={h.mbName}>{p.name}{p.id === currentUserId && " (Du)"}</span>
          <span className={h.mbPts}>{p.pts}</span>
        </div>
      ))}
    </div>
  );
}

function GroupsPreview({ standings, activeGroups }) {
  return (
    <div className={s.homeSec}>
      <div className={s.homeSecTitle}>
        <IconBarChart size={14} />
        Gruppen
        <Link href="/gruppen" style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--gold)", textDecoration: "none" }}>
          Alle →
        </Link>
      </div>
      <div className={h.miniGrpGrid}>
        {activeGroups.filter(g => standings[g]).map(g => (
          <Link key={g} href="/gruppen" className={h.miniGrpCard}>
            <div className={h.miniGrpTitle}>Gruppe {g}</div>
            {standings[g].map((team, i) => (
              <div key={team.team} className={`${h.miniGrpRow}${i < 2 ? " " + h.miniGrpQual : ""}`}>
                <span className={h.miniGrpPos}>{i + 1}</span>
                <span className={h.miniGrpFlag}>{team.flag}</span>
                <span className={h.miniGrpName}>{team.team}</span>
                <span className={h.miniGrpPts}>{team.pts}</span>
              </div>
            ))}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Rules() {
  return (
    <div className={s.homeSec}>
      <div className={s.homeSecTitle}><IconList size={14} /> Spielregeln</div>

      <div className={h.rulesGrid}>
        <div className={h.ruleCard}>
          <div className={h.ruleCardTop}>
            <span className={`${s.legendChip} ${s.pts3}`}>3 Punkte</span>
          </div>
          <div className={h.ruleCardBody}>Richtiges Ergebnis – genaue Tore für beide Teams.</div>
        </div>
        <div className={h.ruleCard}>
          <div className={h.ruleCardTop}>
            <span className={`${s.legendChip} ${s.pts2}`}>2 Punkte</span>
          </div>
          <div className={h.ruleCardBody}>Richtige Tordifferenz – nur bei Sieg oder Niederlage (nicht bei Unentschieden).</div>
        </div>
        <div className={h.ruleCard}>
          <div className={h.ruleCardTop}>
            <span className={`${s.legendChip} ${s.pts1}`}>1 Punkt</span>
          </div>
          <div className={h.ruleCardBody}>Richtige Tendenz – Sieg, Unentschieden oder Niederlage korrekt vorhergesagt.</div>
        </div>
      </div>

      <hr className={h.ruleDivider} />

      <div className={h.ruleExtra}>
        <div className={h.ruleExtraRow}>
          <span className={h.ruleExtraIcon}>⏰</span>
          <span>Tipps müssen <strong>60 Minuten vor Anpfiff</strong> abgegeben werden. Danach sind <strong>keine Änderungen</strong> mehr möglich.</span>
        </div>
        <div className={h.ruleExtraRow}>
          <span className={h.ruleExtraIcon}>👁</span>
          <span>Die Tipps der anderen Spieler sind erst nach dem Ablauf der Deadline sichtbar.</span>
        </div>
        <div className={h.ruleExtraRow}>
          <span className={h.ruleExtraIcon}>⚠️</span>
          <span>Wer bis zur Deadline noch <strong>keinen Tipp</strong> abgegeben hat, kann einen verspäteten Tipp einreichen – ein Admin muss ihn genehmigen. Bestehende Tipps können nach der Deadline <strong>nicht mehr geändert</strong> werden.</span>
        </div>
        <div className={h.ruleExtraRow}>
          <span className={h.ruleExtraIcon}>⏱️</span>
          <span>Alle Tipps gelten für das Ergebnis nach <strong>90 Minuten</strong> – Verlängerung und Elfmeterschießen zählen nicht.</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ nextMatches, recentResults, board, myTipsMap, currentUserId, groupStandings, activeGroups, todayUntipped }) {
  const router = useRouter();
  return (
    <>
      <Head><title>WM Tippspiel 2026</title></Head>
      <div className={s.app}>
        <div className={s.wrap}>

          {todayUntipped > 0 && (
            <Link href="/tipps" className={h.untippedBanner}>
              <span>⚽ {todayUntipped} {todayUntipped === 1 ? "Spiel" : "Spiele"} heute noch ohne Tipp</span>
              <span className={h.untippedCta}>Jetzt tippen →</span>
            </Link>
          )}

          <div className={h.homeHero}>
            <div className={h.homeTitle}>WM <span>TIPPSPIEL</span> 2026</div>
            <div className={h.homeSub}>11. Juni – 19. Juli 2026 · USA, Kanada &amp; Mexiko</div>
          </div>

          <div className={h.homeGrid}>
            {/* left: upcoming */}
            <motion.div
              className={`${s.homeSec} ${s.homeSecLink}`}
              onClick={() => router.push("/tipps")} role="link" tabIndex={0}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: 0.05 }}
            >
              <div className={s.homeSecTitle}>
                <IconClock size={14} /> Nächste Spiele
                <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--gold)" }}>Alle →</span>
              </div>
              <UpcomingMatches matches={nextMatches} myTipsMap={myTipsMap} />
            </motion.div>

            {/* right: leaderboard */}
            <motion.div
              className={`${s.homeSec} ${s.homeSecLink}`}
              onClick={() => router.push("/rangliste")} role="link" tabIndex={0}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: 0.1 }}
            >
              <div className={s.homeSecTitle}>
                <IconTrophy size={14} /> Rangliste
                <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--gold)" }}>Alle →</span>
              </div>
              <div className={h.mobileOnly}><MiniLeaderboard board={board} currentUserId={currentUserId} /></div>
              <div className={h.tabletUp}><FullLeaderboard board={board} currentUserId={currentUserId} /></div>
            </motion.div>
          </div>

          {/* recent results full width */}
          <motion.div
            className={s.homeSec}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut", delay: 0.15 }}
          >
            <div className={s.homeSecTitle}><IconSoccer size={14} /> Letzte Ergebnisse</div>
            <RecentResults results={recentResults} myTipsMap={myTipsMap} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut", delay: 0.2 }}
          >
            <GroupsPreview standings={groupStandings} activeGroups={activeGroups} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut", delay: 0.25 }}
          >
            <Rules />
          </motion.div>

        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { connectDB } = await import("../lib/db");
  const { default: User }  = await import("../models/User");
  const { default: Match } = await import("../models/Match");
  const { default: Tip }   = await import("../models/Tip");

  await connectDB();
  const userId = session.user.id;

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const [rawNext, rawRecent, users, allFinished, allTips, rawGroupMatches, rawToday] = await Promise.all([
    Match.find({ finished: false }).sort({ kickoff: 1 }).limit(4).lean(),
    Match.find({ finished: true  }).sort({ kickoff: -1 }).limit(5).lean(),
    User.find().lean(),
    Match.find({ finished: true }).lean(),
    Tip.find({ lateStatus: { $in: [null, "approved"] } }).lean(),
    Match.find({ group: { $ne: null } }).sort({ kickoff: 1 }).lean(),
    Match.find({ finished: false, kickoff: { $gte: todayStart, $lte: todayEnd } }).lean(),
  ]);

  // tips map for the current user (next + recent + today matches)
  const relevantIds = new Set([...rawNext, ...rawRecent, ...rawToday].map(m => m._id.toString()));
  const myTipsMap = {};
  const tipMap = {};
  for (const t of allTips) {
    tipMap[`${t.user}-${t.match}`] = t;
    if (t.user.toString() === userId && relevantIds.has(t.match.toString())) {
      myTipsMap[t.match.toString()] = { h: t.h, a: t.a };
    }
  }

  // leaderboard
  const board = users.map(u => {
    let pts = 0, correct = 0, diff = 0, tendency = 0, tipped = 0;
    for (const m of allFinished) {
      const tip = tipMap[`${u._id}-${m._id}`];
      if (!tip) continue;
      tipped++;
      const p = calcPoints({ h: tip.h, a: tip.a }, m.result);
      pts += p;
      if (p === 3) correct++;
      else if (p === 2) diff++;
      else if (p === 1) tendency++;
    }
    return { id: u._id.toString(), name: u.username, pts, correct, diff, tendency, tipped };
  }).sort((a, b) => b.pts - a.pts || b.correct - a.correct || b.diff - a.diff);

  function serializeMatch(m) {
    return {
      _id: m._id.toString(),
      matchday: m.matchday,
      group: m.group ?? null,
      phase: m.phase || "Gruppenphase",
      home: shortName(m.home), homeFlag: m.homeFlag ?? "",
      away: shortName(m.away), awayFlag: m.awayFlag ?? "",
      kickoff: m.kickoff.toISOString(),
      finished: m.finished,
      result: m.result ?? null,
    };
  }

  const groupStandings = calcStandings(rawGroupMatches.map(m => ({
    ...m,
    _id: m._id.toString(),
    kickoff: m.kickoff.toISOString(),
  })));

  // groups with matches yesterday, today or tomorrow
  const dayStart = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const yesterday = dayStart(new Date(now - 86400000));
  const tomorrow  = dayStart(new Date(now.getTime() + 86400000));
  tomorrow.setHours(23,59,59,999);
  const activeGroupSet = new Set(
    rawGroupMatches
      .filter(m => { const k = new Date(m.kickoff); return k >= yesterday && k <= tomorrow; })
      .map(m => m.group)
  );
  // fallback: first 6 groups that have standings data
  const allStandingGroups = ["A","B","C","D","E","F","G","H","I","J","K","L"].filter(g => groupStandings[g]);
  // sort groups by soonest upcoming unfinished match so the most relevant appear first on mobile
  const groupNextKickoff = {};
  for (const m of rawGroupMatches) {
    if (!m.finished && m.group) {
      const t = new Date(m.kickoff).getTime();
      if (!groupNextKickoff[m.group] || t < groupNextKickoff[m.group]) groupNextKickoff[m.group] = t;
    }
  }
  const byNextMatch = (a, b) => (groupNextKickoff[a] ?? Infinity) - (groupNextKickoff[b] ?? Infinity);

  const activeGroups = (activeGroupSet.size > 0
    ? allStandingGroups.filter(g => activeGroupSet.has(g))
    : allStandingGroups
  ).sort(byNextMatch);

  const todayUntipped = rawToday.filter(m => {
    const deadline = new Date(m.kickoff).getTime() - LOCK_MIN * 60 * 1000;
    return deadline > now.getTime() && !myTipsMap[m._id.toString()];
  }).length;

  return {
    props: {
      nextMatches:    rawNext.map(serializeMatch),
      recentResults:  rawRecent.map(serializeMatch),
      board,
      myTipsMap,
      currentUserId: userId,
      groupStandings,
      activeGroups,
      todayUntipped,
    },
  };
}
