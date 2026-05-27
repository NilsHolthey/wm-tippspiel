import { useState, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import Stepper from "./MatchCard/Stepper";
import { calcPoints } from "../lib/scoring";
import s from "./MatchSheet.module.css";

const LOCK_MIN = 60;
function isDeadlinePast(kickoff) {
  return Date.now() >= new Date(kickoff).getTime() - LOCK_MIN * 60 * 1000;
}
const KO_HEADERS = { 18: "Runde der 32", 19: "Achtelfinale", 20: "Viertelfinale", 21: "Halbfinale", 22: "Spiel um Platz 3", 23: "Finale" };

export default function MatchSheet({ match, myTip: myTipProp, otherTips = [], prevId, nextId, prevDayId, nextDayId, onClose, onNavigate, onTipSaved }) {
  const dragControls = useDragControls();
  const [h, setH] = useState(myTipProp?.h ?? 0);
  const [a, setA] = useState(myTipProp?.a ?? 0);
  const [myTip, setMyTip] = useState(myTipProp);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setH(myTipProp?.h ?? 0);
    setA(myTipProp?.a ?? 0);
    setMyTip(myTipProp);
    setDone(false);
    setSaving(false);
  }, [match._id]);

  // lock body scroll while open
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, []);

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
      setDone(true);
      setMyTip(newTip);
      onTipSaved?.(match._id, newTip);
    } catch {
      alert("Fehler beim Speichern. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  }

  const kickoffDate = new Date(match.kickoff);
  const dateStr = kickoffDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })
    + " · " + kickoffDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const phaseLabel = KO_HEADERS[match.matchday] ?? `Spieltag ${match.matchday}`;

  return (
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

      <div className={s.content}>
        <div className={s.mpMeta}>
          <span className={s.mpDay}>{phaseLabel}</span>
          {match.group && <span className={s.mpGroup}>Gruppe {match.group}</span>}
          <span className={s.mpDate}>{dateStr}</span>
        </div>

        <div className={s.mpTeams}>
          <div className={s.mpTeamCol}>
            <span className={s.mpFlag}>{match.homeFlag}</span>
            <span className={s.mpName}>{match.home}</span>
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
            {match.awayForm?.length > 0 && (
              <div className={s.mpForm}>
                {match.awayForm.map((r, i) => (
                  <span key={i} className={`${s.mpFormDot} ${s[`mpForm${r}`]}`}>{r}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={s.navSection}>
          <div className={s.navLabel}>Spiel</div>
          <div className={s.matchNav}>
            <button className={s.matchNavBtn} onClick={() => onNavigate(prevId)} disabled={!prevId}>
              ← Vorheriges
            </button>
            <button className={s.matchNavBtn} onClick={() => onNavigate(nextId)} disabled={!nextId}>
              Nächstes →
            </button>
          </div>
        </div>

        {isLate && (
          <div className={s.mpLate}>⚠️ Deadline abgelaufen — Admin muss diesen Tipp bestätigen</div>
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
              {done ? "✓ Gespeichert!" : saving ? "Speichert…" : isLate ? "Anfrage senden" : myTip ? "Tipp aktualisieren" : "Tipp speichern"}
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

        <div className={s.navSection}>
          <div className={s.navLabel}>Spieltag</div>
          <div className={s.dayNav}>
            <button className={s.dayNavBtn} onClick={() => onNavigate(prevDayId)} disabled={!prevDayId}>
              ← Vorheriger
            </button>
            <button className={s.dayNavBtn} onClick={() => onNavigate(nextDayId)} disabled={!nextDayId}>
              Nächster →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
