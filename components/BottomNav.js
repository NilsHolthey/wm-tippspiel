import { useState, useRef } from "react";
import { useRouter } from "next/router";
import s from "./BottomNav.module.css";
import { haptic } from "../utils/haptic";

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const IconTipps = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconGruppen = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const IconRangliste = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6"/>
  </svg>
);

const ITEMS = [
  { href: "/",          Icon: IconHome,      label: "Home" },
  { href: "/tipps",     Icon: IconTipps,     label: "Tipps" },
  { href: "/gruppen",   Icon: IconGruppen,   label: "Gruppen" },
  { href: "/rangliste", Icon: IconRangliste, label: "Rangliste" },
];

export default function BottomNav() {
  const router = useRouter();
  const [preview, setPreview]   = useState(null);
  const dragRef                  = useRef(null);

  if (router.pathname === "/login") return null;

  function hrefFromTouch(touch) {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    return el?.closest("[data-href]")?.dataset?.href ?? null;
  }

  function handleTouchStart(e) {
    const href = hrefFromTouch(e.touches[0]);
    dragRef.current = href;
    setPreview(href);
  }

  function handleTouchMove(e) {
    const href = hrefFromTouch(e.touches[0]);
    if (href && href !== dragRef.current) {
      dragRef.current = href;
      setPreview(href);
      haptic(6);
    }
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    const href = dragRef.current;
    dragRef.current = null;
    setPreview(null);
    if (href) router.push(href);
  }

  return (
    <nav
      className={s.nav}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {ITEMS.map(({ href, Icon, label }) => {
        const isActive    = href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);
        const isPreviewing = preview === href;
        const active       = preview ? isPreviewing : isActive;
        return (
          <div
            key={href}
            data-href={href}
            className={`${s.item}${active ? " " + s.active : ""}${isPreviewing ? " " + s.previewing : ""}`}
          >
            <Icon />
            <span className={s.label}>{label}</span>
          </div>
        );
      })}
    </nav>
  );
}
