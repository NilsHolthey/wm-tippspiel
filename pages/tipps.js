import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import { flushSync } from "react-dom";
import useSWR from "swr";
import Nav from "../components/Nav";
import MatchCard from "../components/MatchCard/MatchCard";
import MatchCardSkeleton from "../components/MatchCard/MatchCardSkeleton";
import MatchSheet from "../components/MatchSheet";
import { IconInbox, IconCheck } from "../components/Icons";
import s from "../styles/Page.module.css";
import { AnimatePresence, motion, useMotionValue, animate } from "framer-motion";
import { haptic } from "../utils/haptic";

const KO_LABELS  = { 18: "R32", 19: "AF", 20: "VF", 21: "HF", 22: "P3", 23: "FIN" };
const KO_HEADERS = { 18: "Runde der 32", 19: "Achtelfinale", 20: "Viertelfinale", 21: "Halbfinale", 22: "Spiel um Platz 3", 23: "Finale" };

const fetcher = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(); return r.json(); });

export default function TippsPage({ initialData }) {
  const router = useRouter();
  const { data } = useSWR("/api/tipps/data", fetcher, {
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
  const mdNavRef = useRef(null);
  const slideDir = useRef(1);
  const x = useMotionValue(0);

  // sync selected to defaultMatchday once data loads
  useEffect(() => {
    if (defaultMatchday) setSelected(defaultMatchday);
  }, [defaultMatchday]);

  useEffect(() => {
    activePillRef.current?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [selected]);

  async function handleDragEnd(_, info) {
    const swipeNext = info.offset.x < -40 || info.velocity.x < -300;
    const swipePrev = info.offset.x >  40 || info.velocity.x >  300;
    if (swipeNext && nextDay) {
      haptic(8);
      slideDir.current = 1;
      await animate(x, -600, { duration: 0.2, ease: [0.4, 0, 1, 1] });
      x.set(600);
      flushSync(() => setSelected(nextDay));
      animate(x, 0, { duration: 0.2, ease: [0, 0, 0.2, 1] });
    } else if (swipePrev && prevDay) {
      haptic(8);
      slideDir.current = -1;
      await animate(x, 600, { duration: 0.2, ease: [0.4, 0, 1, 1] });
      x.set(-600);
      flushSync(() => setSelected(prevDay));
      animate(x, 0, { duration: 0.2, ease: [0, 0, 0.2, 1] });
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
    }
  }

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

  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  function handleTipSaved(matchId, tip) {
    setMyTipsMap(prev => ({ ...prev, [matchId]: tip }));
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
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
    return list.map((m) => (
      <MatchCard
        key={m._id}
        match={m}
        myTip={myTipsMap[m._id] ?? null}
        otherTips={otherTipsMap[m._id] ?? []}
        onOpen={() => openSheet(m._id)}
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

          <div className={s.mdNav} ref={mdNavRef}>
            {!data ? (
              ["T1","T2","T3","T4","T5","T6","T7","T8"].map(lbl => (
                <div key={lbl} className={`${s.mdPill} ${s.mdPillSkeleton}`}>{lbl}</div>
              ))
            ) : (
              <>
                {groupStagedays.map(d => (
                  <button
                    key={d}
                    ref={d === selected ? activePillRef : null}
                    className={`${s.mdPill}${d === selected ? " " + s.mdPillActive : ""}`}
                    onClick={() => { slideDir.current = d > selected ? 1 : -1; setSelected(d); }}
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
                    onClick={() => { slideDir.current = d > selected ? 1 : -1; setSelected(d); }}
                  >
                    {KO_LABELS[d] ?? `T${d}`}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className={s.mdDayNav}>
            <button className={s.mdDayBtn} onClick={() => { if (prevDay) { slideDir.current = -1; setSelected(prevDay); } }} disabled={!prevDay}>
              <span className={s.mdDayBtnArrow}>←</span> Vorheriger
            </button>
            <button className={s.mdDayBtn} onClick={() => { if (nextDay) { slideDir.current = 1; setSelected(nextDay); } }} disabled={!nextDay}>
              Nächster <span className={s.mdDayBtnArrow}>→</span>
            </button>
          </div>

          <div style={{ overflowX: "clip" }}>
            {!data ? (
              <>
                {[0, 1].map(g => (
                  <div key={g}>
                    <div className={s.slblSkeleton} />
                    <div className={s.mlist}>
                      {[0, 1, 2].map(i => <MatchCardSkeleton key={i} />)}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <motion.div
                drag="x"
                dragConstraints={false}
                dragDirectionLock
                dragMomentum={false}
                style={{ x, touchAction: "pan-y" }}
                onDragEnd={handleDragEnd}
              >
                <div key={selected}>
                  {currentMatches.length === 0 ? (
                    <div className={s.emptyState}>
                      <IconInbox size={44} className={s.emptyIcon} style={{ color: "var(--muted)" }} />
                      <p className={s.emptyTitle}>Keine Spiele an diesem Spieltag</p>
                    </div>
                  ) : isGroupStage ? (
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
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sheetMatch && (
          <MatchSheet
            match={sheetMatch}
            myTip={myTipsMap[sheetId] ?? null}
            otherTips={otherTipsMap[sheetId] ?? []}
            groupMatches={sheetMatch?.group ? matches.filter(m => m.group === sheetMatch.group) : []}
            prevId={prevId}
            nextId={nextId}
            prevDayId={prevDayId}
            nextDayId={nextDayId}
            onClose={closeSheet}
            onNavigate={navigateSheet}
            onTipSaved={handleTipSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            className={s.toast}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <IconCheck size={14} style={{ verticalAlign: "middle", marginRight: 5 }} />
            Tipp gespeichert
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/login", permanent: false } };
  // return empty — SWR fetches client-side on mount, but we do SSR for first visit via API
  return { props: { initialData: null } };
}
