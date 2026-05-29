import { useState } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import Nav from "../components/Nav";
import MiniStepper from "../components/MiniStepper";
import { IconClock, IconUser, IconRefresh, IconHourglass, IconCheck, IconX } from "../components/Icons";
import s from "../styles/Page.module.css";

const KO_HEADERS = { 18: "Runde der 32", 19: "Achtelfinale", 20: "Viertelfinale", 21: "Halbfinale", 22: "Spiel um Platz 3", 23: "Finale" };

function dayLabel(d) {
  return d <= 17 ? `Spieltag ${d}` : (KO_HEADERS[d] ?? `Spieltag ${d}`);
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })
    + " · " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

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
      <div style={{ minWidth: 0, flex: 1 }}>
        {match.kickoff && (
          <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: 3 }}>
            {fmtDate(match.kickoff)}{match.group ? ` · Gruppe ${match.group}` : ""}
          </div>
        )}
        <div className={s.arowMatch}>
          {match.homeFlag} {match.home} – {match.away} {match.awayFlag}
        </div>
      </div>
      <div className={s.arowControls}>
        <div className={s.arowEntry}>
          <MiniStepper value={rH} onChange={setRH} />
          <span className={s.arowColon}>:</span>
          <MiniStepper value={rA} onChange={setRA} />
        </div>
        {done
          ? <div className={s.arowDoneLabel} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IconCheck size={12} />{rH}:{rA} gespeichert
            </div>
          : <button className={s.arowSave} onClick={save} disabled={saving}>
              {saving ? "Speichert…" : "Speichern"}
            </button>
        }
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
        {loading
          ? <><IconHourglass size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />Synchronisiere…</>
          : <><IconRefresh size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />Ergebnisse synchronisieren</>
        }
      </button>
      {status && (
        <span style={{ fontSize: "0.82rem", color: status.ok ? "var(--green)" : "var(--red)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {status.ok ? <IconCheck size={13} /> : <IconX size={13} />}
          {status.ok
            ? status.data.updated === 0 && status.data.namesUpdated === 0
              ? `Keine Änderungen (${status.data.checked} Spiele geprüft)`
              : `${status.data.updated} Ergebnis(se)${status.data.namesUpdated ? `, ${status.data.namesUpdated} Teamnamen` : ""} aktualisiert${status.data.details.length ? `: ${status.data.details.map(d => `${d.match} ${d.result}`).join(", ")}` : ""}`
            : `Fehler: ${status.msg}`}
        </span>
      )}
    </div>
  );
}

export default function AdminPage({ matches, lateRequestsInit }) {
  const [lateRequests, setLateRequests] = useState(lateRequestsInit);
  const [filterOpen, setFilterOpen] = useState(true);

  // Group matches by matchday
  const grouped = {};
  for (const m of matches) {
    if (!grouped[m.matchday]) grouped[m.matchday] = [];
    grouped[m.matchday].push(m);
  }
  const matchdays = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  // Default: expand matchdays that have unfinished matches
  const [openGroups, setOpenGroups] = useState(() => {
    const unfinished = matches.filter(m => !m.finished);
    if (!unfinished.length) return {};
    const activeDay = unfinished.reduce((closest, m) =>
      Math.abs(new Date(m.kickoff) - Date.now()) < Math.abs(new Date(closest.kickoff) - Date.now()) ? m : closest
    ).matchday;
    return { [activeDay]: true };
  });

  function toggleGroup(day) {
    setOpenGroups(p => ({ ...p, [day]: !p[day] }));
  }

  async function handleRequest(requestId, action) {
    await fetch("/api/admin/late-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    setLateRequests(prev => prev.filter(r => r._id !== requestId));
  }

  const visibleDays = filterOpen
    ? matchdays.filter(d => grouped[d].some(m => !m.finished))
    : matchdays;

  return (
    <>
      <Head><title>Admin – WM Tippspiel</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph} style={{ marginBottom: 22 }}>
            <div className={s.ptitle}><span>ADMIN</span></div>
          </div>

          {/* Late requests */}
          <div className={s.asec}>
            <div className={s.asecTitle}>
              <IconClock size={14} />
              Verspätete Anfragen
              {lateRequests.length > 0 && <span className={s.nbadge}>{lateRequests.length}</span>}
            </div>
            {lateRequests.length === 0 ? (
              <p className={s.empty}>Keine offenen Anfragen.</p>
            ) : (
              lateRequests.map(r => (
                <div key={r._id} className={s.lrrow}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className={s.lrWho} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <IconUser size={13} />
                      {r.user.username}
                    </div>
                    {r.match.kickoff && (
                      <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: 2 }}>
                        {fmtDate(r.match.kickoff)}
                      </div>
                    )}
                    <div className={s.lrMatch}>
                      {r.match.homeFlag} {r.match.home} – {r.match.away} {r.match.awayFlag}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4, alignItems: "center" }}>
                      <span className={s.lrTip}>Tipp: {r.tip.h} : {r.tip.a}</span>
                      <span className={s.lrTime}>
                        {new Date(r.requestedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                      </span>
                    </div>
                  </div>
                  <div className={s.lrBtns}>
                    <button className={s.btnOk} onClick={() => handleRequest(r._id, "approve")}>
                      <IconCheck size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Genehmigen
                    </button>
                    <button className={s.btnNo} onClick={() => handleRequest(r._id, "reject")}>
                      <IconX size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Ablehnen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sync */}
          <div className={s.asec}>
            <div className={s.asecTitle}><IconRefresh size={14} /> Ergebnisse synchronisieren</div>
            <SyncSection />
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 6, display: "block" }}>
              Zieht Ergebnisse und Teamnamen von openfootball (GitHub). Kein API-Key nötig.
            </span>
          </div>

          {/* Results entry */}
          <div className={s.asec}>
            <div className={s.asecTitle}>
              Ergebnisse eintragen
              <button
                onClick={() => setFilterOpen(p => !p)}
                style={{
                  marginLeft: "auto", background: filterOpen ? "rgba(201,168,76,0.12)" : "var(--d4)",
                  border: `1px solid ${filterOpen ? "rgba(201,168,76,0.35)" : "var(--border)"}`,
                  borderRadius: 6, color: filterOpen ? "var(--gold)" : "var(--muted)",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem",
                  fontWeight: 600, letterSpacing: "0.05em", padding: "3px 10px", textTransform: "uppercase",
                }}
              >
                {filterOpen ? "Nur offene" : "Alle"}
              </button>
            </div>

            {visibleDays.length === 0 && (
              <p className={s.empty}>Alle Ergebnisse eingetragen.</p>
            )}

            {visibleDays.map(day => {
              const dayMatches = filterOpen
                ? grouped[day].filter(m => !m.finished)
                : grouped[day];
              const isOpen = openGroups[day] ?? false;
              const openCount = grouped[day].filter(m => !m.finished).length;
              const total = grouped[day].length;

              return (
                <div key={day} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => toggleGroup(day)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      background: "var(--d3)", border: "1px solid var(--border)",
                      borderRadius: isOpen ? "8px 8px 0 0" : 8,
                      padding: "9px 14px", cursor: "pointer", marginBottom: 0,
                      color: "var(--text)", fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.82rem", fontWeight: 600, textAlign: "left",
                    }}
                  >
                    <span>{dayLabel(day)}</span>
                    {openCount > 0 && (
                      <span style={{ fontSize: "0.68rem", color: "var(--gold)", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 4, padding: "1px 6px" }}>
                        {openCount} offen
                      </span>
                    )}
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: openCount > 0 ? 0 : "auto" }}>
                      {openCount === 0 && `${total}/${total} ✓`}
                    </span>
                    <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "0.75rem" }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                      {dayMatches.map(m => <AdminResultRow key={m._id} match={m} />)}
                    </div>
                  )}
                </div>
              );
            })}
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
      matches: matches.map(m => ({
        _id: m._id.toString(),
        matchday: m.matchday,
        kickoff: m.kickoff.toISOString(),
        group: m.group ?? null,
        home: m.home,
        homeFlag: m.homeFlag ?? "",
        away: m.away,
        awayFlag: m.awayFlag ?? "",
        finished: m.finished,
        result: m.result ?? null,
      })),
      lateRequestsInit: lateRequests.map(r => ({
        _id: r._id.toString(),
        user: { username: r.user.username },
        match: {
          home: r.match.home,
          homeFlag: r.match.homeFlag ?? "",
          away: r.match.away,
          awayFlag: r.match.awayFlag ?? "",
          kickoff: r.match.kickoff.toISOString(),
        },
        tip: { h: r.tip.h, a: r.tip.a },
        requestedAt: r.requestedAt.toISOString(),
      })),
    },
  };
}
