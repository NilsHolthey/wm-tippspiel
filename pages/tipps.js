import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import Nav from "../components/Nav";
import MatchCard from "../components/MatchCard/MatchCard";
import TipModal from "../components/MatchCard/TipModal";
import s from "../styles/Page.module.css";
import { calcPoints } from "../lib/scoring";

const LOCK_MIN = 60;

const KO_LABELS  = { 18: "R32", 19: "AF", 20: "VF", 21: "HF", 22: "P3", 23: "FIN" };
const KO_HEADERS = { 18: "Runde der 32", 19: "Achtelfinale", 20: "Viertelfinale", 21: "Halbfinale", 22: "Spiel um Platz 3", 23: "Finale" };

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
  return sorted[sorted.length - 1];
}

export default function TippsPage({ matches = [], myTipsMap = {}, otherTipsMap = {}, defaultMatchday = 1 }) {
  const [selected, setSelected] = useState(defaultMatchday);
  const [myTipsState, setMyTipsState] = useState(myTipsMap);
  const [modalMatchId, setModalMatchId] = useState(null);
  const activePillRef = useRef(null);

  useEffect(() => {
    activePillRef.current?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [selected]);

  const allMatchdays = [...new Set(matches.map(m => m.matchday))].sort((a, b) => a - b);
  const groupStagedays = allMatchdays.filter(d => d <= 17);
  const koDays = allMatchdays.filter(d => d > 17);

  const selectedIdx = allMatchdays.indexOf(selected);
  const prevDay = selectedIdx > 0 ? allMatchdays[selectedIdx - 1] : null;
  const nextDay = selectedIdx < allMatchdays.length - 1 ? allMatchdays[selectedIdx + 1] : null;

  const allOpen = matches.filter(m => !m.finished);
  const tippedCount = allOpen.filter(m => myTipsState[m._id] && myTipsState[m._id].lateStatus !== "pending").length;

  const currentMatches = matches.filter(m => m.matchday === selected).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const isGroupStage = selected <= 17;
  const groups = isGroupStage ? [...new Set(currentMatches.map(m => m.group))].filter(Boolean).sort() : null;
  const sectionHeader = KO_HEADERS[selected] ?? `Spieltag ${selected}`;

  // modal navigation
  const modalMatch = modalMatchId ? currentMatches.find(m => m._id === modalMatchId) ?? null : null;
  const modalIdx   = modalMatch ? currentMatches.indexOf(modalMatch) : -1;
  const prevModalMatch = modalIdx > 0 ? currentMatches[modalIdx - 1] : null;
  const nextModalMatch = modalIdx < currentMatches.length - 1 ? currentMatches[modalIdx + 1] : null;

  function enrichForModal(match) {
    const locked  = isDeadlinePast(match.kickoff);
    const myTip   = myTipsState[match._id] ?? null;
    const hasTip  = !!myTip && myTip.lateStatus !== "pending";
    const tipsVisible = match.finished || (locked && hasTip);
    const others = (otherTipsMap[match._id] ?? []).map(o => ({
      ...o,
      pts: match.finished ? calcPoints({ h: o.h, a: o.a }, match.result) : null,
    }));
    return { ...match, isLate: locked && !match.finished, tipsVisible, others };
  }

  function handleTipSaved(newTip) {
    if (!modalMatchId) return;
    setMyTipsState(prev => ({ ...prev, [modalMatchId]: newTip }));
  }

  function renderCards(list) {
    return list.map(m => (
      <MatchCard
        key={m._id}
        match={m}
        myTip={myTipsState[m._id] ?? null}
        otherTips={otherTipsMap[m._id] ?? []}
        onOpen={() => setModalMatchId(m._id)}
      />
    ));
  }

  return (
    <>
      <Head><title>Tipps – WM Tippspiel</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph}>
            <div className={s.ptitle}>MEINE <span>TIPPS</span></div>
            {allOpen.length > 0 && (
              <div>
                <div className={s.progLbl}>{tippedCount} / {allOpen.length} getippt</div>
                <div className={s.progBar}>
                  <div className={s.progFill} style={{ width: `${(tippedCount / allOpen.length) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className={s.mdNav}>
            {groupStagedays.map(d => (
              <button
                key={d}
                ref={d === selected ? activePillRef : null}
                className={`${s.mdPill}${d === selected ? " " + s.mdPillActive : ""}`}
                onClick={() => setSelected(d)}
              >
                {d}
              </button>
            ))}
            {koDays.length > 0 && <div className={s.mdSep} />}
            {koDays.map(d => (
              <button
                key={d}
                ref={d === selected ? activePillRef : null}
                className={`${s.mdPill}${d === selected ? " " + s.mdPillActive : ""}`}
                onClick={() => setSelected(d)}
              >
                {KO_LABELS[d] ?? d}
              </button>
            ))}
          </div>

          <div className={s.mdDayNav}>
            {prevDay ? (
              <button className={s.mdDayBtn} onClick={() => setSelected(prevDay)}>
                <span className={s.mdDayBtnArrow}>←</span>
                {KO_HEADERS[prevDay] ?? `Spieltag ${prevDay}`}
              </button>
            ) : <span />}
            {nextDay ? (
              <button className={s.mdDayBtn} onClick={() => setSelected(nextDay)}>
                {KO_HEADERS[nextDay] ?? `Spieltag ${nextDay}`}
                <span className={s.mdDayBtnArrow}>→</span>
              </button>
            ) : <span />}
          </div>

          {isGroupStage ? (
            <div>
              {(groups ?? [null]).map(grp => {
                const grpMatches = grp ? currentMatches.filter(m => m.group === grp) : currentMatches;
                return (
                  <div key={grp ?? "all"}>
                    {grp && <div className={s.slbl}>Gruppe {grp}</div>}
                    <div className={s.mlist}>{renderCards(grpMatches)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className={s.slbl}>{sectionHeader}</div>
              <div className={s.mlist}>{renderCards(currentMatches)}</div>
            </div>
          )}
        </div>
      </div>

      {modalMatch && (
        <TipModal
          match={enrichForModal(modalMatch)}
          myTip={myTipsState[modalMatch._id] ?? null}
          onClose={() => setModalMatchId(null)}
          onSaved={handleTipSaved}
          onPrev={prevModalMatch ? () => setModalMatchId(prevModalMatch._id) : null}
          onNext={nextModalMatch ? () => setModalMatchId(nextModalMatch._id) : null}
        />
      )}
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { connectDB } = await import("../lib/db");
  const { default: Match } = await import("../models/Match");
  const { default: Tip } = await import("../models/Tip");

  await connectDB();
  const userId = session.user.id;

  const rawMatches = await Match.find().sort({ kickoff: 1 }).lean();
  const tips = await Tip.find().populate("user", "username").lean();

  // build form per team from finished matches (chronological order → last 5)
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

  for (const tip of tips) {
    if (!tip.user) continue;
    const mId = tip.match.toString();
    if (tip.user._id.toString() === userId) {
      myTipsMap[mId] = { h: tip.h, a: tip.a, lateStatus: tip.lateStatus };
    } else {
      const match = rawMatches.find(m => m._id.toString() === mId);
      if (!match) continue;
      if (isDeadlinePast(match.kickoff) && (tip.lateStatus === null || tip.lateStatus === "approved")) {
        if (!otherTipsMap[mId]) otherTipsMap[mId] = [];
        otherTipsMap[mId].push({ name: tip.user.username, h: tip.h, a: tip.a });
      }
    }
  }

  const matches = rawMatches.map(m => ({
    _id: m._id.toString(),
    matchday: m.matchday,
    group: m.group ?? null,
    phase: m.phase || "Gruppenphase",
    home: m.home,
    homeFlag: m.homeFlag ?? "",
    homeForm: form5(m.home),
    away: m.away,
    awayFlag: m.awayFlag ?? "",
    awayForm: form5(m.away),
    kickoff: m.kickoff.toISOString(),
    finished: m.finished,
    result: m.result ?? null,
  }));

  return {
    props: {
      matches,
      myTipsMap,
      otherTipsMap,
      defaultMatchday: getDefaultMatchday(matches),
    },
  };
}
