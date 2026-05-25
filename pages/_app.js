import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import OfflineBanner from "@/components/OfflineBanner";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <OfflineBanner />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
