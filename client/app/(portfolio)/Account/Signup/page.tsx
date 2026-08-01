"use client";

// Account/Signup/page.tsx

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup } from "../client";
import { useAppDispatch } from "../../../store/hooks";
import { setCurrentUser } from "../../../store/accountReducer";

export default function SignupPage() {
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "", headline: "", skills: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const set = (k: string, val: string) => setForm((f) => ({ ...f, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const user = await signup({
        displayName: form.displayName,
        username: form.username,
        email: form.email,
        password: form.password,
        headline: form.headline,
        skills: form.skills.split(",").map((x) => x.trim()).filter(Boolean),
      });
      dispatch(setCurrentUser(user));
      router.push("/Welcome");
    } catch (e2: unknown) {
      const data = (e2 as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      setErr(data?.errors?.join(" · ") || data?.message || "sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 460 }}>
      <div className="center" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 42 }}>🎨</div>
        <h1 className="section-title" style={{ fontSize: "2rem" }}>Join PortfolioSpace</h1>
        <p className="muted">One home for your work — show it, store it, share it.</p>
      </div>

      <form onSubmit={submit} className="card">
        {err && <div className="error-box" style={{ marginBottom: 12 }}>{err}</div>}
        <div className="field">
          <label>Display name</label>
          <input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Vicky Liu" />
        </div>
        <div className="field">
          <label>Username</label>
          <input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="vicky" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="min 6 chars" />
        </div>
        <div className="field">
          <label>Headline <span className="muted">(optional)</span></label>
          <input value={form.headline} onChange={(e) => set("headline", e.target.value)} placeholder="Animator · Full-stack engineer" />
        </div>
        <div className="field">
          <label>Skills <span className="muted">(optional, comma separated)</span></label>
          <input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="React, Node, Blender" />
        </div>
        <button className="btn btn-pink" disabled={busy} style={{ width: "100%" }}>
          {busy ? "creating…" : "Create my account"}
        </button>
      </form>

      <p className="center muted" style={{ marginTop: 16 }}>
        Already a member? <Link href="/Account/Signin">Sign in</Link>
      </p>
    </div>
  );
}
