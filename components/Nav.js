import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import s from "./Nav.module.css";

const LINKS = [
  { href: "/",          label: "Home" },
  { href: "/tipps",     label: "Tipps" },
  { href: "/rangliste", label: "Rangliste" },
];

export default function Nav() {
  const router = useRouter();
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const links = session?.user?.isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin" }]
    : LINKS;

  return (
    <nav className={s.nav}>
      <div className={s.logo}>🏆 <span>WM</span> TIPP</div>
      <div className={s.links}>
        {links.map(({ href, label }) => (
          <button
            key={href}
            className={`${s.link}${router.pathname === href ? " " + s.active : ""}`}
            onClick={() => router.push(href)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={s.right}>
        <div className={s.avatar}>{initials}</div>
        <span className={s.name}>{session?.user?.name}</span>
        <button className={s.link} onClick={() => signOut({ callbackUrl: "/login" })}>
          Abmelden
        </button>
      </div>
    </nav>
  );
}
