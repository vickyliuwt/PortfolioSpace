"use client";

// Account/Signin/page.tsx

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signin } from "../client";
import { useAppDispatch } from "../../../store/hooks";
import { setCurrentUser } from "../../../store/accountReducer";

export default function SigninPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const user = await signin(username, password);
      dispatch(setCurrentUser(user));
      router.push("/Projects");
    } catch (e2: unknown) {
      setErr((e2 as { response?: { data?: { message?: string } } })?.response?.data?.message || "sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 460 }}>
      <div className="center" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 42 }}>🐾</div>
        <h1 className="section-title" style={{ fontSize: "2rem" }}>Welcome back</h1>
        <p className="muted">Sign in to manage your work.</p>
      </div>

      <form onSubmit={submit} className="card">
        {err && <div className="error-box" style={{ marginBottom: 12 }}>{err}</div>}
        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="vicky" autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
        </div>
        <button className="btn btn-pink" disabled={busy} style={{ width: "100%" }}>
          {busy ? "signing in…" : "Sign in"}
        </button>

        <div className="notice-box" style={{ marginTop: 14, fontSize: "0.82rem" }}>
          Try the demo: <b>vicky</b> / <b>paw12345</b>
        </div>
      </form>

      <p className="center muted" style={{ marginTop: 16 }}>
        New here? <Link href="/Account/Signup">Make an account</Link>
      </p>
    </div>
  );
}
