import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import { calcPoints } from "../lib/scoring";
import { shortName } from "../lib/teamNames";
import PageHeader from "../components/PageHeader";
import s from "../styles/Page.module.css";
import { PTS_LBL } from "../lib/constants";
import { dayLabel, matchdayShort } from "../lib/format";

const PTS_CLS = { 3: s.pts3, 2: s.pts2, 1: s.pts1 };

function AccuracyStrip({ matchdayStats }) {
  const active = matchdayStats.filter(d => d.tipped > 0);
  if (!active.length) return null;

  function chipColor(d) {
    const pct = d.pts / (d.tipped * 3);
    if (pct >= 0.67) return { bg: "rgba(34,197,94,0.2)",  text: "var(--green)" };
    if (pct >= 0.34) return { bg: "rgba(201,168,76,0.2)", text: "var(--gold)" };
    if (pct >  0)    return { bg: "rgba(234,179,8,0.15)", text: "var(--yellow)" };
    return               { bg: "rgba(255,255,255,0.05)", text: "var(--muted)" };
  }

  return (
    <div className={s.homeSec} style={{ marginBottom: 20 }}>
      <div className={s.homeSecTitle} style={{ marginBottom: 10 }}>Trefferquote</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {active.map(d => {
          const { bg, text } = chipColor(d);
          const pct = Math.round(d.pts / (d.tipped * 3) * 100);
          const lbl = matchdayShort(d.matchday);
          return (
            <div key={d.matchday} style={{
              background: bg, borderRadius: 8, padding: "6px 10px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              minWidth: 44,
            }}>
              <span style={{ fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.06em" }}>{lbl}</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.1rem", color: text, lineHeight: 1, letterSpacing: "0.04em" }}>{pct}%</span>
              <span style={{ fontSize: "0.58rem", color: text, opacity: 0.8 }}>{d.pts}/{d.tipped * 3}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className={s.homeSec} style={{ textAlign: "center", padding: "14px 10px" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "var(--gold)", lineHeight: 1, letterSpacing: "0.05em" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

export default function StatsPage({ users, selectedUser, rank, totalPlayers, matchdayStats }) {
  const router = useRouter();

  const totalPts    = matchdayStats.reduce((s, d) => s + d.pts, 0);
  const totalTipped = matchdayStats.reduce((s, d) => s + d.tipped, 0);
  const totalDone   = matchdayStats.reduce((s, d) => s + d.total, 0);
  const correct     = matchdayStats.reduce((s, d) => s + d.correct, 0);
  const diff        = matchdayStats.reduce((s, d) => s + d.diff, 0);
  const tendency    = matchdayStats.reduce((s, d) => s + d.tendency, 0);

  function navigate(userId) {
    router.push(userId === selectedUser.id ? "/stats" : `/stats?user=${userId}`, undefined, { shallow: false });
  }

  return (
    <>
      <Head><title>Details – WM Tippspiel</title></Head>
      <div className={s.app}>
        <div className={s.wrap}>

          <PageHeader style={{ marginBottom: 18 }} right={
            <Link href="/rangliste" style={{ fontSize: "0.82rem", color: "var(--gold)", textDecoration: "none", alignSelf: "center" }}>
              ← Rangliste
            </Link>
          }><span>DETAILS</span></PageHeader>

          {/* user selector */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 5, marginBottom: 22 }}>
            {users.map(u => (
              <button
                key={u.id}
                className={`${s.mdPill}${u.id === selectedUser.id ? " " + s.mdPillActive : ""}`}
                onClick={() => navigate(u.id)}
                style={{ width: "100%" }}
              >
                {u.name}
              </button>
            ))}
          </div>

          {/* summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
            <StatCard value={`#${rank}`}         label="Platz" />
            <StatCard value={totalPts}            label="Punkte" />
            <StatCard value={`${totalTipped}/${totalDone}`} label="Tipps" />
            <StatCard value={correct}             label="Treffer" />
            <StatCard value={diff}                label="Differenz" />
            <StatCard value={tendency}            label="Tendenz" />
          </div>

          {/* match history by matchday */}
          {matchdayStats.length === 0 && (
            <p className={s.empty}>Noch keine abgeschlossenen Spiele.</p>
          )}

          {matchdayStats.map(day => (
            <div key={day.matchday} style={{ marginBottom: 18 }}>
              <div className={s.homeSecTitle} style={{ marginBottom: 8 }}>
                {dayLabel(day.matchday)}
                <span style={{ marginLeft: "auto", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: "var(--gold)", letterSpacing: "0.05em" }}>
                  {day.pts} Pkt
                </span>
              </div>

              {day.tips.map((t, i) => {
                const ptsCls = t.pts != null ? (PTS_CLS[t.pts] ?? "") : "";
                return (
                  <div key={i} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr auto",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 14px",
                    background: "linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    marginBottom: 5,
                    fontSize: "0.83rem",
                  }}>
                    {/* home */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: "1rem" }}>{t.homeFlag}</span>
                      <span style={{ fontWeight: 600 }}>{t.home}</span>
                    </div>

                    {/* score + tip */}
                    <div style={{ textAlign: "center", minWidth: 72 }}>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: "var(--gold)", letterSpacing: "0.05em" }}>
                        {t.result ? `${t.result.h}:${t.result.a}` : "–:–"}
                      </div>
                      {t.tip && (
                        <div style={{ fontSize: "0.62rem", color: "var(--muted)", marginTop: 1 }}>
                          Tipp: {t.tip.h}:{t.tip.a}
                        </div>
                      )}
                    </div>

                    {/* away */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                      <span style={{ fontWeight: 600 }}>{t.away}</span>
                      <span style={{ fontSize: "1rem" }}>{t.awayFlag}</span>
                    </div>

                    {/* points */}
                    <div style={{ textAlign: "right", minWidth: 44 }}>
                      {t.pts != null ? (
                        <span className={`${s.legendChip} ${ptsCls}`}
                          style={!ptsCls ? { color: "var(--muted)", background: "rgba(255,255,255,0.05)" } : {}}>
                          {t.pts} Pkt
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontStyle: "italic" }}>
                          {t.tip ? "–" : "Kein Tipp"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { getLeaderboardBase } = await import("../lib/leaderboard");
  const { users: allUsers, finishedMatches, tips: allTips, tipMap, matchdays } = await getLeaderboardBase();

  const selfId       = session.user.id;
  const viewedUserId = context.query.user ?? selfId;

  const board = allUsers.map(u => {
    let pts = 0;
    for (const m of finishedMatches) {
      const tip = tipMap[`${u._id}-${m._id}`];
      if (tip) pts += calcPoints({ h: tip.h, a: tip.a }, m.result) ?? 0;
    }
    return { id: u._id.toString(), pts };
  }).sort((a, b) => b.pts - a.pts);

  const rank = board.findIndex(p => p.id === viewedUserId) + 1;

  // viewed user's tips per matchday
  const userTipMap = {};
  for (const t of allTips) {
    if (t.user.toString() === viewedUserId) userTipMap[t.match.toString()] = t;
  }

  let totalCorrect = 0, totalDiff = 0, totalTendency = 0;

  const matchdayStats = matchdays.map(day => {
    const dayMatches = finishedMatches.filter(m => m.matchday === day);
    let dayPts = 0, tipped = 0, correct = 0, diff = 0, tendency = 0;

    const tips = dayMatches.map(m => {
      const tip = userTipMap[m._id.toString()];
      if (tip) {
        tipped++;
        const p = calcPoints({ h: tip.h, a: tip.a }, m.result) ?? 0;
        dayPts += p;
        if (p === 3) { correct++; totalCorrect++; }
        else if (p === 2) { diff++; totalDiff++; }
        else if (p === 1) { tendency++; totalTendency++; }
        return {
          home: shortName(m.home), homeFlag: m.homeFlag ?? "",
          away: shortName(m.away), awayFlag: m.awayFlag ?? "",
          result: m.result,
          tip: { h: tip.h, a: tip.a },
          pts: p,
        };
      }
      return {
        home: shortName(m.home), homeFlag: m.homeFlag ?? "",
        away: shortName(m.away), awayFlag: m.awayFlag ?? "",
        result: m.result,
        tip: null, pts: null,
      };
    });

    return { matchday: day, pts: dayPts, tipped, total: dayMatches.length, correct, diff, tendency, tips };
  });

  const selectedUser = allUsers.find(u => u._id.toString() === viewedUserId);

  return {
    props: {
      users: [...allUsers].sort((a, b) => a.username.localeCompare(b.username)).map(u => ({ id: u._id.toString(), name: u.username })),
      selectedUser: { id: viewedUserId, name: selectedUser?.username ?? "" },
      rank,
      totalPlayers: allUsers.length,
      matchdayStats,
    },
  };
}
