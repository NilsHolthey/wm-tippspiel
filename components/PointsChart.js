export default function PointsChart({ board, matchdays, currentUserId }) {
  if (!matchdays || matchdays.length < 2) return null;

  const W = 600;
  const H = 160;
  const PAD_L = 36;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // compute cumulative points per player per matchday
  const series = board.map(p => {
    let cum = 0;
    const pts = matchdays.map((_, i) => {
      cum += p.history[i] ?? 0;
      return cum;
    });
    return { id: p.id, pts };
  });

  const maxPts = Math.max(...series.flatMap(s => s.pts), 1);

  function xOf(i) {
    return PAD_L + (i / (matchdays.length - 1)) * chartW;
  }
  function yOf(val) {
    return PAD_T + chartH - (val / maxPts) * chartH;
  }

  function toPoints(pts) {
    return pts.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
  }

  const KO_LABELS = { 18: "R32", 19: "AF", 20: "VF", 21: "HF", 22: "P3", 23: "FIN" };
  function xLabel(day) {
    return KO_LABELS[day] ?? `T${day}`;
  }

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", display: "block", overflow: "visible" }}
      aria-hidden="true"
    >
      {/* grid lines */}
      {gridLevels.map(frac => {
        const y = PAD_T + chartH - frac * chartH;
        const val = Math.round(frac * maxPts);
        return (
          <g key={frac}>
            <line
              x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            />
            {(frac === 0.5 || frac === 1) && (
              <text x={PAD_L - 5} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end">
                {val}
              </text>
            )}
          </g>
        );
      })}
      {/* zero line */}
      <line
        x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1"
      />
      <text x={PAD_L - 5} y={PAD_T + chartH + 4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end">0</text>

      {/* other players first (behind) */}
      {series.filter(s => s.id !== currentUserId).map(s => (
        <polyline
          key={s.id}
          points={toPoints(s.pts)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}

      {/* current user on top */}
      {series.filter(s => s.id === currentUserId).map(s => {
        const last = s.pts[s.pts.length - 1];
        const lastX = xOf(s.pts.length - 1);
        const lastY = yOf(last);
        return (
          <g key={s.id}>
            <polyline
              points={toPoints(s.pts)}
              fill="none"
              stroke="#ceac4d"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={lastX} cy={lastY} r="4" fill="#ceac4d" />
          </g>
        );
      })}

      {/* x-axis labels */}
      {matchdays.map((day, i) => (
        <text
          key={day}
          x={xOf(i)}
          y={H - 4}
          fill="rgba(255,255,255,0.3)"
          fontSize="9"
          textAnchor="middle"
        >
          {xLabel(day)}
        </text>
      ))}
    </svg>
  );
}
