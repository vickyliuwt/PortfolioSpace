"use client";

// Projects/New/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import ProjectForm from "../../../components/ProjectForm";
import { createProject } from "../client";
import type { Project } from "../../../lib/types";

// pull status off an axios-ish error
function statusOf(e: unknown): number | undefined {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { status?: number } }).response;
    return r?.status;
  }
  return undefined;
}

function Inner() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const submit = async (payload: Partial<Project>) => {
    setBusy(true);
    try {
      const created = await createProject(payload);
      router.push(`/Projects/${created._id}`);
    } catch (e) {
      setBusy(false);
      // plan cap
      if (statusOf(e) === 402) {
        alert("this plan is full. switch to Pro on your profile for more room.");
        router.push("/Account/Profile");
        return;
      }
      alert("could not save, try again");
    }
  };

  return (
    <div className="wrap section page-enter" style={{ maxWidth: 720 }}>
      <span className="eyebrow">✨ new</span>
      <h1 className="section-title">New project</h1>
      <p className="section-sub" style={{ marginBottom: 18 }}>Add your work. You can edit anything later.</p>
      <ProjectForm submitLabel="Publish project" onSubmit={submit} busy={busy} />
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  );
}
