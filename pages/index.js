import { motion } from "framer-motion";
import Head from "next/head";
import Link from "next/link";
import { shortName } from "../lib/teamNames";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import Nav from "../components/Nav";
import s from "../styles/Page.module.css";
import { calcPoints } from "../lib/scoring";

const MEDALS = ["🥇", "🥈", "🥉"];
const PTS_CLS = { 3: s.pts3, 2: s.pts2, 1: s.pts1, 0: null };
const PTS_LBL = { 3: "Treffer", 2: "Differenz", 1: "Tendenz", 0: "Daneben" };
const ALL_GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

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

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }) +
    " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

function UpcomingMatches({ matches, myTipsMap }) {
  if (!matches.length) return <p className={s.empty}>Keine bevorstehenden Spiele.</p>;
  return (
    <div>
      {matches.map(m => {
        const tip = myTipsMap[m._id];
        const label = m.group ? `Gruppe ${m.group}` : m.phase;
        return (
          <div key={m._id} className={s.nmRow}>
            <div className={s.nmTeams}>
              <div className={s.nmHome}>
                <span className={s.nmFlag}>{m.homeFlag}</span>
                <span className={s.nmName}>{m.home}</span>
              </div>
              <span className={s.nmVs}>–:–</span>
              <div className={s.nmAway}>
                <span className={s.nmName}>{m.away}</span>
                <span className={s.nmFlag}>{m.awayFlag}</span>
              </div>
            </div>
            <div className={s.nmMeta}>
              <span>{formatDate(m.kickoff)}</span>
              <span className={s.nmDot}>·</span>
              <span>{label}</span>
              <span className={s.nmDot}>·</span>
              {tip
                ? <span className={`${s.nmTip} ${s.nmTipYes}`}>Tipp: {tip.h}:{tip.a}</span>
                : <span className={`${s.nmTip} ${s.nmTipNo}`}>Kein Tipp</span>
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
    return (
      <p className={s.empty}>
        Noch keine Ergebnisse. Das Turnier startet am 11. Juni 2026.
      </p>
    );
  }
  return (
    <div>
      {results.map(m => {
        const tip = myTipsMap[m._id];
        const pts = tip ? calcPoints({ h: tip.h, a: tip.a }, m.result) : null;
        const label = m.group ? `Gruppe ${m.group}` : m.phase;
        return (
          <div key={m._id} className={s.rRow}>
            <div className={s.rLeft}>
              <span className={s.rFlag}>{m.homeFlag}</span>
              <span className={s.rTeam}>{m.home}</span>
              <span className={s.rScore}>{m.result.h}:{m.result.a}</span>
              <span className={s.rTeam}>{m.away}</span>
              <span className={s.rFlag}>{m.awayFlag}</span>
            </div>
            <div className={s.rRight}>
              {tip ? (
                <>
                  <div className={s.rTipLbl}>{tip.h}:{tip.a}</div>
                  <span className={`${s.rPts} ${PTS_CLS[pts] ?? ""}`}>
                    {PTS_LBL[pts]} · {pts} Pkt
                  </span>
                </>
              ) : (
                <span className={s.rTipLbl} style={{ fontStyle: "italic" }}>Kein Tipp</span>
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
    <div className={s.miniBoard}>
      {top5.map((p, i) => (
        <div key={p.id} className={`${s.mbRow}${p.id === currentUserId ? " " + s.mbRowMe : ""}`}>
          <span className={s.mbRank}>{i < 3 ? MEDALS[i] : i + 1}</span>
          <span className={s.mbName}>{p.name}{p.id === currentUserId && " (Du)"}</span>
          <span className={s.mbPts}>{p.pts}</span>
        </div>
      ))}
      {showMe && (
        <>
          <div className={s.mbSep}>· · ·</div>
          <div className={`${s.mbRow} ${s.mbRowMe}`}>
            <span className={s.mbRank}>{myIdx + 1}</span>
            <span className={s.mbName}>{myEntry.name} (Du)</span>
            <span className={s.mbPts}>{myEntry.pts}</span>
          </div>
        </>
      )}
    </div>
  );
}

function GroupsPreview({ standings }) {
  return (
    <div className={s.homeSec}>
      <div className={s.homeSecTitle}>
        📊 Gruppen
        <Link href="/gruppen" style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--gold)", textDecoration: "none" }}>
          Alle →
        </Link>
      </div>
      <div className={s.miniGrpGrid}>
        {ALL_GROUPS.filter(g => standings[g]).map(g => (
          <Link key={g} href="/gruppen" className={s.miniGrpCard}>
            <div className={s.miniGrpTitle}>Gruppe {g}</div>
            {standings[g].map((team, i) => (
              <div key={team.team} className={`${s.miniGrpRow}${i < 2 ? " " + s.miniGrpQual : ""}`}>
                <span className={s.miniGrpPos}>{i + 1}</span>
                <span className={s.miniGrpFlag}>{team.flag}</span>
                <span className={s.miniGrpName}>{team.team}</span>
                <span className={s.miniGrpPts}>{team.pts}</span>
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
      <div className={s.homeSecTitle}>📋 Spielregeln</div>

      <div className={s.rulesGrid}>
        <div className={s.ruleCard}>
          <div className={s.ruleCardTop}>
            <span className={`${s.legendChip} ${s.pts3}`}>3 Punkte</span>
          </div>
          <div className={s.ruleCardBody}>Richtiges Ergebnis – genaue Tore für beide Teams.</div>
        </div>
        <div className={s.ruleCard}>
          <div className={s.ruleCardTop}>
            <span className={`${s.legendChip} ${s.pts2}`}>2 Punkte</span>
          </div>
          <div className={s.ruleCardBody}>Richtige Tordifferenz – nur bei Sieg oder Niederlage (nicht bei Unentschieden).</div>
        </div>
        <div className={s.ruleCard}>
          <div className={s.ruleCardTop}>
            <span className={`${s.legendChip} ${s.pts1}`}>1 Punkt</span>
          </div>
          <div className={s.ruleCardBody}>Richtige Tendenz – Sieg, Unentschieden oder Niederlage korrekt vorhergesagt.</div>
        </div>
      </div>

      <hr className={s.ruleDivider} />

      <div className={s.ruleExtra}>
        <div className={s.ruleExtraRow}>
          <span className={s.ruleExtraIcon}>⏰</span>
          <span>Tipps müssen <strong>60 Minuten vor Anpfiff</strong> abgegeben werden. Danach ist kein Tipp mehr möglich.</span>
        </div>
        <div className={s.ruleExtraRow}>
          <span className={s.ruleExtraIcon}>👁</span>
          <span>Die Tipps der anderen Spieler sind erst nach dem Ablauf der Deadline sichtbar.</span>
        </div>
        <div className={s.ruleExtraRow}>
          <span className={s.ruleExtraIcon}>⚠️</span>
          <span>Verspätete Tipps können per Anfrage eingereicht werden – ein Admin muss sie genehmigen.</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ nextMatches, recentResults, board, myTipsMap, currentUserId, groupStandings }) {
  const router = useRouter();
  return (
    <>
      <Head><title>WM Tippspiel 2026</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>

          <div className={s.homeHero}>
            <div className={s.homeTitle}>WM <span>TIPPSPIEL</span> 2026</div>
            <div className={s.homeSub}>11. Juni – 19. Juli 2026 · USA, Kanada &amp; Mexiko</div>
          </div>

          <div className={s.homeGrid}>
            {/* left: upcoming */}
            <motion.div
              className={`${s.homeSec} ${s.homeSecLink}`}
              onClick={() => router.push("/tipps")} role="link" tabIndex={0}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: 0.05 }}
            >
              <div className={s.homeSecTitle}>
                ⏳ Nächste Spiele
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
                🏆 Rangliste
                <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--gold)" }}>Alle →</span>
              </div>
              <MiniLeaderboard board={board} currentUserId={currentUserId} />
            </motion.div>
          </div>

          {/* recent results full width */}
          <motion.div
            className={s.homeSec}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut", delay: 0.15 }}
          >
            <div className={s.homeSecTitle}>⚽ Letzte Ergebnisse</div>
            <RecentResults results={recentResults} myTipsMap={myTipsMap} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: "easeOut", delay: 0.2 }}
          >
            <GroupsPreview standings={groupStandings} />
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

  const [rawNext, rawRecent, users, allFinished, allTips, rawGroupMatches] = await Promise.all([
    Match.find({ finished: false }).sort({ kickoff: 1 }).limit(4).lean(),
    Match.find({ finished: true  }).sort({ kickoff: -1 }).limit(5).lean(),
    User.find().lean(),
    Match.find({ finished: true }).lean(),
    Tip.find({ lateStatus: { $in: [null, "approved"] } }).lean(),
    Match.find({ group: { $ne: null } }).sort({ kickoff: 1 }).lean(),
  ]);

  // tips map for the current user (next + recent matches)
  const relevantIds = new Set([...rawNext, ...rawRecent].map(m => m._id.toString()));
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

  return {
    props: {
      nextMatches:    rawNext.map(serializeMatch),
      recentResults:  rawRecent.map(serializeMatch),
      board,
      myTipsMap,
      currentUserId: userId,
      groupStandings,
    },
  };
}
