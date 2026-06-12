import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import BottomNav from "@/components/BottomNav";

const PTR_SHOW    = 28;   // px before overlay appears
const PTR_THRESHOLD = 110;  // px to actually trigger refresh

function usePullToRefresh(onRefresh) {
  const [active, setActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullDist = useRef(0);

  useEffect(() => {
    const onStart = (e) => {
      if (window.scrollY > 2) return;
      if (document.documentElement.style.overflow === "hidden") return;
      startY.current = e.touches[0].clientY;
      pullDist.current = 0;
    };
    const onMove = (e) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        e.preventDefault();
        pullDist.current = dy;
        if (dy >= PTR_SHOW && !active) setActive(true);
        if (dy < PTR_SHOW && active)  setActive(false);
      }
    };
    const onEnd = async () => {
      if (startY.current === null) return;
      const dist = pullDist.current;
      startY.current = null;
      pullDist.current = 0;
      setActive(false);
      if (dist >= PTR_THRESHOLD) {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove",  onMove,  { passive: false });
    document.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove",  onMove);
      document.removeEventListener("touchend",   onEnd);
    };
  }, [active, onRefresh]);

  return { active, refreshing };
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const hideTimer = useRef(null);

  const { active: ptrActive, refreshing } = usePullToRefresh(() => router.reload());

  useEffect(() => {
    const start = (_url, { shallow } = {}) => {
      if (shallow) return;
      clearTimeout(hideTimer.current);
    };
    const done = () => {
      clearTimeout(hideTimer.current);
    };
    router.events.on("routeChangeStart",    start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError",    done);
    return () => {
      clearTimeout(hideTimer.current);
      router.events.off("routeChangeStart",    start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError",    done);
    };
  }, [router]);

  const showChrome = router.pathname !== "/login";

  return (
    <SessionProvider session={session}>
      {/* Pull-to-refresh overlay */}
      {(ptrActive || refreshing) && showChrome && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 400,
          pointerEvents: "none",
          opacity: 1,
          transition: "opacity 0.15s",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(6, 10, 27, 0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg
            width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="#ceac4d" strokeWidth="2" strokeLinecap="round"
            style={{
              animation: "spin 0.7s linear infinite",
              display: "block",
              filter: "drop-shadow(0 0 10px rgba(201,168,76,0.6))",
            }}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </div>
      )}

      <OfflineBanner />
      {showChrome && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: "80px",
          background: "linear-gradient(to bottom, #060A1B 0%, transparent 100%)",
          zIndex: 190, pointerEvents: "none",
        }} />
      )}
      <Component {...pageProps} />
      {showChrome && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: "110px",
          background: "linear-gradient(to top, #060A1B 0%, transparent 100%)",
          zIndex: 190, pointerEvents: "none",
        }} />
      )}
      <BottomNav />
    </SessionProvider>
  );
}
