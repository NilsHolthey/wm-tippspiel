import { useRef, useEffect, useState } from "react";
import { calcPoints } from "../lib/scoring";
import { shortName } from "../lib/teamNames";
import s from "../styles/Page.module.css";

// ---------- layout constants ----------
const CARD_W  = 163;
const CARD_H  = 52;
const CARD_GAP = 6;
const COL_GAP  = 46;
const UNIT_H   = CARD_H + CARD_GAP; // 56 — one slot in the base round
const PAD_T    = 24;  // space above for round labels
const PAD_X    = 12;

const BRACKET_DAYS = [18, 19, 20, 21, 23]; // R32 → Final
const P3_DAY       = 22;
const DAY_LABELS = { 18: "R32", 19: "Achtelfinale", 20: "Viertelfinale", 21: "Halbfinale", 23: "Finale" };
const DAY_SHORT  = { 18: "R32", 19: "AF", 20: "VF", 21: "HF", 22: "P3", 23: "FIN" };

// Position helpers
function cx(colIdx) { return PAD_X + colIdx * (CARD_W + COL_GAP); }
function cy(colIdx, matchIdx) { return PAD_T + UNIT_H * Math.pow(2, colIdx) * (matchIdx + 0.5); }
function ty(colIdx, matchIdx) { return cy(colIdx, matchIdx) - CARD_H / 2; }

function isPlaceholder(name) {
  return !name || /^[0-9W]/.test(name) || name.includes("/");
}

// ---------- team row inside compact card ----------
function TeamRow({ flag, name, score, won, finished }) {
  const unknown = isPlaceholder(name);
  return (
    <div style={{ display: "flex", alignItems: "center", flex: 1, padding: "0 6px", minWidth: 0 }}>
      <span style={{ width: 18, fontSize: "0.78rem", flexShrink: 0, lineHeight: 1 }}>
        {unknown ? "" : (flag || "")}
      </span>
      <span style={{
        flex: 1, minWidth: 0, marginLeft: 2,
        fontSize: "0.7rem",
        fontWeight: won ? 600 : 400,
        color: unknown
          ? "var(--muted)"
          : finished
            ? (won ? "var(--text)" : "rgba(255,255,255,0.35)")
            : "var(--text)",
        fontStyle: unknown ? "italic" : "normal",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {shortName(name) || "?"}
      </span>
      {finished ? (
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.85rem",
          color: won ? "var(--gold)" : "rgba(255,255,255,0.22)",
          letterSpacing: "0.04em", marginLeft: 4, flexShrink: 0, minWidth: 14, textAlign: "right",
        }}>
          {score}
        </span>
      ) : (
        <span style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.58rem", marginLeft: 4, flexShrink: 0 }}>—</span>
      )}
    </div>
  );
}

// ---------- compact bracket card ----------
function CompactCard({ match, tip, onOpen }) {
  const hasTip   = tip && tip.lateStatus !== "pending";
  const pts      = hasTip && match.finished ? calcPoints({ h: tip.h, a: tip.a }, match.result) : null;
  const homeWon  = match.finished && match.result?.h > match.result?.a;
  const awayWon  = match.finished && match.result?.a > match.result?.h;

  const tipBar =
    pts === 3 ? "var(--green)"  :
    pts === 2 ? "var(--gold)"   :
    pts === 1 ? "var(--orange)" :
    pts === 0 ? "#f87171"       :
    hasTip    ? "rgba(201,168,76,0.55)" : null;

  return (
    <div
      onClick={() => onOpen(match._id)}
      style={{
        width: CARD_W, height: CARD_H,
        background: match.finished
          ? "rgba(255,255,255,0.025)"
          : "linear-gradient(145deg,rgba(255,255,255,0.065) 0%,rgba(255,255,255,0.025) 100%)",
        border: `1px solid ${hasTip ? "rgba(201,168,76,0.28)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 8, cursor: "pointer", overflow: "hidden",
        display: "flex", flexDirection: "column", position: "relative",
        boxShadow: match.finished ? "none" : "0 2px 10px rgba(0,0,0,0.18)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {tipBar && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: tipBar, borderRadius: "8px 8px 0 0",
        }} />
      )}
      <TeamRow
        flag={match.homeFlag} name={match.home}
        score={match.result?.h} won={homeWon} finished={match.finished}
      />
      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 6px 0 22px", flexShrink: 0 }} />
      <TeamRow
        flag={match.awayFlag} name={match.away}
        score={match.result?.a} won={awayWon} finished={match.finished}
      />
    </div>
  );
}

// ---------- main bracket ----------
export default function KOBracket({ matches, myTipsMap, onOpen }) {
  const scrollRef    = useRef(null);
  const colsRef      = useRef([]);
  const snapTimerRef = useRef(null);
  const targetColRef = useRef(null); // column we're programmatically scrolling toward
  const [activeColIdx, setActiveColIdx] = useState(0);

  // Group and sort matches by matchday
  const byDay = {};
  for (const m of matches) {
    if (!byDay[m.matchday]) byDay[m.matchday] = [];
    byDay[m.matchday].push(m);
  }
  for (const d of Object.keys(byDay)) {
    byDay[d].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  }

  const columns = BRACKET_DAYS
    .filter(d => byDay[d]?.length)
    .map((day, colIdx) => ({ day, colIdx, matches: byDay[day] }));

  colsRef.current = columns;

  const p3 = byDay[P3_DAY] ?? [];

  const baseCount = columns[0]?.matches.length ?? 16;
  const totalW = PAD_X * 2 + columns.length * CARD_W + Math.max(0, columns.length - 1) * COL_GAP;
  const totalH = PAD_T + baseCount * UNIT_H + 8;

  function colTarget(colIdx) { return colIdx * (CARD_W + COL_GAP); }

  function scrollToCol(colIdx) {
    const el = scrollRef.current;
    if (!el) return;
    targetColRef.current = colIdx;
    clearTimeout(snapTimerRef.current);
    setActiveColIdx(colIdx);
    el.scrollTo({ left: colTarget(colIdx), behavior: "smooth" });
    setTimeout(() => { targetColRef.current = null; }, 800);
  }

  // Initial scroll to first unfinished round
  useEffect(() => {
    if (!scrollRef.current || !colsRef.current.length) return;
    const cols = colsRef.current;
    const idx  = cols.findIndex(col => col.matches.some(m => !m.finished));
    const defIdx = idx === -1 ? cols.length - 1 : Math.max(0, idx);
    setActiveColIdx(defIdx);
    if (defIdx > 0) {
      scrollRef.current.scrollLeft = colTarget(defIdx);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll tracking + JS snap-on-end
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function nearest() {
      let best = 0, bestDist = Infinity;
      colsRef.current.forEach(({ colIdx }) => {
        const dist = Math.abs(el.scrollLeft - colTarget(colIdx));
        if (dist < bestDist) { bestDist = dist; best = colIdx; }
      });
      return best;
    }

    function doSnap() {
      if (targetColRef.current !== null) return;
      const idx = nearest();
      const target = colTarget(idx);
      if (Math.abs(el.scrollLeft - target) < 2) return;
      targetColRef.current = idx;
      setActiveColIdx(idx);
      el.scrollTo({ left: target, behavior: "smooth" });
      setTimeout(() => { targetColRef.current = null; }, 800);
    }

    function onScroll() {
      if (targetColRef.current !== null) {
        if (Math.abs(el.scrollLeft - colTarget(targetColRef.current)) < 3) {
          targetColRef.current = null;
        }
        return;
      }
      setActiveColIdx(nearest());
      clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(doSnap, 120);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(snapTimerRef.current);
    };
  }, []);

  if (!columns.length) {
    return (
      <div style={{
        background: "linear-gradient(145deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16,
        padding: "40px 20px", textAlign: "center",
        color: "var(--muted)", fontSize: "0.85rem", fontStyle: "italic",
      }}>
        Noch keine KO-Runden verfügbar
      </div>
    );
  }

  const lineColor = "rgba(255,255,255,0.1)";

  return (
    <div>
      {/* Round nav pills — always fully visible, no scroll */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, justifyContent: "space-between" }}>
        {columns.map(({ day, colIdx }) => (
          <button
            key={day}
            className={`${s.mdPill}${activeColIdx === colIdx ? " " + s.mdPillActive : ""}`}
            onClick={() => scrollToCol(colIdx)}
            style={{ flex: 1, textAlign: "center", minWidth: 0 }}
          >
            {DAY_SHORT[day] ?? ""}
          </button>
        ))}
      </div>

      {/* Horizontally scrollable bracket */}
      <div
        ref={scrollRef}
        className={s.scrollHide}
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          paddingInline: `calc(50% - ${CARD_W / 2 + PAD_X}px)`,
        }}
      >
        <div style={{ position: "relative", width: totalW, height: totalH }}>

          {/* Active column highlight */}
          <div style={{
            position: "absolute",
            left: cx(activeColIdx) - 8,
            top: 0,
            width: CARD_W + 16,
            height: totalH,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            pointerEvents: "none",
            transition: "left 0.25s ease",
          }} />

          {/* Round labels */}
          {columns.map(({ day, colIdx }) => (
            <div
              key={`lbl-${day}`}
              onClick={() => scrollToCol(colIdx)}
              style={{
                position: "absolute",
                left: cx(colIdx), top: 0, width: CARD_W,
                fontSize: "0.55rem", letterSpacing: "0.09em", textTransform: "uppercase",
                color: activeColIdx === colIdx ? "var(--gold)" : "var(--muted)",
                opacity: activeColIdx === colIdx ? 0.75 : 0.4,
                textAlign: "center", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                height: PAD_T - 4,
                transition: "color 0.2s, opacity 0.2s",
              }}
            >
              {DAY_LABELS[day] ?? ""}
            </div>
          ))}

          {/* SVG connector lines */}
          <svg
            style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
            width={totalW} height={totalH}
          >
            {columns.slice(0, -1).map(({ colIdx, matches: colMatches }) => {
              const nextCol = columns[colIdx + 1];
              if (!nextCol) return null;

              return colMatches.map((match, matchIdx) => {
                const isTop   = matchIdx % 2 === 0;
                const nextIdx = Math.floor(matchIdx / 2);
                const hasNext = !!nextCol.matches[nextIdx];

                const x1   = cx(colIdx) + CARD_W;
                const xMid = x1 + COL_GAP / 2;
                const x2   = cx(colIdx + 1);
                const y1   = cy(colIdx, matchIdx);
                const yTop = isTop ? y1 : cy(colIdx, matchIdx - 1);
                const yBot = isTop ? cy(colIdx, matchIdx + 1) : y1;
                const yN   = cy(colIdx + 1, nextIdx);

                // Highlight lines adjacent to the active column
                const isActive = colIdx === activeColIdx || colIdx + 1 === activeColIdx;
                const stroke = isActive ? "rgba(201,168,76,0.22)" : lineColor;

                return (
                  <g key={match._id}>
                    <line x1={x1} y1={y1} x2={xMid} y2={y1} stroke={stroke} strokeWidth={1} />
                    {isTop && hasNext && (
                      <>
                        <line x1={xMid} y1={yTop} x2={xMid} y2={yBot} stroke={stroke} strokeWidth={1} />
                        <line x1={xMid} y1={yN}   x2={x2}   y2={yN}   stroke={stroke} strokeWidth={1} />
                      </>
                    )}
                  </g>
                );
              });
            })}
          </svg>

          {/* Match cards */}
          {columns.map(({ colIdx, matches: colMatches }) =>
            colMatches.map((match, matchIdx) => (
              <div key={match._id} style={{
                position: "absolute",
                left: cx(colIdx),
                top:  ty(colIdx, matchIdx),
                opacity: activeColIdx === colIdx ? 1 : 0.55,
                transition: "opacity 0.2s",
              }}>
                <CompactCard
                  match={match}
                  tip={myTipsMap?.[match._id]}
                  onOpen={onOpen}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3rd place — separate below bracket */}
      {p3.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            fontSize: "0.55rem", letterSpacing: "0.09em", textTransform: "uppercase",
            color: "var(--muted)", opacity: 0.45, marginBottom: 8,
          }}>
            Spiel um Platz 3
          </div>
          <div style={{ paddingLeft: PAD_X }}>
            {p3.map(m => (
              <CompactCard key={m._id} match={m} tip={myTipsMap?.[m._id]} onOpen={onOpen} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
