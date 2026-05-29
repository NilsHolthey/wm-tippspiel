import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { getSession } from "next-auth/react";
import Nav from "../components/Nav";
import { shortName } from "../lib/teamNames";
import { calcPoints } from "../lib/scoring";
import s from "../styles/Page.module.css";

const KO_LABELS = { 18: "R32", 19: "AF", 20: "VF", 21: "HF", 22: "P3", 23: "FIN" };

function matchdayLabel(day) {
  return KO_LABELS[day] ?? `Spieltag ${day}`;
}

function StatCard({ value, label }) {
  return (
    <div className={s.homeSec} style={{ textAlign: "center", padding: "18px 12px" }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "2.2rem",
        color: "var(--gold)",
        lineHeight: 1,
        letterSpacing: "0.05em",
      }}>
        {value}
      </div>
      <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: 5, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

function MatchdayBarChart({ matchdayStats }) {
  if (!matchdayStats || matchdayStats.length === 0) return null;

  const W = 600;
  const H = 100;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 8;
  const PAD_B = 20;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxPts = Math.max(...matchdayStats.map(d => d.pts), 1);
  const n = matchdayStats.length;
  const gap = 4;
  const barW = (chartW - gap * (n - 1)) / n;

  function barColor(d) {
    if (!d.total) return "rgba(255,255,255,0.1)";
    const avg = d.pts / d.total;
    if (avg >= 2) return "var(--green)";
    if (avg >= 1) return "var(--gold)";
    return "rgba(239,68,68,0.6)";
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} aria-hidden="true">
      {matchdayStats.map((d, i) => {
        const bh = d.pts > 0 ? Math.max(4, (d.pts / maxPts) * chartH) : 0;
        const x = PAD_L + i * (barW + gap);
        const y = PAD_T + chartH - bh;
        return (
          <g key={d.matchday}>
            <rect
              x={x} y={y}
              width={barW} height={bh}
              rx="3"
              fill={barColor(d)}
            />
            <text
              x={x + barW / 2}
              y={H - 4}
              fill="rgba(255,255,255,0.3)"
              fontSize="8"
              textAnchor="middle"
            >
              {KO_LABELS[d.matchday] ?? `T${d.matchday}`}
            </text>
            {d.pts > 0 && (
              <text
                x={x + barW / 2}
                y={y - 3}
                fill="rgba(255,255,255,0.5)"
                fontSize="8"
                textAnchor="middle"
              >
                {d.pts}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const PTS_CLS = { 3: s.pts3, 2: s.pts2, 1: s.pts1 };

function TipRow({ tip }) {
  const ptsCls = PTS_CLS[tip.pts] ?? "";
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr auto",
      alignItems: "center",
      gap: 8,
      padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      fontSize: "0.83rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: "1rem" }}>{tip.homeFlag}</span>
        <span style={{ fontWeight: 600 }}>{tip.home}</span>
      </div>
      <div style={{ textAlign: "center", minWidth: 80 }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: "var(--gold)", letterSpacing: "0.05em" }}>
          {tip.result ? `${tip.result.h}:${tip.result.a}` : "–:–"}
        </span>
        {tip.tip && (
          <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: 1 }}>
            Tipp: {tip.tip.h}:{tip.tip.a}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
        <span style={{ fontWeight: 600 }}>{tip.away}</span>
        <span style={{ fontSize: "1rem" }}>{tip.awayFlag}</span>
      </div>
      <div style={{ textAlign: "right", minWidth: 40 }}>
        {tip.pts != null ? (
          <span className={`${s.legendChip} ${ptsCls}`} style={!ptsCls ? { color: "var(--muted)", background: "rgba(255,255,255,0.05)" } : {}}>
            {tip.pts} Pkt
          </span>
        ) : (
          <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>–</span>
        )}
      </div>
    </div>
  );
}

function MatchdayAccordion({ stat }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.homeSec} style={{ marginBottom: 10, padding: "12px 16px" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: 0,
          color: "var(--text)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{matchdayLabel(stat.matchday)}</span>
          <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>{stat.tipped}/{stat.total} Tipps</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.1rem",
            color: "var(--gold)",
            letterSpacing: "0.05em",
          }}>
            {stat.pts} Pkt
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--muted)", transform: open ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▼</span>
        </div>
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          {stat.tips.map((tip, i) => (
            <TipRow key={i} tip={tip} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatsPage({ username, rank, totalPlayers, totalPts, totalTipped, totalFinished, totalCorrect, matchdayStats }) {
  return (
    <>
      <Head><title>Stats – WM Tippspiel</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph} style={{ marginBottom: 22 }}>
            <div className={s.ptitle}><span>STATS</span></div>
            <Link href="/rangliste" style={{ fontSize: "0.82rem", color: "var(--gold)", textDecoration: "none", alignSelf: "center" }}>
              ← Rangliste
            </Link>
          </div>

          <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 16 }}>
            {username}
          </div>

          {/* stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
            <StatCard value={`#${rank}`} label="Platz" />
            <StatCard value={totalPts} label="Punkte" />
            <StatCard value={`${totalTipped}/${totalFinished}`} label="Tipps" />
            <StatCard value={totalCorrect} label="Treffer" />
          </div>

          {/* bar chart */}
          {matchdayStats.length > 0 && (
            <div className={s.homeSec} style={{ marginBottom: 20 }}>
              <div className={s.homeSecTitle} style={{ marginBottom: 12 }}>Punkte pro Spieltag</div>
              <MatchdayBarChart matchdayStats={matchdayStats} />
            </div>
          )}

          {/* accordion */}
          <div style={{ marginBottom: 0 }}>
            <div className={s.homeSecTitle} style={{ marginBottom: 12, borderLeft: "2px solid var(--gold)", paddingLeft: 8 }}>
              Spieltage
            </div>
            {matchdayStats.map(stat => (
              <MatchdayAccordion key={stat.matchday} stat={stat} />
            ))}
            {matchdayStats.length === 0 && (
              <p className={s.empty}>Noch keine abgeschlossenen Spiele.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { connectDB } = await import("../lib/db");
  const { default: User } = await import("../models/User");
  const { default: Match } = await import("../models/Match");
  const { default: Tip } = await import("../models/Tip");

  await connectDB();

  const userId = context.query.user ?? session.user.id;

  const [myTips, finishedMatches, users, allTips] = await Promise.all([
    Tip.find({ user: userId, lateStatus: { $in: [null, "approved"] } }).lean(),
    Match.find({ finished: true }).sort({ kickoff: 1 }).lean(),
    User.find().lean(),
    Tip.find({ lateStatus: { $in: [null, "approved"] } }).lean(),
  ]);

  // build tip maps
  const myTipMap = {};
  for (const t of myTips) myTipMap[t.match.toString()] = t;

  const allTipMap = {};
  for (const t of allTips) allTipMap[`${t.user}-${t.match}`] = t;

  // compute board for rank
  const board = users.map(u => {
    let pts = 0;
    for (const m of finishedMatches) {
      const tip = allTipMap[`${u._id}-${m._id}`];
      if (!tip) continue;
      pts += calcPoints({ h: tip.h, a: tip.a }, m.result) ?? 0;
    }
    return { id: u._id.toString(), pts };
  });
  board.sort((a, b) => b.pts - a.pts);

  const rank = board.findIndex(p => p.id === userId) + 1;
  const totalPlayers = board.length;
  const userEntry = board.find(p => p.id === userId);
  const totalPts = userEntry?.pts ?? 0;

  // per matchday stats
  const matchdaySet = new Set(finishedMatches.map(m => m.matchday));
  const matchdays = [...matchdaySet].sort((a, b) => a - b);

  let totalTipped = 0;
  let totalCorrect = 0;

  const matchdayStats = matchdays.map(day => {
    const dayMatches = finishedMatches.filter(m => m.matchday === day);
    let dayPts = 0;
    let tipped = 0;
    const tips = dayMatches.map(m => {
      const tip = myTipMap[m._id.toString()];
      if (tip) {
        tipped++;
        totalTipped++;
        const p = calcPoints({ h: tip.h, a: tip.a }, m.result) ?? 0;
        dayPts += p;
        if (p === 3) totalCorrect++;
        return {
          home: shortName(m.home),
          homeFlag: m.homeFlag ?? "",
          away: shortName(m.away),
          awayFlag: m.awayFlag ?? "",
          result: m.result ?? null,
          tip: { h: tip.h, a: tip.a },
          pts: p,
        };
      }
      return {
        home: shortName(m.home),
        homeFlag: m.homeFlag ?? "",
        away: shortName(m.away),
        awayFlag: m.awayFlag ?? "",
        result: m.result ?? null,
        tip: null,
        pts: null,
      };
    });
    return { matchday: day, pts: dayPts, tipped, total: dayMatches.length, tips };
  });

  const currentUser = users.find(u => u._id.toString() === userId);

  return {
    props: {
      username: currentUser?.username ?? "",
      rank,
      totalPlayers,
      totalPts,
      totalTipped,
      totalFinished: finishedMatches.length,
      totalCorrect,
      matchdayStats,
    },
  };
}
