import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import s from "../styles/Login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Benutzername oder Passwort falsch.");
    } else {
      router.push("/tipps");
    }
  }

  return (
    <>
      <Head><title>Login – WM Tippspiel</title></Head>
      <div className={s.page}>
        <div className={s.card}>
          <div className={s.icon}>🏆</div>
          <div className={s.title}>WM TIPPSPIEL</div>
          <div className={s.sub}>Melde dich an, um zu tippen</div>

          <form onSubmit={handleSubmit}>
            <div className={s.field}>
              <label className={s.label}>Benutzername</label>
              <input
                className={s.input}
                type="text"
                placeholder="dein_name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Passwort</label>
              <input
                className={s.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className={s.error}>{error}</div>}
            <button className={s.btn} type="submit" disabled={loading}>
              {loading ? "Anmelden…" : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (session) return { redirect: { destination: "/tipps", permanent: false } };
  return { props: {} };
}
