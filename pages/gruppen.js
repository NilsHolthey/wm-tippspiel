import Head from "next/head";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useTippsData } from "../hooks/useTippsData";
import { shortName } from "../lib/teamNames";
import { calcStandings } from "../lib/standings";
import { calcPoints } from "../lib/scoring";
import MatchSheet from "../components/MatchSheet";
import KOBracket from "../components/KOBracket";
import PageHeader from "../components/PageHeader";
import s from "../styles/Page.module.css";
import g from "../styles/Gruppen.module.css";
import { GROUPS } from "../lib/constants";
import { formatDate } from "../lib/format";

function StandingsTable({ rows }) {
  return (
    <div className={g.grpTable}>
      <div className={g.grpRow + " " + g.grpHead}>
        <span className={g.grpTeamCol} />
        <span className={g.grpNum}>Sp</span>
        <span className={g.grpNum}>S</span>
        <span className={g.grpNum}>U</span>
        <span className={g.grpNum}>N</span>
        <span className={g.grpNum}>T</span>
        <span className={g.grpNum}>±</span>
        <span className={`${g.grpNum} ${g.grpPts}`}>P</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.team} className={`${g.grpRow}${i < 2 ? " " + g.grpQual : ""}`}>
          <span className={g.grpTeamCol}>
            <span className={g.grpRank}>{i + 1}</span>
            <span className={g.grpFlag}>{r.flag}</span>
            <span className={g.grpTeam}>{r.team}</span>
          </span>
          <span className={g.grpNum}>{r.played}</span>
          <span className={g.grpNum}>{r.won}</span>
          <span className={g.grpNum}>{r.drawn}</span>
          <span className={g.grpNum}>{r.lost}</span>
          <span className={g.grpNum}>{r.gf}:{r.ga}</span>
          <span className={g.grpNum}>{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</span>
          <span className={`${g.grpNum} ${g.grpPts}`}>{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

const PTS_CLS = { 3: s.pts3, 2: s.pts2, 1: s.pts1 };

function MatchList({ matches, onOpen, myTipsMap, otherTipsMap }) {
  if (!matches.length) return null;
  return (
    <div className={g.grpMatches}>
      {matches.map(m => {
        const tip = myTipsMap?.[m._id];
        const hasTip = tip && tip.lateStatus !== "pending";
        const others = m.finished ? (otherTipsMap?.[m._id] ?? []) : [];
        return (
          <div
            key={m._id}
            className={`${g.grpMatch}${m.finished ? " " + g.grpMatchDone : ""}`}
            onClick={() => onOpen(m._id)}
          >
            <div className={g.grpMatchMeta}>
              <span className={g.grpMatchDate}>{formatDate(m.kickoff)}</span>
              {hasTip && (() => {
                const pts = m.finished ? calcPoints({ h: tip.h, a: tip.a }, m.result) : null;
                const ptsCls = pts != null ? (PTS_CLS[pts] ?? g.grpMatchOtherMuted) : "";
                return (
                  <span
                    className={`${g.grpMatchTip} ${ptsCls}`}
                    style={pts == null ? { color: "var(--gold)" } : undefined}
                  >
                    Du {tip.h}:{tip.a}
                  </span>
                );
              })()}
            </div>
            <div className={g.grpMatchTeams}>
              <div className={g.grpMatchHome}>
                <span className={g.grpMatchFlag}>{m.homeFlag}</span>
                <span className={g.grpMatchName}>{m.home}</span>
              </div>
              {m.finished
                ? <span className={g.grpMatchScore}>{m.result.h} : {m.result.a}</span>
                : <span className={g.grpMatchVs}>–:–</span>}
              <div className={g.grpMatchAway}>
                <span className={g.grpMatchName}>{m.away}</span>
                <span className={g.grpMatchFlag}>{m.awayFlag}</span>
              </div>
            </div>
            {others.length > 0 && (
              <div className={g.grpMatchOthers}>
                {others.map((o, i) => {
                  const pts = calcPoints({ h: o.h, a: o.a }, m.result);
                  return (
                    <span key={i} className={`${g.grpMatchOtherChip} ${PTS_CLS[pts] ?? g.grpMatchOtherMuted}`}>
                      {o.name} {o.h}:{o.a}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function GruppenPage({ groups, standings, koMatches }) {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const { matches: tipsMatches, myTipsMap, otherTipsMap, mutate } = useTippsData({
    active: status === "authenticated",
  });

  const [sheetId, setSheetId] = useState(null);
  const [view, setView] = useState("groups");

  if (status === "loading") return (
    <div className={s.app}>
      <div className={s.wrap}>
        <PageHeader.Skeleton style={{ marginBottom: 18 }} />
        <div className={g.grpGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={g.grpCard}>
              <div className={s.skeletonBlock} style={{ width: 80, height: 11, borderRadius: 4, marginBottom: 14 }} />
              {[...Array(4)].map((_, j) => (
                <div key={j} className={s.skeletonBlock} style={{ height: 22, borderRadius: 4, marginBottom: 5 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (status === "unauthenticated") return null;
  const sheetMatch = sheetId ? tipsMatches.find(m => m._id === sheetId) : null;

  // for KO matches opened via KOBracket, look them up from koMatches too
  const allKnownMatches = [...tipsMatches, ...(koMatches ?? [])];
  const sheetMatchResolved = sheetId
    ? (tipsMatches.find(m => m._id === sheetId) ?? koMatches?.find(m => m._id === sheetId) ?? null)
    : null;

  const allMatchdays = [...new Set(allKnownMatches.map(m => m.matchday))].sort((a, b) => a - b);
  const dayMatches = sheetMatchResolved
    ? allKnownMatches.filter(m => m.matchday === sheetMatchResolved.matchday).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
    : [];
  const sheetIdx = dayMatches.findIndex(m => m._id === sheetId);
  const prevId = sheetIdx > 0 ? dayMatches[sheetIdx - 1]._id : null;
  const nextId = sheetIdx < dayMatches.length - 1 ? dayMatches[sheetIdx + 1]._id : null;
  const sheetDayIdx = sheetMatchResolved ? allMatchdays.indexOf(sheetMatchResolved.matchday) : -1;
  const prevDayId = sheetDayIdx > 0
    ? allKnownMatches.filter(m => m.matchday === allMatchdays[sheetDayIdx - 1]).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0]?._id ?? null
    : null;
  const nextDayId = sheetDayIdx >= 0 && sheetDayIdx < allMatchdays.length - 1
    ? allKnownMatches.filter(m => m.matchday === allMatchdays[sheetDayIdx + 1]).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0]?._id ?? null
    : null;

  function handleTipSaved(matchId, tip) {
    mutate(prev => prev ? { ...prev, myTipsMap: { ...prev.myTipsMap, [matchId]: tip } } : prev, false);
  }

  return (
    <>
      <Head><title>Gruppen – WM Tippspiel</title></Head>
      <div className={s.app}>
        <div className={s.wrap}>
          <PageHeader style={{ marginBottom: 18 }}><span>GRUPPEN</span></PageHeader>

          {/* view toggle */}
          <div className={s.mdNav} style={{ marginBottom: 22 }}>
            <button
              className={`${s.mdPill}${view === "groups" ? " " + s.mdPillActive : ""}`}
              onClick={() => setView("groups")}
            >
              Gruppen
            </button>
            <button
              className={`${s.mdPill}${view === "ko" ? " " + s.mdPillActive : ""}`}
              onClick={() => setView("ko")}
            >
              KO-Runde
            </button>
          </div>

          {view === "groups" ? (
            <div className={g.grpGrid}>
              {GROUPS.filter(g => groups[g]).map((g, i) => (
                <motion.div
                  key={g}
                  className={g.grpCard}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut", delay: i * 0.05 }}
                >
                  <div className={g.grpCardTitle}>Gruppe {g}</div>
                  <StandingsTable rows={standings[g] ?? []} />
                  <MatchList matches={groups[g]} onOpen={setSheetId} myTipsMap={myTipsMap} otherTipsMap={otherTipsMap} />
                </motion.div>
              ))}
            </div>
          ) : (
            <KOBracket
              matches={koMatches ?? []}
              myTipsMap={myTipsMap}
              onOpen={setSheetId}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {sheetMatchResolved && (
          <MatchSheet
            match={sheetMatchResolved}
            myTip={myTipsMap[sheetId] ?? null}
            otherTips={otherTipsMap[sheetId] ?? []}
            groupMatches={sheetMatchResolved?.group ? allKnownMatches.filter(m => m.group === sheetMatchResolved.group) : []}
            prevId={prevId}
            nextId={nextId}
            prevDayId={prevDayId}
            nextDayId={nextDayId}
            onClose={() => setSheetId(null)}
            onNavigate={setSheetId}
            onTipSaved={handleTipSaved}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export async function getStaticProps() {
  try {
    const { connectDB } = await import("../lib/db");
    const { default: Match } = await import("../models/Match");

    await connectDB();

    const [rawMatches, rawKO] = await Promise.all([
      Match.find({ group: { $ne: null } }).sort({ kickoff: 1 }).lean(),
      Match.find({ group: null, matchday: { $gt: 17 } }).sort({ kickoff: 1 }).lean(),
    ]);

    const groups = {};
    for (const m of rawMatches) {
      if (!groups[m.group]) groups[m.group] = [];
      groups[m.group].push({
        _id: m._id.toString(),
        home: shortName(m.home), homeFlag: m.homeFlag ?? "",
        away: shortName(m.away), awayFlag: m.awayFlag ?? "",
        kickoff: m.kickoff.toISOString(),
        finished: m.finished,
        result: m.result ?? null,
        group: m.group,
      });
    }

    const standings = calcStandings(
      rawMatches.map(m => ({ ...m, _id: m._id.toString(), kickoff: m.kickoff.toISOString() }))
    );

    const koMatches = rawKO.map(m => ({
      _id: m._id.toString(),
      matchday: m.matchday,
      fixtureId: m.fixtureId ?? null,
      home: m.home, homeFlag: m.homeFlag ?? "",
      away: m.away, awayFlag: m.awayFlag ?? "",
      kickoff: m.kickoff.toISOString(),
      finished: m.finished,
      result: m.result ?? null,
      group: null,
      phase: m.phase ?? "",
    }));

    return { props: { groups, standings, koMatches }, revalidate: 60 };
  } catch (e) {
    return { props: { groups: {}, standings: {}, koMatches: [] }, revalidate: 30 };
  }
}
