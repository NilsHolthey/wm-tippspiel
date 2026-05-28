import { useState, useEffect } from "react";
import { IconWarning } from "./Icons";
import s from "../styles/OfflineBanner.module.css";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className={s.banner}>
      <IconWarning size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
      Kein Internet — Tipps können nicht gespeichert werden
    </div>
  );
}
