import { useState } from "react";
import { shortName } from "../lib/teamNames";
import s from "../styles/Page.module.css";

const ROUNDS = [
  { day: 18, short: "R32", label: "Runde der 32" },
  { day: 19, short: "AF",  label: "Achtelfinale" },
  { day: 20, short: "VF",  label: "Viertelfinale" },
  { day: 21, short: "HF",  label: "Halbfinale" },
  { day: 22, short: "P3",  label: "Spiel um Platz 3" },
  { day: 23, short: "FIN", label: "Finale" },
];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })
    + " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function KOBracket({ matches, myTipsMap, onOpen }) {
  const matchesByDay = {};
  for (const m of matches) {
    if (!matchesByDay[m.matchday]) matchesByDay[m.matchday] = [];
    matchesByDay[m.matchday].push(m);
  }

  const activeRounds = ROUNDS.filter(r => matchesByDay[r.day]);

  // default: first round with unfinished matches, or first round that exists
  function getDefaultRound() {
    for (const r of activeRounds) {
      const ms = matchesByDay[r.day] ?? [];
      if (ms.some(m => !m.finished)) return r.day;
    }
    return activeRounds[0]?.day ?? ROUNDS[0].day;
  }

  const [selectedDay, setSelectedDay] = useState(getDefaultRound);

  const selectedRound = ROUNDS.find(r => r.day === selectedDay);
  const roundMatches = (matchesByDay[selectedDay] ?? []).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  return (
    <div>
      {/* round selector pills */}
      <div className={s.mdNav} style={{ marginBottom: 18 }}>
        {ROUNDS.map(r => {
          const hasMatches = !!matchesByDay[r.day];
          if (!hasMatches) return null;
          return (
            <button
              key={r.day}
              className={`${s.mdPill}${selectedDay === r.day ? " " + s.mdPillActive : ""}`}
              onClick={() => setSelectedDay(r.day)}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* match list for selected round */}
      {roundMatches.length === 0 ? (
        <div style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "32px 20px",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: "0.85rem",
          fontStyle: "italic",
        }}>
          Noch nicht ausgelost
        </div>
      ) : (
        <div className={s.grpMatches} style={{ borderTop: "none" }}>
          {roundMatches.map(m => {
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
                    <span className={s.grpMatchName}>{shortName(m.home)}</span>
                  </div>
                  {m.finished
                    ? <span className={s.grpMatchScore}>{m.result.h} : {m.result.a}</span>
                    : <span className={s.grpMatchVs}>–:–</span>}
                  <div className={s.grpMatchAway}>
                    <span className={s.grpMatchName}>{shortName(m.away)}</span>
                    <span className={s.grpMatchFlag}>{m.awayFlag}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
