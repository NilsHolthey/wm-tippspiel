import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import BottomNav from "@/components/BottomNav";

const PTR_SHOW      = 110;  // px before indicator appears
const PTR_THRESHOLD = 220;  // px to trigger refresh

function usePullToRefresh(onRefresh) {
  const [pullY, setPullY] = useState(0);
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
        setPullY(dy);
      }
    };
    const onEnd = async () => {
      if (startY.current === null) return;
      const dist = pullDist.current;
      startY.current = null;
      pullDist.current = 0;
      setPullY(0);
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
  }, [onRefresh]);

  return { pullY, refreshing };
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const hideTimer = useRef(null);

  const { pullY, refreshing } = usePullToRefresh(() => router.reload());

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
  const pullOffset = refreshing ? 0 : Math.min(pullY * 0.4, 100);
  const isReleased = pullY === 0 && !refreshing;
  const progress   = Math.min((pullY - PTR_SHOW) / (PTR_THRESHOLD - PTR_SHOW), 1);

  return (
    <SessionProvider session={session}>
      {/* Indicator sits outside the pull wrapper so it stays viewport-fixed */}
      {(pullY >= PTR_SHOW || refreshing) && showChrome && (
        <div style={{
          position: "fixed",
          top: "calc(env(safe-area-inset-top, 44px) + 12px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 500,
          pointerEvents: "none",
          background: "rgba(6, 10, 27, 0.75)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderRadius: "50%",
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(201,168,76,0.2)",
        }}>
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="#ceac4d" strokeWidth="2.2" strokeLinecap="round"
            style={{
              display: "block",
              filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))",
              animation: refreshing ? "spin 0.7s linear infinite" : "none",
              transform: refreshing ? "none" : `rotate(${Math.max(progress, 0) * 270}deg)`,
            }}
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </div>
      )}

      {/* Everything else pulls with the page */}
      <div style={{
        transform: `translateY(${pullOffset}px)`,
        transition: isReleased ? "transform 0.3s ease" : "none",
        willChange: pullY > 0 ? "transform" : "auto",
      }}>
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
      </div>
    </SessionProvider>
  );
}
