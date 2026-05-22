import { useState } from "react";
import TipModal from "./TipModal";
import s from "./MatchCard.module.css";
import { calcPoints } from "../../lib/scoring";

const PTS_CLS = { 3: s.pts3, 2: s.pts2, 1: s.pts1, 0: s.pts0 };
const PTS_LBL = { 3: "✅ Treffer", 2: "〰 Differenz", 1: "↗ Tendenz", 0: "✗ Daneben" };

const LOCK_MINUTES = 60;

function isLocked(kickoff) {
  return Date.now() >= new Date(kickoff).getTime() - LOCK_MINUTES * 60 * 1000;
}

function isUrgent(kickoff) {
  const ms = new Date(kickoff).getTime() - Date.now();
  return ms > 0 && ms < LOCK_MINUTES * 60 * 1000;
}

function formatKickoff(kickoff) {
  const d = new Date(kickoff);
  const day = d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${day}  ${time}`;
}

function countdownStr(kickoff) {
  const ms = new Date(kickoff).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `noch ${h}h ${m}min`;
  return `noch ${m}min`;
}

export default function MatchCard({ match, myTip: initialTip, otherTips = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [myTip, setMyTip] = useState(initialTip ?? null);

  const locked      = isLocked(match.kickoff);
  const urgent      = isUrgent(match.kickoff);
  const hasTip      = !!myTip && myTip.lateStatus !== "pending";
  const latePending = myTip?.lateStatus === "pending";
  const noTip       = !myTip && !urgent;
  const tipsVisible = locked || match.finished;

  const points = match.finished && hasTip
    ? calcPoints({ h: myTip.h, a: myTip.a }, match.result)
    : null;

  const countdown = !locked && !match.finished ? countdownStr(match.kickoff) : null;

  let cardClass = s.card;
  if (match.finished)  cardClass += " " + s.finished;
  if (latePending)     cardClass += " " + s.pendingLate;
  if (noTip && !match.finished) cardClass += " " + s.noTip;

  const othersWithPts = otherTips.map((o) => ({
    ...o,
    pts: match.finished ? calcPoints({ h: o.h, a: o.a }, match.result) : null,
  }));

  const enrichedMatch = { ...match, isLate: locked && !match.finished, tipsVisible, others: othersWithPts };

  function handleSaved(newTip) {
    setMyTip(newTip);
  }

  return (
    <>
      <div className={cardClass} onClick={() => setModalOpen(true)}>
        <div className={s.inner}>
          <div className={s.meta}>
            {match.phase === "Gruppenphase"
              ? match.group && <span className={`${s.pill} ${s.pillGrp}`}>Gruppe {match.group}</span>
              : <span className={`${s.pill} ${s.pillDay}`}>{match.phase}</span>
            }
            <span className={s.metaDate}>{formatKickoff(match.kickoff)}</span>
            {urgent && <span className={s.metaUrgent} suppressHydrationWarning>⏱ Deadline in {countdownStr(match.kickoff)}</span>}
            {countdown && !urgent && <span className={s.metaSoon} suppressHydrationWarning>⏱ {countdown}</span>}
          </div>

          <div className={s.row}>
            <div className={s.home}>
              <span className={s.flag}>{match.homeFlag}</span>
              <span className={s.teamName}>{match.home}</span>
            </div>
            <div className={s.scoreWrap}>
              {match.finished
                ? <span className={s.score}>{match.result.h}:{match.result.a}</span>
                : <span className={`${s.score} ${s.scorePending}`}>–:–</span>}
            </div>
            <div className={s.away}>
              <span className={s.teamName}>{match.away}</span>
              <span className={s.flag}>{match.awayFlag}</span>
            </div>
          </div>
        </div>

        <div className={s.strip}>
          <div className={s.stripTip}>
            <span className={s.stripLbl}>Dein Tipp:</span>
            {hasTip && (
              <>
                <span className={s.stripVal}>{myTip.h} : {myTip.a}</span>
                {match.finished && points != null && (
                  <span className={`${s.stripPts} ${PTS_CLS[points]}`}>
                    {PTS_LBL[points]} · {points} Pkt
                  </span>
                )}
              </>
            )}
            {latePending && (
              <span className={s.lateBadge}>
                ⏳ {myTip.h}:{myTip.a}
                <span className={s.lateMuted}>– wartet auf Admin</span>
              </span>
            )}
            {noTip && !match.finished && <span className={s.noTipBadge}>Noch kein Tipp</span>}
            {noTip && match.finished  && <span className={s.noTipBadge}>Kein Tipp abgegeben</span>}
          </div>

          {!match.finished && !latePending && (
            <button
              className={`${s.action} ${locked ? s.actionLate : hasTip ? s.actionEdit : s.actionTip}`}
              onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            >
              {locked ? "⚠ Verspätet tippen" : hasTip ? "Ändern" : "Jetzt tippen →"}
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <TipModal
          match={enrichedMatch}
          myTip={myTip}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
