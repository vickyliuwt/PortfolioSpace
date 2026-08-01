"use client";

// GitHubCard.tsx
// repo stats

import { useEffect, useState } from "react";
import { FiStar, FiGitBranch, FiAlertCircle, FiExternalLink, FiGithub } from "react-icons/fi";

interface Repo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  html_url: string;
  pushed_at: string;
}

// parse url
function parseRepo(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return `${Math.round(d)}d ago`;
  if (d < 365) return `${Math.round(d / 30)}mo ago`;
  return `${Math.round(d / 365)}y ago`;
}

export default function GitHubCard({ repoUrl }: { repoUrl: string }) {
  const [repo, setRepo] = useState<Repo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const p = parseRepo(repoUrl);
    if (!p) {
      setFailed(true);
      return;
    }
    let alive = true;
    fetch(`https://api.github.com/repos/${p.owner}/${p.repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not ok"))))
      .then((data) => alive && setRepo(data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [repoUrl]);

  // stay quiet if it isn't github or the api is unreachable / rate-limited
  if (failed || !repo) return null;

  return (
    <div className="card" style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="spread" style={{ alignItems: "center" }}>
        <a href={repo.html_url} target="_blank" rel="noreferrer" className="row" style={{ gap: 8, fontWeight: 800, color: "var(--cocoa)", textDecoration: "none" }}>
          <FiGithub /> {repo.full_name} <FiExternalLink size={14} style={{ color: "var(--rose)" }} />
        </a>
        {repo.language && <span className="pill c-sky">{repo.language}</span>}
      </div>

      {repo.description && (
        <p className="muted" style={{ margin: 0, fontSize: "0.92rem" }}>
          {repo.description}
        </p>
      )}

      <div className="row" style={{ gap: 18, fontWeight: 700, color: "var(--cocoa-2)", fontSize: "0.9rem", flexWrap: "wrap" }}>
        <span className="row" style={{ gap: 5 }}>
          <FiStar style={{ color: "var(--sun-ink)" }} /> {repo.stargazers_count} stars
        </span>
        <span className="row" style={{ gap: 5 }}>
          <FiGitBranch /> {repo.forks_count} forks
        </span>
        <span className="row" style={{ gap: 5 }}>
          <FiAlertCircle /> {repo.open_issues_count} issues
        </span>
        <span className="muted" style={{ fontWeight: 600 }}>updated {timeAgo(repo.pushed_at)}</span>
      </div>

      {repo.topics && repo.topics.length > 0 && (
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {repo.topics.slice(0, 8).map((t) => (
            <span key={t} className="chip" style={{ padding: "5px 12px", fontSize: "0.76rem" }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
