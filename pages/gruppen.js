import Head from "next/head";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { shortName } from "../lib/teamNames";
import { calcStandings } from "../lib/standings";
import Nav from "../components/Nav";
import MatchSheet from "../components/MatchSheet";
import KOBracket from "../components/KOBracket";
import s from "../styles/Page.module.css";

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const fetcher = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(); return r.json(); });


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

function MatchList({ matches, onOpen, myTipsMap }) {
  if (!matches.length) return null;
  return (
    <div className={s.grpMatches}>
      {matches.map(m => {
        const tip = myTipsMap?.[m._id];
        const hasTip = tip && tip.lateStatus !== "pending";
        return (
          <div
            key={m._id}
            className={`${s.grpMatch}${m.finished ? " " + s.grpMatchDone : ""}`}
            onClick={() => onOpen(m._id)}
          >
            <div className={s.grpMatchMeta}>
              <span className={s.grpMatchDate}>{formatDate(m.kickoff)}</span>
              {hasTip && (
                <span className={s.grpMatchTip}>{tip.h}:{tip.a}</span>
              )}
            </div>
            <div className={s.grpMatchTeams}>
              <div className={s.grpMatchHome}>
                <span className={s.grpMatchFlag}>{m.homeFlag}</span>
                <span className={s.grpMatchName}>{m.home}</span>
              </div>
              {m.finished
                ? <span className={s.grpMatchScore}>{m.result.h} : {m.result.a}</span>
                : <span className={s.grpMatchVs}>–:–</span>}
              <div className={s.grpMatchAway}>
                <span className={s.grpMatchName}>{m.away}</span>
                <span className={s.grpMatchFlag}>{m.awayFlag}</span>
              </div>
            </div>
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

  const { data: tipsData, mutate } = useSWR(
    status === "authenticated" ? "/api/tipps/data" : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 30000 }
  );
  const tipsMatches = tipsData?.matches ?? [];
  const myTipsMap = tipsData?.myTipsMap ?? {};
  const otherTipsMap = tipsData?.otherTipsMap ?? {};

  const [sheetId, setSheetId] = useState(null);
  const [view, setView] = useState("groups");

  if (status === "loading" || status === "unauthenticated") return null;
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
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph} style={{ marginBottom: 18 }}>
            <div className={s.ptitle}><span>GRUPPEN</span></div>
          </div>

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
            <div className={s.grpGrid}>
              {GROUPS.filter(g => groups[g]).map((g, i) => (
                <motion.div
                  key={g}
                  className={s.grpCard}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut", delay: i * 0.05 }}
                >
                  <div className={s.grpCardTitle}>Gruppe {g}</div>
                  <StandingsTable rows={standings[g] ?? []} />
                  <MatchList matches={groups[g]} onOpen={setSheetId} myTipsMap={myTipsMap} />
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
