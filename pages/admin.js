import { useState } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import MiniStepper from "../components/MiniStepper";
import { IconClock, IconUser, IconRefresh, IconHourglass, IconCheck, IconX } from "../components/Icons";
import PageHeader from "../components/PageHeader";
import s from "../styles/Page.module.css";
import a from "../styles/Admin.module.css";
import { dayLabel, formatDate } from "../lib/format";

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
    <div className={`${a.arow}${done ? " " + a.arowDone : ""}`}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {match.kickoff && (
          <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: 3 }}>
            {formatDate(match.kickoff)}{match.group ? ` · Gruppe ${match.group}` : ""}
          </div>
        )}
        <div className={a.arowMatch}>
          {match.homeFlag} {match.home} – {match.away} {match.awayFlag}
        </div>
      </div>
      <div className={a.arowControls}>
        <div className={a.arowEntry}>
          <MiniStepper value={rH} onChange={setRH} />
          <span className={a.arowColon}>:</span>
          <MiniStepper value={rA} onChange={setRA} />
        </div>
        {done
          ? <div className={a.arowDoneLabel} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IconCheck size={12} />{rH}:{rA} gespeichert
            </div>
          : <button className={a.arowSave} onClick={save} disabled={saving}>
              {saving ? "Speichert…" : "Speichern"}
            </button>
        }
      </div>
    </div>
  );
}

const INPUT_STYLE = {
  background: "var(--d4)", border: "1px solid var(--border)", borderRadius: 6,
  color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
  padding: "5px 8px", outline: "none", width: "100%",
};

const SELECT_STYLE = {
  ...INPUT_STYLE,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  paddingRight: 28,
};

function parseOptions(placeholder, groupTeams, matchTeams) {
  const mW = placeholder.match(/^W(\d+)$/);
  if (mW) return matchTeams[parseInt(mW[1])] ?? [];

  const m3 = placeholder.match(/^\d([A-Z](?:\/[A-Z])+)$/);
  if (m3) return m3[1].split("/").flatMap(g => groupTeams[g] ?? []);

  const m1 = placeholder.match(/^\d([A-Z])$/);
  if (m1) return groupTeams[m1[1]] ?? [];

  return null;
}

function AdminTeamRow({ match, groupTeams, matchTeams }) {
  const [home,     setHome]     = useState(match.home);
  const [homeFlag, setHomeFlag] = useState(match.homeFlag ?? "");
  const [away,     setAway]     = useState(match.away);
  const [awayFlag, setAwayFlag] = useState(match.awayFlag ?? "");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const homeOpts = isPlaceholder(match.home) ? parseOptions(match.home, groupTeams, matchTeams) : null;
  const awayOpts = isPlaceholder(match.away) ? parseOptions(match.away, groupTeams, matchTeams) : null;

  function pickHome(name) {
    setHome(name);
    const t = homeOpts?.find(o => o.name === name);
    if (t?.flag) setHomeFlag(t.flag);
    setSaved(false);
  }

  function pickAway(name) {
    setAway(name);
    const t = awayOpts?.find(o => o.name === name);
    if (t?.flag) setAwayFlag(t.flag);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/teams", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match._id, home, homeFlag, away, awayFlag }),
    });
    setSaving(false);
    setSaved(true);
  }

  const dirty = home !== match.home || homeFlag !== (match.homeFlag ?? "") ||
                away !== match.away || awayFlag !== (match.awayFlag ?? "");

  return (
    <div className={a.arow} style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
      <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>
        {formatDate(match.kickoff)} · Spiel #{match.num ?? "–"} · {match.phase}
        {" · "}<span style={{ color: "var(--gold)", opacity: 0.65 }}>{match.home} – {match.away}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
        {homeOpts ? (
          <select style={SELECT_STYLE} value={home} onChange={e => pickHome(e.target.value)}>
            <option value={match.home}>{isPlaceholder(match.home) ? `– ${match.home}` : match.home}</option>
            {homeOpts.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
          </select>
        ) : (
          <div style={{ display: "flex", gap: 4 }}>
            <input style={{ ...INPUT_STYLE, width: "2.4rem", flexShrink: 0, textAlign: "center", padding: "5px 4px" }}
              value={homeFlag} onChange={e => { setHomeFlag(e.target.value); setSaved(false); }}
              placeholder="🏳" maxLength={4}
            />
            <input style={INPUT_STYLE} value={home}
              onChange={e => { setHome(e.target.value); setSaved(false); }} placeholder="Team Heim" />
          </div>
        )}
        <span style={{ color: "var(--muted)", textAlign: "center", fontSize: "0.82rem", padding: "0 2px" }}>–</span>
        {awayOpts ? (
          <select style={SELECT_STYLE} value={away} onChange={e => pickAway(e.target.value)}>
            <option value={match.away}>{isPlaceholder(match.away) ? `– ${match.away}` : match.away}</option>
            {awayOpts.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
          </select>
        ) : (
          <div style={{ display: "flex", gap: 4 }}>
            <input style={INPUT_STYLE} value={away}
              onChange={e => { setAway(e.target.value); setSaved(false); }} placeholder="Team Auswärts" />
            <input style={{ ...INPUT_STYLE, width: "2.4rem", flexShrink: 0, textAlign: "center", padding: "5px 4px" }}
              value={awayFlag} onChange={e => { setAwayFlag(e.target.value); setSaved(false); }}
              placeholder="🏳" maxLength={4}
            />
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {saved && !dirty
          ? <span style={{ fontSize: "0.78rem", color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}><IconCheck size={12} />Gespeichert</span>
          : <button className={a.arowSave} onClick={save} disabled={saving || !dirty}>
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
      <button className={a.arowSave} onClick={sync} disabled={loading} style={{ height: "auto", padding: "8px 16px" }}>
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

function isPlaceholder(name) {
  return /^[0-9W]/.test(name) || name.includes("/");
}

export default function AdminPage({ matches, koMatches, groupTeams, matchTeams, lateRequestsInit }) {
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
        <div className={s.wrap}>
          <PageHeader style={{ marginBottom: 22 }}><span>ADMIN</span></PageHeader>

          {/* Late requests */}
          <div className={a.asec}>
            <div className={a.asecTitle}>
              <IconClock size={14} />
              Verspätete Anfragen
              {lateRequests.length > 0 && <span className={a.nbadge}>{lateRequests.length}</span>}
            </div>
            {lateRequests.length === 0 ? (
              <p className={s.empty}>Keine offenen Anfragen.</p>
            ) : (
              lateRequests.map(r => (
                <div key={r._id} className={a.lrrow}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className={a.lrWho} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <IconUser size={13} />
                      {r.user.username}
                    </div>
                    {r.match.kickoff && (
                      <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginBottom: 2 }}>
                        {formatDate(r.match.kickoff)}
                      </div>
                    )}
                    <div className={a.lrMatch}>
                      {r.match.homeFlag} {r.match.home} – {r.match.away} {r.match.awayFlag}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4, alignItems: "center" }}>
                      <span className={a.lrTip}>Tipp: {r.tip.h} : {r.tip.a}</span>
                      <span className={a.lrTime}>
                        {new Date(r.requestedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                      </span>
                    </div>
                  </div>
                  <div className={a.lrBtns}>
                    <button className={a.btnOk} onClick={() => handleRequest(r._id, "approve")}>
                      <IconCheck size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Genehmigen
                    </button>
                    <button className={a.btnNo} onClick={() => handleRequest(r._id, "reject")}>
                      <IconX size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Ablehnen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* KO team name overrides */}
          {koMatches.length > 0 && (
            <div className={a.asec}>
              <div className={a.asecTitle}>
                KO-Runde · Teams eintragen
                <span className={a.nbadge}>{koMatches.length}</span>
              </div>
              {koMatches.map(m => <AdminTeamRow key={m._id} match={m} groupTeams={groupTeams} matchTeams={matchTeams} />)}
            </div>
          )}

          {/* Sync — disabled: results don't arrive in time via openfootball */}
          {/* <div className={a.asec}>
            <div className={a.asecTitle}><IconRefresh size={14} /> Ergebnisse synchronisieren</div>
            <SyncSection />
          </div> */}

          {/* Results entry */}
          <div className={a.asec}>
            <div className={a.asecTitle}>
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

  function isPlaceholderSSR(name) {
    return /^[0-9W]/.test(name) || name.includes("/");
  }

  // Build group → [{name, flag}] from group stage matches
  const groupTeams = {};
  for (const m of matches) {
    if (m.phase !== "Gruppenphase" || !m.group) continue;
    const g = m.group;
    if (!groupTeams[g]) groupTeams[g] = [];
    if (!groupTeams[g].find(t => t.name === m.home))
      groupTeams[g].push({ name: m.home, flag: m.homeFlag ?? "" });
    if (!groupTeams[g].find(t => t.name === m.away))
      groupTeams[g].push({ name: m.away, flag: m.awayFlag ?? "" });
  }

  // Build fixtureId → [{name, flag}] for KO matches with real team names
  const matchTeams = {};
  for (const m of matches) {
    if (!m.fixtureId || m.phase === "Gruppenphase") continue;
    const teams = [
      { name: m.home, flag: m.homeFlag ?? "" },
      { name: m.away, flag: m.awayFlag ?? "" },
    ].filter(t => !isPlaceholderSSR(t.name));
    if (teams.length) matchTeams[m.fixtureId] = teams;
  }

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
        phase: m.phase ?? "Gruppenphase",
        home: m.home,
        homeFlag: m.homeFlag ?? "",
        away: m.away,
        awayFlag: m.awayFlag ?? "",
        finished: m.finished,
        result: m.result ?? null,
      })),
      koMatches: matches
        .filter(m => m.phase !== "Gruppenphase" && (isPlaceholderSSR(m.home) || isPlaceholderSSR(m.away)))
        .map(m => ({
          _id: m._id.toString(),
          num: m.fixtureId ?? null,
          matchday: m.matchday,
          phase: m.phase ?? "",
          kickoff: m.kickoff.toISOString(),
          home: m.home,
          homeFlag: m.homeFlag ?? "",
          away: m.away,
          awayFlag: m.awayFlag ?? "",
        })),
      groupTeams,
      matchTeams,
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
