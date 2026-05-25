import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import "@/styles/globals.css";
import OfflineBanner from "@/components/OfflineBanner";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <OfflineBanner />
      <Component {...pageProps} />
    </SessionProvider>
  );
}
