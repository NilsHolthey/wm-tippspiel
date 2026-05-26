import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import useSWR from "swr";
import Nav from "../components/Nav";
import MatchCard from "../components/MatchCard/MatchCard";
import MatchSheet from "../components/MatchSheet";
import s from "../styles/Page.module.css";

const LOCK_MIN = 60;
const KO_LABELS  = { 18: "R32", 19: "AF", 20: "VF", 21: "HF", 22: "P3", 23: "FIN" };
const KO_HEADERS = { 18: "Runde der 32", 19: "Achtelfinale", 20: "Viertelfinale", 21: "Halbfinale", 22: "Spiel um Platz 3", 23: "Finale" };

function isDeadlinePast(kickoff) {
  return Date.now() >= new Date(kickoff).getTime() - LOCK_MIN * 60 * 1000;
}

const fetcher = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(); return r.json(); });

export default function TippsPage({ initialData }) {
  const router = useRouter();
  const { data, mutate } = useSWR("/api/tipps/data", fetcher, {
    fallbackData: initialData ?? undefined,
    revalidateOnFocus: true,
    dedupingInterval: 30000,
  });

  const matches = data?.matches ?? [];
  const defaultMatchday = data?.defaultMatchday ?? 1;
  const [myTipsMap, setMyTipsMap] = useState(data?.myTipsMap ?? {});
  const otherTipsMap = data?.otherTipsMap ?? {};

  // sync myTipsMap when SWR data refreshes
  useEffect(() => {
    if (data?.myTipsMap) setMyTipsMap(data.myTipsMap);
  }, [data]);

  const [selected, setSelected] = useState(defaultMatchday);
  const activePillRef = useRef(null);

  // sync selected to defaultMatchday once data loads
  useEffect(() => {
    if (defaultMatchday) setSelected(defaultMatchday);
  }, [defaultMatchday]);

  useEffect(() => {
    activePillRef.current?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [selected]);

  // overlay state
  const [sheetId, setSheetId] = useState(null);

  // open from URL query on mount
  useEffect(() => {
    if (router.query.match) setSheetId(router.query.match);
  }, []);

  function openSheet(id) {
    setSheetId(id);
    router.push(`/tipps?match=${id}`, undefined, { shallow: true });
  }

  function closeSheet() {
    setSheetId(null);
    router.push("/tipps", undefined, { shallow: true });
  }

  function navigateSheet(id) {
    setSheetId(id);
    router.push(`/tipps?match=${id}`, undefined, { shallow: true });
  }

  function handleTipSaved(matchId, tip) {
    setMyTipsMap(prev => ({ ...prev, [matchId]: tip }));
  }

  // compute prev/next for sheet (within same matchday)
  const sheetMatch = sheetId ? matches.find(m => m._id === sheetId) : null;
  const dayMatches = sheetMatch
    ? matches.filter(m => m.matchday === sheetMatch.matchday).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
    : [];
  const sheetIdx = dayMatches.findIndex(m => m._id === sheetId);
  const prevId = sheetIdx > 0 ? dayMatches[sheetIdx - 1]._id : null;
  const nextId = sheetIdx < dayMatches.length - 1 ? dayMatches[sheetIdx + 1]._id : null;

  const allMatchdays = [...new Set(matches.map(m => m.matchday))].sort((a, b) => a - b);
  const sheetDayIdx = sheetMatch ? allMatchdays.indexOf(sheetMatch.matchday) : -1;
  const prevDayId = sheetDayIdx > 0
    ? matches.filter(m => m.matchday === allMatchdays[sheetDayIdx - 1]).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0]?._id ?? null
    : null;
  const nextDayId = sheetDayIdx >= 0 && sheetDayIdx < allMatchdays.length - 1
    ? matches.filter(m => m.matchday === allMatchdays[sheetDayIdx + 1]).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0]?._id ?? null
    : null;
  const groupStagedays = allMatchdays.filter(d => d <= 17);
  const koDays = allMatchdays.filter(d => d > 17);

  const selectedIdx = allMatchdays.indexOf(selected);
  const prevDay = selectedIdx > 0 ? allMatchdays[selectedIdx - 1] : null;
  const nextDay = selectedIdx < allMatchdays.length - 1 ? allMatchdays[selectedIdx + 1] : null;

  const allOpen = matches.filter(m => !m.finished);
  const tippedCount = allOpen.filter(m => myTipsMap[m._id] && myTipsMap[m._id].lateStatus !== "pending").length;

  const currentMatches = matches.filter(m => m.matchday === selected).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const isGroupStage = selected <= 17;
  const groups = isGroupStage ? [...new Set(currentMatches.map(m => m.group))].filter(Boolean).sort() : null;
  const sectionHeader = KO_HEADERS[selected] ?? `Spieltag ${selected}`;

  function renderCards(list) {
    return list.map((m, i) => (
      <MatchCard
        key={m._id}
        match={m}
        myTip={myTipsMap[m._id] ?? null}
        otherTips={otherTipsMap[m._id] ?? []}
        onOpen={() => openSheet(m._id)}
        index={i}
      />
    ));
  }

  return (
    <>
      <Head><title>Tipps – WM Tippspiel</title></Head>
      <div className={s.app}>
        <Nav />
        <div className={s.wrap}>
          <div className={s.ph}>
            <div className={s.ptitle}>MEINE <span>TIPPS</span></div>
            {allOpen.length > 0 && (
              <div>
                <div className={s.progLbl}>{tippedCount} / {allOpen.length} getippt</div>
                <div className={s.progBar}>
                  <div className={s.progFill} style={{ width: `${(tippedCount / allOpen.length) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className={s.mdNav}>
            {groupStagedays.map(d => (
              <button
                key={d}
                ref={d === selected ? activePillRef : null}
                className={`${s.mdPill}${d === selected ? " " + s.mdPillActive : ""}`}
                onClick={() => setSelected(d)}
              >
                T{d}
              </button>
            ))}
            {groupStagedays.length > 0 && koDays.length > 0 && <div className={s.mdSep} />}
            {koDays.map(d => (
              <button
                key={d}
                ref={d === selected ? activePillRef : null}
                className={`${s.mdPill}${d === selected ? " " + s.mdPillActive : ""}`}
                onClick={() => setSelected(d)}
              >
                {KO_LABELS[d] ?? `T${d}`}
              </button>
            ))}
          </div>

          <div className={s.mdDayNav}>
            <button className={s.mdDayBtn} onClick={() => prevDay && setSelected(prevDay)} disabled={!prevDay}>
              <span className={s.mdDayBtnArrow}>←</span> Vorheriger
            </button>
            <button className={s.mdDayBtn} onClick={() => nextDay && setSelected(nextDay)} disabled={!nextDay}>
              Nächster <span className={s.mdDayBtnArrow}>→</span>
            </button>
          </div>

          {isGroupStage ? (
            groups?.map(g => {
              const gMatches = currentMatches.filter(m => m.group === g);
              return (
                <div key={g}>
                  <div className={s.slbl}>Gruppe {g}</div>
                  <div className={s.mlist}>{renderCards(gMatches)}</div>
                </div>
              );
            })
          ) : (
            <>
              <div className={s.slbl}>{sectionHeader}</div>
              <div className={s.mlist}>{renderCards(currentMatches)}</div>
            </>
          )}
        </div>
      </div>

      {sheetMatch && (
        <MatchSheet
          match={sheetMatch}
          myTip={myTipsMap[sheetId] ?? null}
          otherTips={otherTipsMap[sheetId] ?? []}
          prevId={prevId}
          nextId={nextId}
          prevDayId={prevDayId}
          nextDayId={nextDayId}
          onClose={closeSheet}
          onNavigate={navigateSheet}
          onTipSaved={handleTipSaved}
        />
      )}
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  // return empty — SWR fetches client-side on mount, but we do SSR for first visit via API
  return { props: { initialData: null } };
}
