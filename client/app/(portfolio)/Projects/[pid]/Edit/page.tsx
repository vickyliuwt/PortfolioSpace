"use client";

// Projects/[pid]/Edit/page.tsx

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import ProjectForm from "../../../../components/ProjectForm";
import PawLoader from "../../../../components/PawLoader";
import { getProject, updateProject, projectVersions, restoreVersion } from "../../client";
import type { ProjectVersion } from "../../client";
import type { Project } from "../../../../lib/types";

function Inner() {
  const router = useRouter();
  const params = useParams();
  const pid = String(params.pid);

  const [project, setProject] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<ProjectVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getProject(pid).then(setProject).catch(() => router.push("/Projects"));
    projectVersions(pid).then(setHistory).catch(() => {});
  }, [pid, router]);

  const submit = async (payload: Partial<Project>) => {
    setBusy(true);
    try {
      await updateProject(pid, payload);
      router.push(`/Projects/${pid}`);
    } catch {
      setBusy(false);
      alert("could not save, try again");
    }
  };

  if (!project) return <PawLoader />;

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 720 }}>
      <span className="eyebrow">✏️ edit</span>
      <h1 className="section-title">Edit project</h1>
      <p className="section-sub" style={{ marginBottom: 18 }}>Update details, cover or gallery.</p>
      <ProjectForm initial={project} submitLabel="Save changes" onSubmit={submit} busy={busy} />

      <div className="card" style={{ marginTop: 20 }}>
        <div className="spread" style={{ alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Edit history</h3>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
              {history.length === 0 ? "No earlier versions yet." : `${history.length} saved ${history.length === 1 ? "version" : "versions"}, newest first.`}
            </p>
          </div>
          {history.length > 0 && (
            <button type="button" className="btn btn-cream btn-sm" onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? "Hide" : "Show"}
            </button>
          )}
        </div>

        {showHistory && (
          <div className="stack" style={{ gap: 10, marginTop: 14 }}>
            {history.map((v, i) => (
              <div key={i} className="card card-tight">
                <div className="spread" style={{ alignItems: "center", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>{v.title || "untitled"}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {v.category}
                      {v.at ? " - " + new Date(v.at).toLocaleString() : ""}
                    </div>
                    {v.summary && (
                      <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>{v.summary}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-pink btn-sm"
                    onClick={async () => {
                      if (!confirm("Put this version back? Your current text gets saved to history first.")) return;
                      const back = await restoreVersion(pid, i).catch(() => null);
                      if (back) {
                        setProject(back);
                        projectVersions(pid).then(setHistory).catch(() => {});
                      }
                    }}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditProjectPage() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
