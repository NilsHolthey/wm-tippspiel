import s from "./MatchCard.module.css";
import { calcPoints } from "../../lib/scoring";
import { IconCheck, IconMinus, IconTrendUp, IconX, IconClock, IconHourglass, IconWarning } from "../Icons";

const PTS_CLS = { 3: s.pts3, 2: s.pts2, 1: s.pts1, 0: s.pts0 };
const PTS_LBL = { 3: "Treffer", 2: "Differenz", 1: "Tendenz", 0: "Daneben" };
const PTS_ICO = { 3: IconCheck, 2: IconMinus, 1: IconTrendUp, 0: IconX };

function PtsStrip({ points }) {
  const Icon = PTS_ICO[points];
  return (
    <span className={`${s.stripPts} ${PTS_CLS[points]}`}>
      <Icon size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
      {PTS_LBL[points]} · {points} Pkt
    </span>
  );
}

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

export default function MatchCard({ match, myTip, otherTips = [], onOpen }) {
  const locked      = isLocked(match.kickoff);
  const urgent      = isUrgent(match.kickoff);
  const hasTip      = !!myTip && myTip.lateStatus !== "pending";
  const latePending = myTip?.lateStatus === "pending";
  const noTip       = !myTip && !urgent;
  const tipsVisible = match.finished || (locked && hasTip);

  const points = match.finished && hasTip
    ? calcPoints({ h: myTip.h, a: myTip.a }, match.result)
    : null;

  const countdown = !locked && !match.finished ? countdownStr(match.kickoff) : null;

  const othersWithPts = otherTips.map((o) => ({
    ...o,
    pts: match.finished ? calcPoints({ h: o.h, a: o.a }, match.result) : null,
  }));

  let cardClass = s.card;
  if (match.finished)           cardClass += " " + s.finished;
  if (points === 3)             cardClass += " " + s.cardFlash3;
  if (latePending)              cardClass += " " + s.pendingLate;
  if (noTip && !match.finished) cardClass += " " + s.noTip;

  return (
    <div className={cardClass} onClick={onOpen}>
      <div className={s.inner}>
        <div className={s.meta}>
          {match.phase === "Gruppenphase"
            ? match.group && <span className={`${s.pill} ${s.pillGrp}`}>Gruppe {match.group}</span>
            : <span className={`${s.pill} ${s.pillDay}`}>{match.phase}</span>
          }
          <span className={s.metaDate}>{formatKickoff(match.kickoff)}</span>
          {urgent && <span className={s.metaUrgent} suppressHydrationWarning><IconClock size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />Deadline in {countdownStr(match.kickoff)}</span>}
          {countdown && !urgent && <span className={s.metaSoon} suppressHydrationWarning><IconClock size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{countdown}</span>}
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
              {match.finished && points != null && <PtsStrip points={points} />}
            </>
          )}
          {latePending && (
            <span className={s.lateBadge}>
              <IconHourglass size={12} />
              {myTip.h}:{myTip.a}
              <span className={s.lateMuted}>– wartet auf Admin</span>
            </span>
          )}
          {noTip && !match.finished && <span className={s.noTipBadge}>Noch kein Tipp</span>}
          {noTip && match.finished  && <span className={s.noTipBadge}>Kein Tipp abgegeben</span>}
        </div>

        {!match.finished && !latePending && (
          <button
            className={`${s.action} ${locked ? s.actionLate : hasTip ? s.actionEdit : s.actionTip}`}
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
          >
            {locked ? <><IconWarning size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Verspätet tippen</> : hasTip ? "Ändern" : "Jetzt tippen →"}
          </button>
        )}
      </div>

      {tipsVisible && othersWithPts.length > 0 && (
        <div className={s.othersRow}>
          <span className={s.othersLbl}>Alle:</span>
          {othersWithPts.map((o, i) => (
            <div key={i} className={s.otherChip}>
              <span className={s.otherName}>{o.name}</span>
              <span className={s.otherScore}>{o.h}:{o.a}</span>
              {match.finished && o.pts != null && (
                <span className={`${s.otherPts} ${PTS_CLS[o.pts]}`}>{o.pts}P</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
