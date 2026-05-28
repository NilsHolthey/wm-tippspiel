import Head from "next/head";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Nav from "../components/Nav";
import { IconCheck, IconMinus, IconTrendUp } from "../components/Icons";
import s from "../styles/Page.module.css";
import { calcPoints } from "../lib/scoring";

export default function RanglistePage({ board }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentUserId = session?.user?.id;
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);
  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <>
      <Head><title>Rangliste – WM Tippspiel</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph} style={{ marginBottom: 22 }}>
            <div className={s.ptitle}><span>RANGLISTE</span></div>
          </div>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.th}>#</th>
                  <th className={s.th}>Spieler</th>
                  <th className={`${s.th} ${s.thC}`}>Punkte</th>
                  <th className={`${s.th} ${s.thC}`}><IconCheck size={13} style={{ verticalAlign: "middle", color: "var(--green)" }} /></th>
                  <th className={`${s.th} ${s.thC}`}><IconMinus size={13} style={{ verticalAlign: "middle", color: "var(--gold)" }} /></th>
                  <th className={`${s.th} ${s.thC}`}><IconTrendUp size={13} style={{ verticalAlign: "middle", color: "var(--yellow)" }} /></th>
                  <th className={`${s.th} ${s.thC}`}>Tipps</th>
                </tr>
              </thead>
              <tbody>
                {board.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    className={`${s.tr}${p.id === currentUserId ? " " + s.trMe : ""}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut", delay: i * 0.04 }}
                  >
                    <td className={s.td}><span className={s.tRank}>{i + 1}</span></td>
                    <td className={s.td}>
                      <span className={s.tName}>{p.name}</span>
                      {p.id === currentUserId && <span className={s.tYou}> (Du)</span>}
                    </td>
                    <td className={s.tdC}><span className={s.tPts}>{p.pts}</span></td>
                    <td className={s.tdC}><span className={s.tG}>{p.correct}</span></td>
                    <td className={s.tdC}><span className={s.tS}>{p.diff}</span></td>
                    <td className={s.tdC}><span className={s.tS}>{p.tendency}</span></td>
                    <td className={s.tdC}><span className={s.tS}>{p.tipped}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
            {[
              ["pts3", "3 Pkt", "Richtiges Ergebnis"],
              ["pts2", "2 Pkt", "Richtige Differenz"],
              ["pts1", "1 Pkt", "Richtige Tendenz"],
            ].map(([cls, label, desc]) => (
              <div key={cls} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--muted)" }}>
                <span className={`${s.legendChip} ${s[cls]}`}>{label}</span>{desc}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  try {
    const { connectDB } = await import("../lib/db");
    const { default: User } = await import("../models/User");
    const { default: Match } = await import("../models/Match");
    const { default: Tip } = await import("../models/Tip");

    await connectDB();

    const users = await User.find().lean();
    const finishedMatches = await Match.find({ finished: true }).lean();
    const tips = await Tip.find({ lateStatus: { $in: [null, "approved"] } }).lean();

    const tipMap = {};
    for (const t of tips) tipMap[`${t.user}-${t.match}`] = t;

    const board = users.map((u) => {
      let pts = 0, correct = 0, diff = 0, tendency = 0, tipped = 0;
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
      return { id: u._id.toString(), name: u.username, pts, correct, diff, tendency, tipped };
    });

    board.sort((a, b) => b.pts - a.pts || b.correct - a.correct || b.diff - a.diff);

    return { props: { board }, revalidate: 60 };
  } catch (e) {
    return { props: { board: [] }, revalidate: 30 };
  }
}
