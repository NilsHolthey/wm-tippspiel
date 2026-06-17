import { useState } from "react";
import { matchdayShort } from "../lib/format";

const PALETTE = [
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#4ade80",
  "#fb923c",
  "#2dd4bf",
  "#f87171",
  "#818cf8",
];
const GOLD = "#ceac4d";

export default function PointsChart({ board, matchdays, currentUserId }) {
  const [hidden, setHidden] = useState(new Set());

  if (!matchdays || matchdays.length < 2) return null;

  function toggle(id) {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const W = 600;
  const H = 220;
  const PAD_L = 36;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  let paletteIdx = 0;
  const colorMap = {};
  board.forEach(p => {
    colorMap[p.id] = p.id === currentUserId ? GOLD : PALETTE[paletteIdx++ % PALETTE.length];
  });

  const series = board.map(p => {
    let cum = 0;
    const pts = matchdays.map((_, i) => { cum += p.history[i] ?? 0; return cum; });
    return { id: p.id, name: p.name, pts, color: colorMap[p.id], isMe: p.id === currentUserId };
  });

  const maxPts = Math.max(...series.flatMap(s => s.pts), 1);

  function xOf(i) { return PAD_L + (i / (matchdays.length - 1)) * chartW; }
  function yOf(val) { return PAD_T + chartH - (val / maxPts) * chartH; }
  function toPoints(pts) { return pts.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" "); }

  const visible = series.filter(s => !hidden.has(s.id));
  const others = visible.filter(s => !s.isMe);
  const me = visible.find(s => s.isMe);

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", overflow: "visible" }} aria-hidden="true">
        {gridLevels.map(frac => {
          const y = PAD_T + chartH - frac * chartH;
          return (
            <g key={frac}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              {(frac === 0.5 || frac === 1) && (
                <text x={PAD_L - 5} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end">
                  {Math.round(frac * maxPts)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <text x={PAD_L - 5} y={PAD_T + chartH + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end">0</text>

        {others.map(s => {
          const lastX = xOf(s.pts.length - 1);
          const lastY = yOf(s.pts[s.pts.length - 1]);
          return (
            <g key={s.id}>
              <polyline points={toPoints(s.pts)} fill="none" stroke={s.color} strokeWidth="1.5" strokeOpacity="0.7" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={lastX} cy={lastY} r="3" fill={s.color} opacity="0.8" />
            </g>
          );
        })}

        {me && (() => {
          const lastX = xOf(me.pts.length - 1);
          const lastY = yOf(me.pts[me.pts.length - 1]);
          return (
            <g key={me.id}>
              <polyline points={toPoints(me.pts)} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={lastX} cy={lastY} r="4" fill={GOLD} />
            </g>
          );
        })()}

        {matchdays.map((day, i) => (
          <text key={day} x={xOf(i)} y={H - 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="middle">
            {matchdayShort(day)}
          </text>
        ))}
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 12 }}>
        {series.map(s => {
          const isHidden = hidden.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px 5px 8px",
                borderRadius: 99,
                border: `1px solid ${isHidden ? "rgba(255,255,255,0.08)" : s.color + "80"}`,
                background: isHidden ? "transparent" : s.color + "18",
                color: isHidden ? "rgba(255,255,255,0.25)" : s.color,
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: s.isMe ? 700 : 400,
                fontFamily: "inherit",
                transition: "all 0.15s",
                textAlign: "left",
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: isHidden ? "rgba(255,255,255,0.15)" : s.color,
              }} />
              {s.isMe ? "Du" : s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
