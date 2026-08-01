# PortfolioSpace — Architecture

A creative-portfolio app for both artists and engineers. The system is split into small services behind a gateway so each concern (auth, portfolio data, media) can scale and deploy on its own.

## Services

| Service | Port | Responsibility |
| --- | --- | --- |
| **gateway** | 4000 | Single entry point. Reverse-proxies `/api/<service>/*` to the right service, forwards the session cookie, adds a request id. |
| **auth-service** | 4001 | Accounts, sign in / out, sessions, profiles, follows, notifications, direct messages. |
| **portfolio-service** | 4002 | Projects, comments (+ reactions), collections ("boards"), saves, reports/moderation, analytics snapshots. |
| **media-service** | 4003 | Presigned upload / download URLs against MinIO (S3-compatible), so files stream straight from object storage. |
| **search-service** | 4004 | Elasticsearch indexes for public work and direct messages, with a MongoDB fallback when the engine is off. |

The web client (`client/`) is a Next.js 16 app (React 19, TypeScript, Turbopack). It only ever talks to the **gateway** through `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`), with cookies enabled.

## Shared infrastructure

- **MongoDB** — one database (`portfoliospace`). Every document uses a string UUID `_id`. Collections: `users`, `projects`, `comments`, `collections`, `saves`, `follows`, `notifications`, `messages`, `reports`, `dailystats`.
- **Redis** — express-session store (so any service can read the same logged-in session) and a short cache-aside layer in front of the public discover/featured queries.
- **MinIO** — S3-compatible object storage for covers, reels, and gallery media, accessed only through presigned URLs.
- **Elasticsearch** — optional search engine (own Docker profile). Indexes `ps-projects` and `ps-messages`; the service talks to it over plain HTTP, no client library.

## Request flow

```
browser ──cookie or Bearer token──▶ gateway :4000
                     │  strips /api/<service>
                     ├─▶ auth-service :4001      (users, follows, notifications, messages)
                     ├─▶ portfolio-service :4002 (projects, comments, collections, reports, analytics)
                     ├─▶ media-service :4003     (presigned upload/download)
                     └─▶ search-service :4004    (elasticsearch work + chat search)
```

Because comments, collections, saves, and reports all live inside the portfolio-service, they ride the same `/api/projects` proxy (e.g. the client calls `/projects/comments/...` and the gateway rewrites it to `/comments/...` inside portfolio-service). This keeps the gateway config small while still separating the code by feature.

## Auth

Two ways in, one shape downstream. The browser signs in and gets a Redis-backed cookie session. API
clients can use a JWT instead: sign in (or call `POST /api/auth/token`) and send
`Authorization: Bearer <token>`. A small middleware verifies the HS256 token and attaches the user to
`req.session.currentUser` as a hidden property, so nothing is written back to Redis and every existing
route works with either method.

## Data-model highlights

- **projects** — `visibility` (`PUBLIC` / `FRIENDS` / `PRIVATE`), `status` (`PUBLISHED` / `DRAFT`), a `collaborators[]` credit list that grants edit rights without ownership, plus dev-portfolio fields: `repoUrl`, `demoUrl`, `role`, `highlights[]`, `year`, `tools[]` (tech stack).
- **comments** — a `parent` pointer makes threads *arbitrarily deep* (a reply can reply to a reply), and a `reactions[]` array of `{ emoji, user }` powers multi-emoji reactions.
- **collections** — user-made "boards" that group projects, Pinterest-style.
- **reports** — `{ targetType, targetId, reason, status }` feeding an admin-only moderation queue (`role === "ADMIN"`).
- **dailystats** — one row per `(owner, day)` counting views + likes, so analytics can draw a real day-by-day trend line instead of a single total.

## Influences

**Pinterest** — the discover / home / profile feeds use a true masonry layout (CSS multi-column, natural-height covers), and collections act like boards you pin work into.

**GitHub** — engineering projects surface a live repo card (stars / forks / issues / language / topics) fetched from the public GitHub API in the browser, alongside repo + live-demo links and developer categories (Web App, Backend/API, Machine Learning, DevTool, …).

## Where it goes next

The search-service was the first piece pulled out of portfolio-service. The same pattern applies to
whatever comes next — a **moderation-service** that owns `reports` and auto-flagging is the obvious
follow-up:

Either would register with the gateway exactly like the existing services (`/api/moderation/*`, `/api/search/*`), read the shared session from Redis, and talk to the same MongoDB. Splitting it out is best done as its own focused change so the new port, container, gateway route, and session wiring can be run and tested end-to-end.
