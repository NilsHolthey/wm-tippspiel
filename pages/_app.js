import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import BottomNav from "@/components/BottomNav";
import LoadingScreen from "@/components/LoadingScreen";

const PTR_THRESHOLD = 72;

function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  useEffect(() => {
    const onStart = (e) => {
      if (window.scrollY > 2) return;
      if (document.documentElement.style.overflow === "hidden") return;
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        pulling.current = true;
        setPullY(Math.min(dy * 0.45, PTR_THRESHOLD + 16));
      }
    };
    const onEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      const captured = pullY;
      setPullY(0);
      startY.current = null;
      if (captured >= PTR_THRESHOLD) {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove",  onMove,  { passive: true });
    document.addEventListener("touchend",   onEnd,   { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove",  onMove);
      document.removeEventListener("touchend",   onEnd);
    };
  }, [pullY, onRefresh]);

  return { pullY, refreshing };
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const hideTimer = useRef(null);

  const { pullY, refreshing } = usePullToRefresh(() => router.reload());

  useEffect(() => {
    const start = (_url, { shallow } = {}) => {
      if (shallow) return;
      clearTimeout(hideTimer.current);
      setLoading(true);
    };
    const done = () => {
      clearTimeout(hideTimer.current);
      // Hold the loading screen for 350ms after routeChangeComplete so the
      // new page has time to paint before we reveal it (fixes iOS Chrome flash).
      hideTimer.current = setTimeout(() => setLoading(false), 350);
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

  const ptrProgress = Math.min(pullY / PTR_THRESHOLD, 1);

  return (
    <SessionProvider session={session}>
      {/* {loading && <LoadingScreen />} */}

      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && showChrome && (
        <div style={{
          position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 400, pointerEvents: "none",
          opacity: refreshing ? 1 : ptrProgress,
          transition: refreshing ? "none" : "opacity 0.1s",
        }}>
          <svg
            width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#ceac4d" strokeWidth="2.2" strokeLinecap="round"
            style={{
              animation: refreshing ? "spin 0.7s linear infinite" : "none",
              transform: refreshing ? "none" : `rotate(${ptrProgress * 270}deg)`,
              display: "block",
              filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))",
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
