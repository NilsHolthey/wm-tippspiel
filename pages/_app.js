import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import Nav from "@/components/Nav";
import OfflineBanner from "@/components/OfflineBanner";
import BottomNav from "@/components/BottomNav";

const PTR_SHOW      = 110;  // px before indicator appears
const PTR_THRESHOLD = 220;  // px to trigger refresh

function usePullToRefresh(onRefresh) {
  const [pullY, setPullY]         = useState(0);
  const [renderOffset, setRenderOffset] = useState(0);
  const [pullPhase, setPullPhase] = useState("idle"); // "idle" | "pulling" | "releasing"
  const [refreshing, setRefreshing] = useState(false);
  const startY    = useRef(null);
  const pullDist  = useRef(0);
  const phaseRef  = useRef("idle");

  useEffect(() => {
    const onStart = (e) => {
      if (window.scrollY > 2) return;
      if (document.documentElement.style.overflow === "hidden") return;
      startY.current   = e.touches[0].clientY;
      pullDist.current = 0;
    };

    const onMove = (e) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        e.preventDefault();
        pullDist.current = dy;
        const offset = Math.min(dy * 0.4, 100);
        setPullY(dy);
        setRenderOffset(offset);
        if (phaseRef.current !== "pulling") {
          phaseRef.current = "pulling";
          setPullPhase("pulling");
        }
      }
    };

    const onEnd = async () => {
      if (startY.current === null) return;
      const dist = pullDist.current;
      startY.current   = null;
      pullDist.current = 0;
      setPullY(0);

      if (dist >= PTR_THRESHOLD) {
        // Trigger refresh — snap content back immediately, stay in pulling phase while spinning
        phaseRef.current = "idle";
        setPullPhase("idle");
        setRenderOffset(0);
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      } else if (dist > 0) {
        // Spring back: transition renderOffset → 0, then go idle
        phaseRef.current = "releasing";
        setPullPhase("releasing");
        requestAnimationFrame(() => requestAnimationFrame(() => setRenderOffset(0)));
        setTimeout(() => {
          phaseRef.current = "idle";
          setPullPhase("idle");
        }, 320);
      } else {
        phaseRef.current = "idle";
        setPullPhase("idle");
        setRenderOffset(0);
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

  return { pullY, renderOffset, pullPhase, refreshing };
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  const refresh = useCallback(() => router.reload(), [router]);
  const { pullY, renderOffset, pullPhase, refreshing } = usePullToRefresh(refresh);

  const showChrome = router.pathname !== "/login";
  const progress   = Math.min((pullY - PTR_SHOW) / (PTR_THRESHOLD - PTR_SHOW), 1);

  // transform: none when idle so position:fixed inside uses the viewport (not the div)
  // as its containing block — fixes Nav/modal z-index and viewport-anchoring.
  const contentTransform = pullPhase === "idle"
    ? "none"
    : `translateY(${renderOffset}px)`;
  const contentTransition = pullPhase === "releasing"
    ? "transform 0.3s ease"
    : "none";

  return (
    <SessionProvider session={session}>
      {/* ── PTR indicator — truly viewport-fixed, above everything ─────────── */}
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

      {/* ── Chrome — all outside transform, always truly viewport-fixed ─────── */}
      {showChrome && <Nav />}
      <OfflineBanner />
      <BottomNav />

      {/* Top gradient: z-index 190 < Nav 200 → content fades under Nav */}
      {showChrome && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: "80px",
          background: "linear-gradient(to bottom, #060A1B 0%, transparent 100%)",
          zIndex: 190, pointerEvents: "none",
        }} />
      )}
      {/* Bottom gradient: z-index 190 < BottomNav 200 → content fades above BottomNav */}
      {showChrome && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: "110px",
          background: "linear-gradient(to top, #060A1B 0%, transparent 100%)",
          zIndex: 190, pointerEvents: "none",
        }} />
      )}

      {/* ── Page content — only this moves on PTR pull ──────────────────────── */}
      <div style={{
        transform: contentTransform,
        transition: contentTransition,
        willChange: pullPhase !== "idle" ? "transform" : "auto",
      }}>
        <Component {...pageProps} />
      </div>
    </SessionProvider>
  );
}
