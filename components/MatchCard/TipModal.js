import { useState, useEffect } from "react";
import Stepper from "./Stepper";
import { IconWarning, IconCheck } from "../Icons";
import s from "./TipModal.module.css";

function pill(label, cls) {
  return <span style={{ fontSize:"0.62rem", letterSpacing:"0.07em", textTransform:"uppercase", borderRadius:"4px", padding:"2px 6px", background:"var(--d4)", color: cls === "day" ? "var(--gold)" : "var(--muted)" }}>{label}</span>;
}

export default function TipModal({ match, myTip, onClose, onSaved, onPrev, onNext }) {
  const isLate = match.isLate;
  const [h, setH] = useState(myTip?.h ?? 0);
  const [a, setA] = useState(myTip?.a ?? 0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setH(myTip?.h ?? 0);
    setA(myTip?.a ?? 0);
    setDone(false);
  }, [match._id]);

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft"  && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext]);

  function overlayClick(e) { if (e.target === e.currentTarget) onClose(); }

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match._id, h, a }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      setDone(true);
      onSaved?.({ h, a, lateStatus: isLate ? "pending" : null });
      setTimeout(onClose, 1400);
    } catch {
      alert("Fehler beim Speichern. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  }

  const kickoffDate = new Date(match.kickoff);
  const dateStr = kickoffDate.toLocaleDateString("de-DE", { weekday:"short", day:"2-digit", month:"2-digit" })
    + "  " + kickoffDate.toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit" });

  return (
    <div className={s.overlay} onClick={overlayClick}>
      <div className={s.modal}>

        <div className={s.header}>
          <button
            className={`${s.navBtn}${!onPrev ? " " + s.navBtnDisabled : ""}`}
            onClick={onPrev ?? undefined}
            disabled={!onPrev}
            aria-label="Vorheriges Spiel"
          >
            ←
          </button>

          <div className={s.headerMeta}>
            {pill(`Spieltag ${match.matchday}`, "day")}
            {match.group && pill(`Gruppe ${match.group}`, "grp")}
            <span style={{ fontSize:"0.76rem", color:"var(--muted)" }}>{dateStr}</span>
          </div>

          <div className={s.headerActions}>
            <button
              className={`${s.navBtn}${!onNext ? " " + s.navBtnDisabled : ""}`}
              onClick={onNext ?? undefined}
              disabled={!onNext}
              aria-label="Nächstes Spiel"
            >
              →
            </button>
            <button className={s.close} onClick={onClose}>✕</button>
          </div>
        </div>

        <div className={s.teams}>
          <div className={s.teamHome}>
            <span className={s.flag}>{match.homeFlag}</span>
            <span className={s.teamName}>{match.home}</span>
            {match.homeForm?.length > 0 && (
              <div className={s.form}>
                {match.homeForm.map((r, i) => (
                  <span key={i} className={`${s.formDot} ${s[`form${r}`]}`}>{r}</span>
                ))}
              </div>
            )}
          </div>
          <div className={s.resultWrap}>
            {match.finished
              ? <span className={s.result}>{match.result.h} : {match.result.a}</span>
              : <span className={s.vs}>–:–</span>}
          </div>
          <div className={s.teamAway}>
            <span className={s.flag}>{match.awayFlag}</span>
            <span className={s.teamName}>{match.away}</span>
            {match.awayForm?.length > 0 && (
              <div className={s.form}>
                {match.awayForm.map((r, i) => (
                  <span key={i} className={`${s.formDot} ${s[`form${r}`]}`}>{r}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLate && (
          <div className={s.lateWarning}>
            <IconWarning size={15} style={{ flexShrink: 0 }} />
            Deadline abgelaufen — Admin muss diesen Tipp bestätigen
          </div>
        )}

        {!match.finished ? (
          <div className={s.tipping}>
            <div className={s.tippingLabel}>Dein Tipp</div>
            <div className={s.steppersRow}>
              <div className={s.stepperGroup}>
                <span className={s.stepperTeamLbl}>{match.home}</span>
                <Stepper value={h} onChange={setH} />
              </div>
              <span className={s.colon}>:</span>
              <div className={s.stepperGroup}>
                <span className={s.stepperTeamLbl}>{match.away}</span>
                <Stepper value={a} onChange={setA} />
              </div>
            </div>

            <button
              className={`${s.submitBtn}${isLate ? " " + s.submitLate : ""}${done ? " " + s.submitDone : ""}`}
              onClick={submit}
              disabled={done || saving}
            >
              {done ? <><IconCheck size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Gespeichert!</> : saving ? "Speichert…" : isLate ? "Anfrage senden" : myTip ? "Tipp aktualisieren" : "Tipp speichern"}
            </button>
          </div>
        ) : (
          <div className={s.finishedNote}>
            Spiel beendet
          </div>
        )}

      </div>
    </div>
  );
}
