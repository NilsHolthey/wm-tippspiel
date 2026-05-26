import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import s from "./Nav.module.css";

const LINKS = [
  { href: "/",          label: "Home" },
  { href: "/tipps",     label: "Tipps" },
  { href: "/gruppen",   label: "Gruppen" },
  { href: "/rangliste", label: "Rangliste" },
];

export default function Nav() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [router.pathname]);


  const initials = session?.user?.name
    ?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const links = session?.user?.isAdmin
    ? [...LINKS, { href: "/admin", label: "Admin" }]
    : LINKS;

  return (
    <>
      <nav className={s.nav}>
        <Link href="/" className={s.logo}>🏆 <span>WM</span> TIPP</Link>

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

        <button className={s.burger} onClick={() => setOpen(o => !o)} aria-label="Menü">
          <span className={`${s.bl}${open ? " " + s.blTop : ""}`} />
          <span className={`${s.bl}${open ? " " + s.blMid : ""}`} />
          <span className={`${s.bl}${open ? " " + s.blBot : ""}`} />
        </button>
      </nav>

      {open && (
        <>
          <div className={s.overlay} onClick={() => setOpen(false)} />
          <div className={s.drawer}>
            <div className={s.drawerUser}>
              <div className={s.avatar}>{initials}</div>
              <span className={s.drawerName}>{session?.user?.name}</span>
            </div>
            {links.map(({ href, label }) => (
              <button
                key={href}
                className={`${s.drawerLink}${router.pathname === href ? " " + s.drawerActive : ""}`}
                onClick={() => { setOpen(false); router.push(href); }}
              >
                {label}
              </button>
            ))}
            <button className={s.drawerLogout} onClick={() => signOut({ callbackUrl: "/login" })}>
              Abmelden
            </button>
          </div>
        </>
      )}
    </>
  );
}
