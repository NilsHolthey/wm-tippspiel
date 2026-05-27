import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import BottomNav from "@/components/BottomNav";
import LoadingScreen from "@/components/LoadingScreen";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const hideTimer = useRef(null);

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

  return (
    <SessionProvider session={session}>
      {loading && <LoadingScreen />}
      <OfflineBanner />
      <Component {...pageProps} />
      <BottomNav />
    </SessionProvider>
  );
}
