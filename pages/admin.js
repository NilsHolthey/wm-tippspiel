import { useState } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import Nav from "../components/Nav";
import MiniStepper from "../components/MiniStepper";
import s from "../styles/Page.module.css";

function AdminResultRow({ match }) {
  const [rH, setRH] = useState(match.result?.h ?? 0);
  const [rA, setRA] = useState(match.result?.a ?? 0);
  const [done, setDone] = useState(match.finished);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/results", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match._id, h: rH, a: rA }),
    });
    setSaving(false);
    setDone(true);
  }

  return (
    <div className={`${s.arow}${done ? " " + s.arowDone : ""}`}>
      <span className={s.arowMatch}>
        {match.homeFlag} {match.home} vs {match.away} {match.awayFlag}
      </span>
      <div className={s.arowEntry}>
        <MiniStepper value={rH} onChange={setRH} />
        <span className={s.arowColon}>:</span>
        <MiniStepper value={rA} onChange={setRA} />
        <button className={s.arowSave} onClick={save} disabled={saving}>
          {done ? "Update" : saving ? "…" : "Speichern"}
        </button>
        {done && <span className={s.arowDoneLabel}>✅ {rH}:{rA}</span>}
      </div>
    </div>
  );
}


function SyncSection() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function sync() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unbekannter Fehler");
      setStatus({ ok: true, data });
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <button className={s.arowSave} onClick={sync} disabled={loading} style={{ height: "auto", padding: "8px 16px" }}>
        {loading ? "⏳ Synchronisiere…" : "🔄 Ergebnisse synchronisieren"}
      </button>
      {status && (
        <span style={{ fontSize: "0.82rem", color: status.ok ? "var(--green)" : "var(--red)" }}>
          {status.ok
            ? status.data.updated === 0 && status.data.namesUpdated === 0
              ? `Keine Änderungen (${status.data.checked} Spiele geprüft)`
              : `✅ ${status.data.updated} Ergebnis(se)${status.data.namesUpdated ? `, ${status.data.namesUpdated} Teamnamen` : ""} aktualisiert${status.data.details.length ? `: ${status.data.details.map(d => `${d.match} ${d.result}`).join(", ")}` : ""}`
            : `✗ Fehler: ${status.msg}`}
        </span>
      )}
    </div>
  );
}

export default function AdminPage({ matches, lateRequestsInit }) {
  const [lateRequests, setLateRequests] = useState(lateRequestsInit);

  async function handleRequest(requestId, action) {
    await fetch("/api/admin/late-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    setLateRequests((prev) => prev.filter((r) => r._id !== requestId));
  }

  return (
    <>
      <Head><title>Admin – WM Tippspiel</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph} style={{ marginBottom: 22 }}>
            <div className={s.ptitle}>⚙️ <span>ADMIN</span></div>
          </div>

          <div className={s.asec}>
            <div className={s.asecTitle}>
              ⏰ Verspätete Anfragen
              {lateRequests.length > 0 && (
                <span className={s.nbadge}>{lateRequests.length}</span>
              )}
            </div>
            {lateRequests.length === 0 ? (
              <p className={s.empty}>Keine offenen Anfragen.</p>
            ) : (
              lateRequests.map((r) => (
                <div key={r._id} className={s.lrrow}>
                  <div>
                    <div className={s.lrWho}>👤 {r.user.username}</div>
                    <div className={s.lrMatch}>
                      {r.match.homeFlag} {r.match.home} vs {r.match.away} {r.match.awayFlag}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 2, alignItems: "center" }}>
                      <span className={s.lrTip}>Tipp: {r.tip.h} : {r.tip.a}</span>
                      <span className={s.lrTime}>
                        {new Date(r.requestedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                      </span>
                    </div>
                  </div>
                  <div className={s.lrBtns}>
                    <button className={s.btnOk} onClick={() => handleRequest(r._id, "approve")}>✓ Genehmigen</button>
                    <button className={s.btnNo} onClick={() => handleRequest(r._id, "reject")}>✗ Ablehnen</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={s.asec}>
            <div className={s.asecTitle}>🔄 Ergebnisse synchronisieren</div>
            <SyncSection />
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 6, display: "block" }}>
              Zieht Ergebnisse und Teamnamen von openfootball (GitHub). Kein API-Key nötig.
            </span>
          </div>

          <div className={s.asec}>
            <div className={s.asecTitle}>Ergebnisse eintragen</div>
            {matches.map((m) => (
              <AdminResultRow key={m._id} match={m} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  if (!session.user.isAdmin) return { redirect: { destination: "/tipps", permanent: false } };

  const { connectDB } = await import("../lib/db");
  const { default: Match } = await import("../models/Match");
  const { default: LateRequest } = await import("../models/LateRequest");

  await connectDB();

  const matches = await Match.find().sort({ kickoff: 1 }).lean();
  const lateRequests = await LateRequest.find({ status: "pending" })
    .populate("user", "username")
    .populate("match")
    .populate("tip")
    .lean();

  return {
    props: {
      matches: matches.map((m) => ({
        _id: m._id.toString(),
        home: m.home,
        homeFlag: m.homeFlag ?? "",
        away: m.away,
        awayFlag: m.awayFlag ?? "",
        finished: m.finished,
        result: m.result ?? null,
      })),
      lateRequestsInit: lateRequests.map((r) => ({
        _id: r._id.toString(),
        user: { username: r.user.username },
        match: {
          home: r.match.home,
          homeFlag: r.match.homeFlag ?? "",
          away: r.match.away,
          awayFlag: r.match.awayFlag ?? "",
        },
        tip: { h: r.tip.h, a: r.tip.a },
        requestedAt: r.requestedAt.toISOString(),
      })),
    },
  };
}
