"use client";

// Account/Profile/page.tsx
// edit profile

import { useState } from "react";
import Link from "next/link";
import { FiStar, FiBell, FiBarChart2, FiPlus, FiX, FiExternalLink, FiLink2, FiCheck, FiEye } from "react-icons/fi";
import ProtectedRoute from "../../../components/ProtectedRoute";
import UploadWidget from "../../../components/UploadWidget";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setCurrentUser } from "../../../store/accountReducer";
import { updateProfile, setAvatar, setPlan, changePassword } from "../client";
import type { NotifyPrefs, Experience, Education } from "../../../lib/types";
import { onAvatarError } from "../../../lib/img";

const PREF_ROWS: [keyof NotifyPrefs, string][] = [
  ["like", "Likes on my work"],
  ["comment", "Comments & replies"],
  ["save", "Saves / bookmarks"],
  ["follow", "New followers"],
  ["mention", "@mentions"],
  ["message", "Direct messages"],
  ["collab", "Credits on shared work"],
];

function ProfileInner() {
  const user = useAppSelector((s) => s.account.currentUser)!;
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    displayName: user.displayName,
    headline: user.headline,
    bio: user.bio,
    location: user.location,
    website: user.website,
    skills: (user.skills || []).join(", "),
    github: user.socials?.github || "",
    linkedin: user.socials?.linkedin || "",
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [openToWork, setOpenToWork] = useState(!!user.openToWork);
  const [copied, setCopied] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(!!user.privateAccount);
  const [experience, setExperience] = useState<Experience[]>(user.experience?.length ? user.experience : []);
  const [education, setEducation] = useState<Education[]>(user.education?.length ? user.education : []);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const [prefs, setPrefs] = useState<NotifyPrefs>({
    like: user.notifyPrefs?.like ?? true,
    comment: user.notifyPrefs?.comment ?? true,
    save: user.notifyPrefs?.save ?? true,
    follow: user.notifyPrefs?.follow ?? true,
    mention: user.notifyPrefs?.mention ?? true,
    message: user.notifyPrefs?.message ?? true,
    collab: user.notifyPrefs?.collab ?? true,
  });
  const [prefMsg, setPrefMsg] = useState("");
  const [prefBusy, setPrefBusy] = useState(false);

  const savePrefs = async () => {
    setPrefBusy(true);
    setPrefMsg("");
    try {
      const updated = await updateProfile({ notifyPrefs: prefs });
      dispatch(setCurrentUser(updated));
      setPrefMsg("saved ✓");
    } catch {
      setPrefMsg("could not save");
    } finally {
      setPrefBusy(false);
    }
  };

  const copyProfile = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/Creators/${user.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked
    }
  };

  const set = (k: string, val: string) => setForm((f) => ({ ...f, [k]: val }));

  const setExp = (i: number, k: keyof Experience, v: string) => setExperience((old) => old.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const addExp = () => setExperience((old) => [...old, { role: "", company: "", period: "", description: "" }]);
  const rmExp = (i: number) => setExperience((old) => old.filter((_, j) => j !== i));
  const setEdu = (i: number, k: keyof Education, v: string) => setEducation((old) => old.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const addEdu = () => setEducation((old) => [...old, { school: "", degree: "", period: "" }]);
  const rmEdu = (i: number) => setEducation((old) => old.filter((_, j) => j !== i));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const updated = await updateProfile({
        displayName: form.displayName,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        website: form.website,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        socials: { github: form.github, linkedin: form.linkedin, dribbble: "", instagram: "" },
        openToWork,
        privateAccount,
        experience: experience.filter((x) => x.role || x.company || x.description),
        education: education.filter((x) => x.school || x.degree),
      });
      dispatch(setCurrentUser(updated));
      setMsg("saved!");
    } catch {
      setMsg("could not save, try again");
    } finally {
      setBusy(false);
    }
  };

  const changePlan = async (plan: "FREE" | "PRO") => {
    const updated = await setPlan(plan);
    dispatch(setCurrentUser(updated));
  };

  const doChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      setPwMsg("new passwords do not match");
      return;
    }
    if (pw.next.length < 6) {
      setPwMsg("new password min 6 chars");
      return;
    }
    setPwBusy(true);
    setPwMsg("");
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg("password updated ✓");
    } catch (e2: unknown) {
      setPwMsg((e2 as { response?: { data?: { message?: string } } })?.response?.data?.message || "could not update password");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 720 }}>
      <div className="spread" style={{ marginBottom: 18, alignItems: "flex-end" }}>
        <div>
          <span className="eyebrow">🐾 you</span>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Your profile</h1>
        </div>
        <Link href={`/Creators/${user.username}`} className="btn btn-cream btn-sm">
          View public page
        </Link>
      </div>

      {/* avatar + plan */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="spread">
          <div className="row">
            <img className="avatar"
              src={user.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError}
              alt="avatar"
              width={72}
              height={72}
              style={{ borderRadius: "50%", border: "3px solid var(--blush-soft)" }}
            />
            <div>
              <div style={{ fontWeight: 800, fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>
                {user.displayName}{" "}
                {user.plan === "PRO" && <span className="pill pill-pro">pro</span>}
              </div>
              <div className="muted">@{user.username}</div>
            </div>
          </div>
          <UploadWidget
            label="Change avatar"
            accept="image/*"
            onUploaded={async (m) => {
              const updated = await setAvatar(m.key, m.url);
              dispatch(setCurrentUser(updated));
            }}
          />
        </div>
      </div>

      {/* plan */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="spread">
          <div>
            <h3 style={{ margin: 0 }}>
              <FiStar style={{ verticalAlign: "-2px", color: "var(--orange)" }} /> Plan
            </h3>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              Pro adds bigger uploads and a badge on your profile. Everything else works on both.
            </p>
          </div>
          <div className="row">
            <button className={`btn btn-sm ${user.plan === "FREE" ? "btn-primary" : "btn-ghost"}`} onClick={() => changePlan("FREE")}>
              Basic
            </button>
            <button className={`btn btn-sm ${user.plan === "PRO" ? "btn-primary" : "btn-ghost"}`} onClick={() => changePlan("PRO")}>
              Pro
            </button>
          </div>
        </div>
      </div>

      {/* how others see me */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="spread" style={{ alignItems: "center", gap: 14 }}>
          <div className="person-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="avatar avatar-lg"
              src={user.avatarUrl || "/mascot/avatar-default.svg"} onError={onAvatarError}
              alt={user.displayName}
              style={{ border: "3px solid " + (openToWork ? "#3fae6a" : "var(--pink)") }}
            />
            <div>
              <div className="person-name" style={{ fontSize: "1.05rem" }}>{user.displayName}</div>
              <div className="person-sub">@{user.username}</div>
              <div className="person-sub">{user.headline}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link href={`/Creators/${user.username}`} className="btn btn-pink btn-sm">
              <FiEye /> Show profile
            </Link>
            <Link href={`/Creators/${user.username}`} target="_blank" className="btn btn-cream btn-sm" aria-label="Open in a new tab">
              <FiExternalLink />
            </Link>
            <button type="button" className="btn btn-cream btn-sm" onClick={copyProfile}>
              {copied ? <FiCheck /> : <FiLink2 />} {copied ? "copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>

      {/* edit form */}
      <form onSubmit={save} className="card">
        {msg && <div className="notice-box" style={{ marginBottom: 12 }}>{msg}</div>}
        <div className="row" style={{ gap: 14 }}>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>Display name</label>
            <input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>Headline</label>
            <input value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={600} />
        </div>
        <div className="row" style={{ gap: 14 }}>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>Location</label>
            <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Boston, MA" />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>Website</label>
            <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div className="field">
          <label>Skills (comma separated)</label>
          <input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Animation, React, Figma" />
        </div>
        <div className="row" style={{ gap: 14 }}>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>GitHub</label>
            <input value={form.github} onChange={(e) => set("github", e.target.value)} placeholder="https://github.com/…" />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>LinkedIn</label>
            <input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
        </div>

        <div className="field">
          <label>Availability</label>
          <div className="spread" style={{ alignItems: "center", border: "1.5px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "10px 14px" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--cocoa)" }}>Open to work</div>
              <div className="muted" style={{ fontSize: "0.82rem" }}>Shows a green badge on your profile.</div>
            </div>
            <span
              role="switch"
              aria-checked={openToWork}
              tabIndex={0}
              onClick={() => setOpenToWork((v) => !v)}
              style={{ width: 44, height: 26, borderRadius: 999, cursor: "pointer", flexShrink: 0, background: openToWork ? "#3fae6a" : "var(--line)", position: "relative", transition: "background 0.2s" }}
            >
              <span style={{ position: "absolute", top: 2, left: openToWork ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
            </span>
          </div>
        </div>

        <div className="field">
          <label>Who can see me</label>
          <div className="spread" style={{ alignItems: "center", border: "1.5px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "10px 14px" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--cocoa)" }}>Private account</div>
              <div className="muted" style={{ fontSize: "0.82rem" }}>Only followers can open your profile and work.</div>
            </div>
            <span
              role="switch"
              aria-checked={privateAccount}
              tabIndex={0}
              onClick={() => setPrivateAccount((v) => !v)}
              style={{ width: 44, height: 26, borderRadius: 999, cursor: "pointer", flexShrink: 0, background: privateAccount ? "var(--rose)" : "var(--line)", position: "relative", transition: "background 0.2s" }}
            >
              <span style={{ position: "absolute", top: 2, left: privateAccount ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
            </span>
          </div>
        </div>

        <div className="field">
          <div className="spread" style={{ alignItems: "center" }}>
            <label style={{ margin: 0 }}>Experience</label>
            <button type="button" className="btn btn-cream btn-sm" onClick={addExp}>
              <FiPlus /> Add
            </button>
          </div>
          <div className="stack" style={{ gap: 12, marginTop: 8 }}>
            {experience.map((x, i) => (
              <div key={i} className="card card-tight" style={{ position: "relative" }}>
                <button type="button" onClick={() => rmExp(i)} aria-label="Remove" style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: "var(--cocoa-2)" }}>
                  <FiX />
                </button>
                <div className="row" style={{ gap: 10 }}>
                  <input placeholder="Role" value={x.role} onChange={(e) => setExp(i, "role", e.target.value)} style={{ flex: 1, minWidth: 130 }} />
                  <input placeholder="Company" value={x.company} onChange={(e) => setExp(i, "company", e.target.value)} style={{ flex: 1, minWidth: 130 }} />
                </div>
                <input placeholder="Period (e.g. 2023 – now)" value={x.period} onChange={(e) => setExp(i, "period", e.target.value)} style={{ marginTop: 8 }} />
                <textarea placeholder="What you did…" value={x.description} onChange={(e) => setExp(i, "description", e.target.value)} style={{ marginTop: 8 }} />
              </div>
            ))}
            {experience.length === 0 && <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>No experience added yet.</p>}
          </div>
        </div>

        <div className="field">
          <div className="spread" style={{ alignItems: "center" }}>
            <label style={{ margin: 0 }}>Education</label>
            <button type="button" className="btn btn-cream btn-sm" onClick={addEdu}>
              <FiPlus /> Add
            </button>
          </div>
          <div className="stack" style={{ gap: 12, marginTop: 8 }}>
            {education.map((x, i) => (
              <div key={i} className="card card-tight" style={{ position: "relative" }}>
                <button type="button" onClick={() => rmEdu(i)} aria-label="Remove" style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: "var(--cocoa-2)" }}>
                  <FiX />
                </button>
                <input placeholder="School" value={x.school} onChange={(e) => setEdu(i, "school", e.target.value)} />
                <div className="row" style={{ gap: 10, marginTop: 8 }}>
                  <input placeholder="Degree" value={x.degree} onChange={(e) => setEdu(i, "degree", e.target.value)} style={{ flex: 1, minWidth: 130 }} />
                  <input placeholder="Period" value={x.period} onChange={(e) => setEdu(i, "period", e.target.value)} style={{ flex: 1, minWidth: 110 }} />
                </div>
              </div>
            ))}
            {education.length === 0 && <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>No education added yet.</p>}
          </div>
        </div>

        <button className="btn btn-primary" disabled={busy} style={{ marginTop: 4 }}>
          {busy ? "saving…" : "Save changes"}
        </button>
      </form>

      {/* change password */}
      <form onSubmit={doChangePassword} className="card" style={{ marginTop: 18 }}>
        <h3 style={{ margin: "0 0 4px" }}>🔒 Password</h3>
        <p className="muted" style={{ margin: "0 0 8px" }}>Update the password you use to sign in.</p>
        {pwMsg && <div className="notice-box" style={{ marginBottom: 12 }}>{pwMsg}</div>}
        <div className="field">
          <label>Current password</label>
          <input type="password" value={pw.current} onChange={(e) => setPw((o) => ({ ...o, current: e.target.value }))} />
        </div>
        <div className="row" style={{ gap: 14 }}>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>New password</label>
            <input type="password" value={pw.next} onChange={(e) => setPw((o) => ({ ...o, next: e.target.value }))} />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 180 }}>
            <label>Confirm new password</label>
            <input type="password" value={pw.confirm} onChange={(e) => setPw((o) => ({ ...o, confirm: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary" disabled={pwBusy} style={{ marginTop: 4 }}>
          {pwBusy ? "updating…" : "Update password"}
        </button>
      </form>

      {/* notification preferences */}
      <div className="card" style={{ marginTop: 18 }}>
        <h3 style={{ margin: "0 0 4px" }}>
          <FiBell style={{ verticalAlign: "-2px" }} /> Notifications
        </h3>
        <p className="muted" style={{ margin: "0 0 10px" }}>Pick what you want to hear about.</p>
        {prefMsg && <div className="notice-box" style={{ marginBottom: 12 }}>{prefMsg}</div>}
        <div className="stack" style={{ gap: 0 }}>
          {PREF_ROWS.map(([key, label]) => (
            <div key={key} className="spread" style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "var(--cocoa)" }}>{label}</span>
              <span
                role="switch"
                aria-checked={prefs[key]}
                tabIndex={0}
                onClick={() => setPrefs((o) => ({ ...o, [key]: !o[key] }))}
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  cursor: "pointer",
                  flexShrink: 0,
                  background: prefs[key] ? "var(--rose)" : "var(--line)",
                  border: "1px solid " + (prefs[key] ? "var(--rose)" : "var(--line)"),
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: prefs[key] ? 20 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.2s",
                  }}
                />
              </span>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" disabled={prefBusy} style={{ marginTop: 14 }} onClick={savePrefs}>
          {prefBusy ? "saving…" : "Save preferences"}
        </button>
      </div>

      {/* analytics link */}
      <Link href="/Analytics" className="card card-hover" style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center", textDecoration: "none", color: "inherit" }}>
        <span style={{ fontSize: 28 }}>📊</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: "var(--cocoa)" }}>
            <FiBarChart2 style={{ verticalAlign: "-2px" }} /> Creator analytics
          </div>
          <div className="muted" style={{ fontSize: "0.88rem" }}>See views, likes and how your work is doing.</div>
        </div>
        <span style={{ color: "var(--rose)", fontWeight: 800 }}>→</span>
      </Link>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileInner />
    </ProtectedRoute>
  );
}
