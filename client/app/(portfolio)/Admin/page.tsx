"use client";

// Admin/page.tsx
// moderation

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiShield, FiTrash2, FiCheck, FiX, FiFlag } from "react-icons/fi";
import ProtectedRoute from "../../components/ProtectedRoute";
import PawLoader from "../../components/PawLoader";
import { useAppSelector } from "../../store/hooks";
import { listReports, setReportStatus, removeReportTarget } from "../Projects/client";
import type { Report } from "../Projects/client";

type Tab = "OPEN" | "RESOLVED" | "DISMISSED";
const TABS: Tab[] = ["OPEN", "RESOLVED", "DISMISSED"];

function AdminInner() {
  const me = useAppSelector((s) => s.account.currentUser)!;
  const router = useRouter();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [tab, setTab] = useState<Tab>("OPEN");

  // non-admins get bounced home
  useEffect(() => {
    if (me.role !== "ADMIN") router.replace("/");
  }, [me.role, router]);

  const load = useCallback((status: Tab) => {
    setReports(null);
    listReports(status)
      .then(setReports)
      .catch(() => setReports([]));
  }, []);

  useEffect(() => {
    if (me.role === "ADMIN") load(tab);
  }, [tab, me.role, load]);

  if (me.role !== "ADMIN") return null;

  const act = async (r: Report, status: Tab) => {
    await setReportStatus(r._id, status);
    load(tab);
  };

  const purge = async (r: Report) => {
    if (!confirm(`Delete the reported ${r.targetType}? This can't be undone.`)) return;
    await removeReportTarget(r._id, r.targetType, r.targetId);
    load(tab);
  };

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 820 }}>
      <div style={{ marginBottom: 18 }}>
        <span className="eyebrow">
          <FiShield /> moderation
        </span>
        <h1 className="section-title">Admin</h1>
        <p className="section-sub">Review flagged projects and comments.</p>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t} className={"chip" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>
            {t === "OPEN" ? "Open" : t === "RESOLVED" ? "Resolved" : "Dismissed"}
          </button>
        ))}
      </div>

      {reports === null ? (
        <PawLoader />
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 38, marginBottom: 6 }}>🎉</div>
          <p className="muted" style={{ margin: 0 }}>Nothing here — the queue is clear.</p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {reports.map((r) => (
            <div key={r._id} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="spread" style={{ alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span className="row" style={{ gap: 8, fontWeight: 800 }}>
                  <FiFlag style={{ color: "var(--rose)" }} />
                  {r.targetType === "project" ? "Project" : "Comment"}
                  {r.targetType === "project" ? (
                    <Link href={`/Projects/${r.targetId}`} className="btn btn-cream btn-sm">
                      Open
                    </Link>
                  ) : (
                    <span className="muted" style={{ fontWeight: 600, fontSize: "0.82rem" }}>#{r.targetId.slice(0, 8)}</span>
                  )}
                </span>
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  by {r.reporterName || "someone"}
                  {r.createdAt ? " · " + new Date(r.createdAt).toLocaleDateString() : ""}
                </span>
              </div>

              <p style={{ margin: 0 }}>
                {r.reason ? r.reason : <span className="muted">No reason given.</span>}
              </p>

              {r.status !== "OPEN" && (
                <span className="pill" style={{ alignSelf: "flex-start", background: "var(--cream-2)", color: "var(--cocoa-2)" }}>
                  {r.status.toLowerCase()}
                </span>
              )}

              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                {r.status !== "RESOLVED" && (
                  <button className="btn btn-cream btn-sm" onClick={() => act(r, "RESOLVED")}>
                    <FiCheck /> Resolve
                  </button>
                )}
                {r.status !== "DISMISSED" && (
                  <button className="btn btn-cream btn-sm" onClick={() => act(r, "DISMISSED")}>
                    <FiX /> Dismiss
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => purge(r)}>
                  <FiTrash2 /> Delete {r.targetType}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminInner />
    </ProtectedRoute>
  );
}
