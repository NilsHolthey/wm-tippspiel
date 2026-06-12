import Head from "next/head";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "../components/Nav";
import PointsChart from "../components/PointsChart";
import s from "../styles/Page.module.css";
import { calcPoints } from "../lib/scoring";

const RANK_COLORS = { 1: "#ceac4d", 2: "#9ba4ae", 3: "#b07040" };

export default function RanglistePage({ board, matchdays }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentUserId = session?.user?.id;
  const [expanded, setExpanded] = useState(new Set());
  const [showChart, setShowChart] = useState(false);
  const [rankChanges, setRankChanges] = useState({});

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (currentUserId) setExpanded(new Set([currentUserId]));
  }, [currentUserId]);

  useEffect(() => {
    if (!board.length) return;
    const key = "wm_ranks";
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "{}");
      const changes = {};
      board.forEach((p, i) => {
        if (stored[p.id] !== undefined && stored[p.id] !== i) {
          changes[p.id] = stored[p.id] - i;
        }
      });
      setRankChanges(changes);
      const next = {};
      board.forEach((p, i) => { next[p.id] = i; });
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }, [board]);

  if (status === "loading") return (
    <div className={s.app}>
      <Nav />
      <div className={s.wrap}>
        <div className={s.ph} style={{ marginBottom: 22 }}>
          <div className={s.skeletonBlock} style={{ width: 140, height: 32, borderRadius: 6 }} />
        </div>
        <div className={s.lbList}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className={s.lbCard} style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              <div className={s.skeletonBlock} style={{ width: 26, height: 22, borderRadius: 4 }} />
              <div style={{ flex: 1 }}>
                <div className={s.skeletonBlock} style={{ width: "55%", height: 13, borderRadius: 4, marginBottom: 9 }} />
                <div className={s.skeletonBlock} style={{ width: "70%", height: 3, borderRadius: 99 }} />
              </div>
              <div className={s.skeletonBlock} style={{ width: 38, height: 26, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (status === "unauthenticated") return null;

  const maxPts = board[0]?.pts || 1;

  return (
    <>
      <Head><title>Rangliste – WM Tippspiel</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph} style={{ marginBottom: 22 }}>
            <div className={s.ptitle}><span>RANGLISTE</span></div>
            <button
              onClick={() => router.push("/stats")}
              className={s.mdPill}
              style={{ alignSelf: "center" }}
            >
              Details
            </button>
            {matchdays?.length >= 2 && (
              <button
                onClick={() => setShowChart(v => !v)}
                className={`${s.mdPill}${showChart ? " " + s.mdPillActive : ""}`}
                style={{ alignSelf: "center" }}
              >
                Verlauf
              </button>
            )}
          </div>

          {showChart && (
            <div className={s.homeSec} style={{ marginBottom: 18 }}>
              <div className={s.homeSecTitle} style={{ marginBottom: 10 }}>Punkteverlauf</div>
              <PointsChart board={board} matchdays={matchdays} currentUserId={currentUserId} />
            </div>
          )}

          <div className={s.lbList}>
            {board.map((p, i) => {
              const isMe = p.id === currentUserId;
              const isOpen = expanded.has(p.id);
              const rankColor = RANK_COLORS[i + 1] ?? "var(--muted)";
              const pct = (p.pts / maxPts) * 100;
              return (
                <motion.div
                  key={p.id}
                  className={`${s.lbCard}${isMe ? " " + s.lbRowMe : ""}${isOpen ? " " + s.lbCardOpen : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut", delay: i * 0.05 }}
                >
                  <div
                    className={s.lbRow}
                    onClick={() => setExpanded(prev => {
                      const next = new Set(prev);
                      isOpen ? next.delete(p.id) : next.add(p.id);
                      return next;
                    })}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, width: 42 }}>
                      <span className={s.lbRank} style={{ color: rankColor }}>{i + 1}</span>
                      {rankChanges[p.id] > 0 && <span className={s.rankUp}>▲{rankChanges[p.id]}</span>}
                      {rankChanges[p.id] < 0 && <span className={s.rankDown}>▼{Math.abs(rankChanges[p.id])}</span>}
                    </div>
                    <div className={s.lbInfo}>
                      <div className={s.lbName}>
                        {p.name}
                        {isMe && <span className={s.lbYou}>Du</span>}
                      </div>
                      <div className={s.lbBar}>
                        <div
                          className={s.lbBarFill}
                          style={{
                            width: `${pct}%`,
                            background: i === 0
                              ? "linear-gradient(90deg, var(--gold-dk), var(--gold))"
                              : "rgba(255,255,255,0.18)",
                          }}
                        />
                      </div>
                    </div>
                    <span className={s.lbPts} style={{ color: rankColor }}>{p.pts}</span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: "var(--muted)", flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className={s.lbDetail}>
                          <span className={`${s.legendChip} ${s.pts3}`}>{p.correct} × 3 Pkt</span>
                          <span className={`${s.legendChip} ${s.pts2}`}>{p.diff} × 2 Pkt</span>
                          <span className={`${s.legendChip} ${s.pts1}`}>{p.tendency} × 1 Pkt</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 4 }}>{p.tipped} Tipps</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const { getSession } = await import("next-auth/react");
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  try {
    const { connectDB } = await import("../lib/db");
    const { default: User } = await import("../models/User");
    const { default: Match } = await import("../models/Match");
    const { default: Tip } = await import("../models/Tip");

    await connectDB();

    const users = await User.find().lean();
    const finishedMatches = await Match.find({ finished: true }).sort({ kickoff: 1 }).lean();
    const tips = await Tip.find({ lateStatus: { $in: [null, "approved"] } }).lean();

    const tipMap = {};
    for (const t of tips) tipMap[`${t.user}-${t.match}`] = t;

    const matchdaySet = new Set(finishedMatches.map(m => m.matchday));
    const matchdays = [...matchdaySet].sort((a, b) => a - b);

    const board = users.map(u => {
      let pts = 0, correct = 0, diff = 0, tendency = 0, tipped = 0;
      const history = matchdays.map(day => {
        let dayPts = 0;
        for (const m of finishedMatches.filter(m => m.matchday === day)) {
          const tip = tipMap[`${u._id}-${m._id}`];
          if (tip) dayPts += calcPoints({ h: tip.h, a: tip.a }, m.result) ?? 0;
        }
        return dayPts;
      });
      for (const m of finishedMatches) {
        const tip = tipMap[`${u._id}-${m._id}`];
        if (!tip) continue;
        tipped++;
        const p = calcPoints({ h: tip.h, a: tip.a }, m.result);
        pts += p;
        if (p === 3) correct++;
        else if (p === 2) diff++;
        else if (p === 1) tendency++;
      }
      return { id: u._id.toString(), name: u.username, pts, correct, diff, tendency, tipped, history };
    });

    board.sort((a, b) => b.pts - a.pts || b.correct - a.correct || b.diff - a.diff);

    return { props: { board, matchdays } };
  } catch (e) {
    return { props: { board: [], matchdays: [] } };
  }
}
