import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import Nav from "../../components/Nav";
import Stepper from "../../components/MatchCard/Stepper";
import { IconWarning, IconCheck } from "../../components/Icons";
import s from "../../styles/Page.module.css";
import { calcPoints } from "../../lib/scoring";
import { shortName } from "../../lib/teamNames";

const LOCK_MIN = 60;
function isDeadlinePast(kickoff) {
  return Date.now() >= new Date(kickoff).getTime() - LOCK_MIN * 60 * 1000;
}

const KO_HEADERS = { 18: "Runde der 32", 19: "Achtelfinale", 20: "Viertelfinale", 21: "Halbfinale", 22: "Spiel um Platz 3", 23: "Finale" };

export default function MatchTipPage({ match, myTipInit, otherTips, prevId, nextId }) {
  const router = useRouter();
  const [h, setH] = useState(myTipInit?.h ?? 0);
  const [a, setA] = useState(myTipInit?.a ?? 0);
  const [myTip, setMyTip] = useState(myTipInit);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const locked = isDeadlinePast(match.kickoff);
  const isLate = locked && !match.finished;
  const hasTip = !!myTip && myTip.lateStatus !== "pending";
  const tipsVisible = match.finished || (locked && hasTip);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match._id, h, a }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      setMyTip({ h, a, lateStatus: isLate ? "pending" : null });
    } catch {
      alert("Fehler beim Speichern. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  }

  const kickoffDate = new Date(match.kickoff);
  const dateStr = kickoffDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })
    + " · " + kickoffDate.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const phaseLabel = KO_HEADERS[match.matchday] ?? `Spieltag ${match.matchday}`;

  return (
    <>
      <Head><title>{match.home} vs {match.away} – Tipp</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>

          <div className={s.mpNav}>
            <button className={s.mpBack} onClick={() => router.push("/tipps")}>← Tipps</button>
            <div className={s.mpNavArrows}>
              <button className={s.mpArrow} onClick={() => router.push(`/tipps/${prevId}`)} disabled={!prevId}>←</button>
              <button className={s.mpArrow} onClick={() => router.push(`/tipps/${nextId}`)} disabled={!nextId}>→</button>
            </div>
          </div>

          <div className={s.mpMeta}>
            <span className={s.mpDay}>{phaseLabel}</span>
            {match.group && <span className={s.mpGroup}>Gruppe {match.group}</span>}
            <span className={s.mpDate}>{dateStr}</span>
          </div>

          <div className={s.mpTeams}>
            <div className={s.mpTeamCol}>
              <span className={s.mpFlag}>{match.homeFlag}</span>
              <span className={s.mpName}>{match.home}</span>
              {match.homeForm?.length > 0 && (
                <div className={s.mpForm}>
                  {match.homeForm.map((r, i) => (
                    <span key={i} className={`${s.mpFormDot} ${s[`mpForm${r}`]}`}>{r}</span>
                  ))}
                </div>
              )}
            </div>
            <div className={s.mpScore}>
              {match.finished
                ? <span className={s.mpResult}>{match.result.h} : {match.result.a}</span>
                : <span className={s.mpVs}>–:–</span>}
            </div>
            <div className={`${s.mpTeamCol} ${s.mpTeamAway}`}>
              <span className={s.mpFlag}>{match.awayFlag}</span>
              <span className={s.mpName}>{match.away}</span>
              {match.awayForm?.length > 0 && (
                <div className={s.mpForm}>
                  {match.awayForm.map((r, i) => (
                    <span key={i} className={`${s.mpFormDot} ${s[`mpForm${r}`]}`}>{r}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLate && (
            <div className={s.mpLate} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconWarning size={15} style={{ flexShrink: 0 }} />
              Deadline abgelaufen — Admin muss diesen Tipp bestätigen
            </div>
          )}

          {!match.finished ? (
            <div className={s.mpTipping}>
              <div className={s.mpTipLabel}>Dein Tipp</div>
              <div className={s.mpSteppers}>
                <div className={s.mpStepGroup}>
                  <span className={s.mpStepLbl}>{match.home}</span>
                  <Stepper value={h} onChange={setH} />
                </div>
                <span className={s.mpColon}>:</span>
                <div className={s.mpStepGroup}>
                  <span className={s.mpStepLbl}>{match.away}</span>
                  <Stepper value={a} onChange={setA} />
                </div>
              </div>
              <button
                className={`${s.mpSubmit}${isLate ? " " + s.mpSubmitLate : ""}${done ? " " + s.mpSubmitDone : ""}`}
                onClick={submit}
                disabled={done || saving}
              >
                {done ? <><IconCheck size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Gespeichert!</> : saving ? "Speichert…" : isLate ? "Anfrage senden" : myTip ? "Tipp aktualisieren" : "Tipp speichern"}
              </button>
            </div>
          ) : (
            <div className={s.mpFinished}>Spiel beendet</div>
          )}

          {tipsVisible && otherTips.length > 0 && (
            <div className={s.mpOthers}>
              <div className={s.mpOthersTitle}>Alle Tipps</div>
              {otherTips.map((o, i) => (
                <div key={i} className={s.mpOtherRow}>
                  <span className={s.mpOtherName}>{o.name}</span>
                  <span className={s.mpOtherTip}>{o.h} : {o.a}</span>
                  {match.finished && (
                    <span className={`${s.mpOtherPts} ${s[`mpPts${calcPoints({ h: o.h, a: o.a }, match.result)}`]}`}>
                      {calcPoints({ h: o.h, a: o.a }, match.result)} Pkt
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const { matchId } = context.params;
  const { connectDB } = await import("../../lib/db");
  const { default: Match } = await import("../../models/Match");
  const { default: Tip } = await import("../../models/Tip");

  await connectDB();
  const userId = session.user.id;

  const rawMatch = await Match.findById(matchId).lean();
  if (!rawMatch) return { notFound: true };

  const allMatches = await Match.find().sort({ kickoff: 1 }).lean();

  // team form
  const teamForm = {};
  for (const m of allMatches) {
    if (!m.finished || !m.result) continue;
    const { h, a } = m.result;
    if (!teamForm[m.home]) teamForm[m.home] = [];
    if (!teamForm[m.away]) teamForm[m.away] = [];
    teamForm[m.home].push(h > a ? "S" : h < a ? "N" : "U");
    teamForm[m.away].push(a > h ? "S" : a < h ? "N" : "U");
  }

  const dayMatches = allMatches.filter(m => m.matchday === rawMatch.matchday);
  const idx = dayMatches.findIndex(m => m._id.toString() === matchId);
  const prevId = idx > 0 ? dayMatches[idx - 1]._id.toString() : null;
  const nextId = idx < dayMatches.length - 1 ? dayMatches[idx + 1]._id.toString() : null;

  const tips = await Tip.find({ match: matchId }).populate("user", "username").lean();

  const locked = Date.now() >= new Date(rawMatch.kickoff).getTime() - 60 * 60 * 1000;
  let myTipInit = null;
  const otherTips = [];

  for (const tip of tips) {
    if (!tip.user) continue;
    if (tip.user._id.toString() === userId) {
      myTipInit = { h: tip.h, a: tip.a, lateStatus: tip.lateStatus ?? null };
    } else if (locked && (tip.lateStatus === null || tip.lateStatus === "approved")) {
      otherTips.push({ name: tip.user.username, h: tip.h, a: tip.a });
    }
  }

  const match = {
    _id: rawMatch._id.toString(),
    matchday: rawMatch.matchday,
    group: rawMatch.group ?? null,
    home: shortName(rawMatch.home),
    homeFlag: rawMatch.homeFlag ?? "",
    homeForm: (teamForm[rawMatch.home] ?? []).slice(-5),
    away: shortName(rawMatch.away),
    awayFlag: rawMatch.awayFlag ?? "",
    awayForm: (teamForm[rawMatch.away] ?? []).slice(-5),
    kickoff: rawMatch.kickoff.toISOString(),
    finished: rawMatch.finished,
    result: rawMatch.result ?? null,
  };

  return { props: { match, myTipInit, otherTips, prevId, nextId } };
}
