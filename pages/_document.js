import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="de" style={{ overflowX: "hidden", width: "100%" }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icons/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C9A84C" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tippspiel" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
        {/* iOS splash screens — generic fallback first, then per-device overrides */}
        <link rel="apple-touch-startup-image" href="/icons/splash.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)" href="/icons/splash/splash-640x1136.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)" href="/icons/splash/splash-750x1334.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:414px) and (device-height:736px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1242x2208.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)" href="/icons/splash/splash-828x1792.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1242x2688.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:428px) and (device-height:926px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1284x2778.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:393px) and (device-height:852px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:402px) and (device-height:874px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1206x2622.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:430px) and (device-height:932px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:440px) and (device-height:956px) and (-webkit-device-pixel-ratio:3) and (orientation:portrait)" href="/icons/splash/splash-1320x2868.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:744px) and (device-height:1133px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)" href="/icons/splash/splash-1488x2266.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:768px) and (device-height:1024px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)" href="/icons/splash/splash-1536x2048.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width:1024px) and (device-height:1366px) and (-webkit-device-pixel-ratio:2) and (orientation:portrait)" href="/icons/splash/splash-2048x2732.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
