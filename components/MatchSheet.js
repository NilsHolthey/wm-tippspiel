import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useDragControls, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { flushSync } from "react-dom";
import Stepper from "./MatchCard/Stepper";
import { calcPoints } from "../lib/scoring";
import { calcStandings } from "../lib/standings";
import { IconWarning, IconCheck } from "./Icons";
import { haptic } from "../utils/haptic";
import s from "./MatchSheet.module.css";

const LOCK_MIN = 60;
function isDeadlinePast(kickoff) {
  return Date.now() >= new Date(kickoff).getTime() - LOCK_MIN * 60 * 1000;
}
const KO_HEADERS = { 18: "Runde der 32", 19: "Achtelfinale", 20: "Viertelfinale", 21: "Halbfinale", 22: "Spiel um Platz 3", 23: "Finale" };

const TableIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="1" y="1" width="14" height="14" rx="2"/>
    <line x1="1" y1="5.5" x2="15" y2="5.5"/>
    <line x1="1" y1="10.5" x2="15" y2="10.5"/>
    <line x1="5.5" y1="1" x2="5.5" y2="15"/>
  </svg>
);

export default function MatchSheet({ match, myTip: myTipProp, otherTips = [], groupMatches = [], prevId, nextId, prevDayId, nextDayId, onClose, onNavigate, onTipSaved }) {
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const swipeRef = useRef({ x: null, y: null });
  const [h, setH] = useState(myTipProp?.h ?? 0);
  const [a, setA] = useState(myTipProp?.a ?? 0);
  const [myTip, setMyTip] = useState(myTipProp);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    x.set(0);
    setH(myTipProp?.h ?? 0);
    setA(myTipProp?.a ?? 0);
    setMyTip(myTipProp);
    setDone(false);
    setSaving(false);
    setShowTable(false);
  }, [match._id]);

  // lock body scroll + haptic on open
  useEffect(() => {
    haptic(6);
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, []);

  const groupRows = useMemo(() => {
    if (!match.group || !groupMatches.length) return null;
    const standings = calcStandings(groupMatches);
    return standings[match.group] ?? null;
  }, [match.group, groupMatches]);

  const homePos  = groupRows ? groupRows.findIndex(r => r.team === match.home)  + 1 : null;
  const awayPos  = groupRows ? groupRows.findIndex(r => r.team === match.away)  + 1 : null;
  const homeRow  = groupRows ? groupRows.find(r => r.team === match.home)  : null;
  const awayRow  = groupRows ? groupRows.find(r => r.team === match.away)  : null;

  const locked = isDeadlinePast(match.kickoff);
  const isLate = locked && !match.finished;
  const hasTip = !!myTip && myTip.lateStatus !== "pending";
  const tipsVisible = match.finished || (locked && hasTip);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match._id, h, a }),
      });
      if (!res.ok) throw new Error();
      const newTip = { h, a, lateStatus: isLate ? "pending" : null };
      haptic(10);
      setDone(true);
      setMyTip(newTip);
      onTipSaved?.(match._id, newTip);
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3500);
    } finally {
      setSaving(false);
    }
  }

  function handleSwipeStart(e) {
    swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleSwipeMove(e) {
    if (swipeRef.current.x === null) return;
    const dx = e.touches[0].clientX - swipeRef.current.x;
    const dy = e.touches[0].clientY - swipeRef.current.y;
    if (Math.abs(dx) > Math.abs(dy)) x.set(dx * 0.25);
  }

  async function handleSwipeEnd(e) {
    if (swipeRef.current.x === null) return;
    const dx = e.changedTouches[0].clientX - swipeRef.current.x;
    const dy = e.changedTouches[0].clientY - swipeRef.current.y;
    swipeRef.current = { x: null, y: null };

    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const goNext = nextId ?? nextDayId;
      const goPrev = prevId ?? prevDayId;
      if (dx < 0 && goNext) {
        await animate(x, -600, { duration: 0.2, ease: [0.4, 0, 1, 1] });
        x.set(600);
        flushSync(() => onNavigate(goNext));
        animate(x, 0, { duration: 0.2, ease: [0, 0, 0.2, 1] });
        return;
      }
      if (dx > 0 && goPrev) {
        await animate(x, 600, { duration: 0.2, ease: [0.4, 0, 1, 1] });
        x.set(-600);
        flushSync(() => onNavigate(goPrev));
        animate(x, 0, { duration: 0.2, ease: [0, 0, 0.2, 1] });
        return;
      }
    }
    animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
  }

  const kickoffDate = new Date(match.kickoff);
  const dateStr = kickoffDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })
    + " · " + kickoffDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const phaseLabel = KO_HEADERS[match.matchday] ?? `Spieltag ${match.matchday}`;

  return (
    <>
    <motion.div
      className={s.backdrop}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    />
    <motion.div
      className={s.sheet}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.35 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 120 || info.velocity.y > 500) onClose();
      }}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 280 }}
    >
      <div
        className={s.dragZone}
        onPointerDown={(e) => { if (!e.target.closest("button")) dragControls.start(e); }}
      >
        <div className={s.handleWrap}>
          <div className={s.handle} />
        </div>
        <div className={s.header}>
          <button className={s.back} onClick={onClose}>← Zurück</button>
        </div>
      </div>

      <div
        className={s.content}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
      >
        <div className={s.mpMeta}>
          <span className={s.mpDay}>{phaseLabel}</span>
          {match.group && <span className={s.mpGroup}>Gruppe {match.group}</span>}
          {groupRows && (
            <button
              className={`${s.tableBtn}${showTable ? " " + s.tableBtnActive : ""}`}
              onClick={() => setShowTable(v => !v)}
            >
              <TableIcon />
              Tabelle
            </button>
          )}
        </div>

        <motion.div className={s.mpTeams} style={{ x }}>
          {(prevId || prevDayId) && <span className={s.swipeHintL}>‹</span>}
          {(nextId || nextDayId) && <span className={s.swipeHintR}>›</span>}
          <div className={s.mpCardDate}>{dateStr}</div>
          <div className={s.mpTeamsRow}>
          <div className={s.mpTeamCol}>
            <span className={s.mpFlag}>{match.homeFlag}</span>
            <span className={s.mpName}>{match.home}</span>
            {homePos && (
              <span className={`${s.mpRank}${homePos <= 2 ? " " + s.mpRankQual : ""}`}>{homePos}. Platz</span>
            )}
            {match.homeForm?.length > 0 && (
              <div className={s.mpForm}>
                {match.homeForm.map((r, i) => (
                  <span key={i} className={`${s.mpFormDot} ${s[`mpForm${r}`]}`}>{r}</span>
                ))}
              </div>
            )}
          </div>
          <div className={s.mpScore}>
            {match.finished
              ? <span className={s.mpResult}>{match.result.h} : {match.result.a}</span>
              : <span className={s.mpVs}>–:–</span>}
          </div>
          <div className={`${s.mpTeamCol} ${s.mpTeamAway}`}>
            <span className={s.mpFlag}>{match.awayFlag}</span>
            <span className={s.mpName}>{match.away}</span>
            {awayPos && (
              <span className={`${s.mpRank}${awayPos <= 2 ? " " + s.mpRankQual : ""}`}>{awayPos}. Platz</span>
            )}
            {match.awayForm?.length > 0 && (
              <div className={s.mpForm}>
                {match.awayForm.map((r, i) => (
                  <span key={i} className={`${s.mpFormDot} ${s[`mpForm${r}`]}`}>{r}</span>
                ))}
              </div>
            )}
          </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showTable && groupRows && (
            <motion.div
              className={s.tableWrap}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <div className={s.table}>
                <div className={`${s.tableRow} ${s.tableHead}`}>
                  <span className={s.tableTeamCol} />
                  <span className={s.tableNum}>Sp</span>
                  <span className={s.tableNum}>S</span>
                  <span className={s.tableNum}>U</span>
                  <span className={s.tableNum}>N</span>
                  <span className={s.tableNum}>T</span>
                  <span className={s.tableNum}>±</span>
                  <span className={`${s.tableNum} ${s.tablePts}`}>P</span>
                </div>
                {groupRows.map((r, i) => (
                  <div
                    key={r.team}
                    className={`${s.tableRow}${i < 2 ? " " + s.tableQual : ""}${
                      r.team === match.home || r.team === match.away ? " " + s.tableHighlight : ""
                    }`}
                  >
                    <span className={s.tableTeamCol}>
                      <span className={s.tableRank}>{i + 1}</span>
                      <span className={s.tableFlag}>{r.flag}</span>
                      <span className={s.tableName}>{r.team}</span>
                    </span>
                    <span className={s.tableNum}>{r.played}</span>
                    <span className={s.tableNum}>{r.won}</span>
                    <span className={s.tableNum}>{r.drawn}</span>
                    <span className={s.tableNum}>{r.lost}</span>
                    <span className={s.tableNum}>{r.gf}:{r.ga}</span>
                    <span className={s.tableNum}>{r.gf - r.ga > 0 ? "+" : ""}{r.gf - r.ga}</span>
                    <span className={`${s.tableNum} ${s.tablePts}`}>{r.pts}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={s.navSection}>
          <div className={s.matchNav}>
            <button className={s.matchNavBtn} onClick={() => onNavigate(prevId ?? prevDayId)} disabled={!prevId && !prevDayId}>
              ← Vorheriges
            </button>
            <button className={s.matchNavBtn} onClick={() => onNavigate(nextId ?? nextDayId)} disabled={!nextId && !nextDayId}>
              Nächstes →
            </button>
          </div>
        </div>

        {isLate && (
          <div className={s.mpLate} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconWarning size={15} style={{ flexShrink: 0 }} />
            Deadline abgelaufen — Admin muss diesen Tipp bestätigen
          </div>
        )}

        {!match.finished ? (
          <div className={s.mpTipping}>
            <div className={s.mpTipLabel}>Dein Tipp</div>
            <div className={s.mpSteppers}>
              <div className={s.mpStepGroup}>
                <span className={s.mpStepLbl}>{match.home}</span>
                <Stepper value={h} onChange={setH} />
              </div>
              <span className={s.mpColon}>:</span>
              <div className={s.mpStepGroup}>
                <span className={s.mpStepLbl}>{match.away}</span>
                <Stepper value={a} onChange={setA} />
              </div>
            </div>
            <button
              className={`${s.mpSubmit}${isLate ? " " + s.mpSubmitLate : ""}${done ? " " + s.mpSubmitDone : ""}`}
              onClick={submit}
              disabled={done || saving}
            >
              {done ? <><IconCheck size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Gespeichert!</> : saving ? "Speichert…" : isLate ? "Anfrage senden" : myTip ? "Tipp aktualisieren" : "Tipp speichern"}
            </button>
          </div>
        ) : (
          <div className={s.mpFinished}>Spiel beendet</div>
        )}

        {tipsVisible && otherTips.length > 0 && (
          <div className={s.mpOthers}>
            <div className={s.mpOthersTitle}>Alle Tipps</div>
            {otherTips.map((o, i) => (
              <div key={i} className={s.mpOtherRow}>
                <span className={s.mpOtherName}>{o.name}</span>
                <span className={s.mpOtherTip}>{o.h} : {o.a}</span>
                {match.finished && (
                  <span className={`${s.mpOtherPts} ${s[`mpPts${calcPoints({ h: o.h, a: o.a }, match.result)}`]}`}>
                    {calcPoints({ h: o.h, a: o.a }, match.result)} Pkt
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </motion.div>

    <AnimatePresence>
      {saveError && (
        <motion.div
          className={s.errorToast}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <IconWarning size={14} style={{ flexShrink: 0 }} />
          Fehler beim Speichern – bitte erneut versuchen
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
