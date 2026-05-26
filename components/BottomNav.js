import Link from "next/link";
import { useRouter } from "next/router";
import s from "./BottomNav.module.css";

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
  if (router.pathname === "/login") return null;

  return (
    <nav className={s.nav}>
      {ITEMS.map(({ href, Icon, label }) => {
        const active = href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`${s.item}${active ? " " + s.active : ""}`}>
            <Icon />
            <span className={s.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
