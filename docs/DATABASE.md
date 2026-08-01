# PortfolioSpace — Database Guide

All services share **one MongoDB database** (default `portfoliospace`, set by `MONGO_URI`).
Sharing a database keeps cross-service reads simple — for example, both the auth and
portfolio services write into the same `notifications` collection, and messaging looks
up user cards straight from `users`.

Every document uses a **string `_id`** (a UUID we generate) instead of an ObjectId, so ids
are stable and easy to pass around between services and the client.

Open the database in DBeaver or Mongo Express (`http://localhost:8081` when infra is up).

---

## Collections at a glance

| Collection      | Owned by            | What it stores                                    |
| --------------- | ------------------- | ------------------------------------------------- |
| `users`         | auth-service        | accounts, profile, plan (FREE/PRO)                |
| `projects`      | portfolio-service   | portfolio pieces (art + engineering)              |
| `comments`      | portfolio-service   | feedback + threaded replies on projects           |
| `saves`         | portfolio-service   | bookmarks (user ↔ project)                         |
| `collections`   | portfolio-service   | named sets of projects (public/private)           |
| `follows`       | auth-service        | follower ↔ following edges                         |
| `notifications` | auth **+** portfolio| likes / comments / saves / follows / mentions / DMs |
| `messages`      | auth-service        | direct messages between two users                 |

---

## users
Account + public profile.

Key fields: `username` (unique), `email` (unique), `password` (bcrypt hash),
`displayName`, `headline`, `bio`, `avatarUrl`, `website`, `socials{github,linkedin}`,
`skills[]`, `plan` ("FREE" | "PRO"), `lastLogin`,
`notifyPrefs{like,comment,save,follow,mention,message}` (per-type toggles, all on by default),
timestamps.

Indexes: unique `username`, unique `email`, `skills`, text index on
`displayName + headline + bio` (creator search).

## projects
One portfolio piece.

Key fields: `owner` (users._id), `ownerUsername`, `ownerName`, `title`, `summary`,
`description`, `kind` ("art" | "code" | "film" | "photo" | "music" | "writing" | "daily" | "other"),
`category`, `tags[]`, `tools[]`, `coverUrl`, `media[]{key,url,type,caption,order}`,
`repoUrl`, `demoUrl`, `externalUrl`, `role`, `highlights[]`, `year`,
`visibility` ("PUBLIC" | "FRIENDS" | "PRIVATE"), `status` ("PUBLISHED" | "DRAFT"),
`collaborators[]{user,username,name,avatar,role}`, `versions[]` (last ten edits),
`featured`, `likes`, `likedBy[]` (users._id), `views`, timestamps.

`collaborators` is credit for shared work. Handles typed into the form are resolved to real
users on the server, so the stored `user` id is never taken from the browser. Anyone on the
list may edit the project, but only `owner` may change the list or delete the project.

Indexes: text index on `title + summary + description + tags` (search),
`visibility + createdAt` (discover feed), `owner + createdAt` (a creator's work),
`collaborators.user` (work someone is credited on).

## comments
Feedback on a project. Replies point at a parent comment.

Key fields: `project` (projects._id), `author` (users._id), `authorName`,
`authorUsername`, `authorAvatar`, `text`, `parent` (comment._id, "" = top level),
`likes`, `likedBy[]` (users._id), timestamps. `@mentions` in `text` are parsed on
write to create notifications.

Indexes: `project + createdAt`.

## saves
A bookmark — one user saved one project.

Key fields: `user` (users._id), `project` (projects._id), timestamps.

Indexes: unique compound `user + project` (no duplicate bookmarks).

## collections
A named group of projects (like a playlist).

Key fields: `owner` (users._id), `ownerUsername`, `ownerName`, `title`, `description`,
`coverUrl`, `projects[]` (ordered projects._id), `visibility` ("PUBLIC" | "PRIVATE"),
timestamps.

Indexes: `owner`, `visibility`.

## follows
A directed follow edge.

Key fields: `follower` (users._id), `following` (users._id), timestamps.

Indexes: unique compound `follower + following` (follow once).
Feeds read this to get "who I follow", then query `projects` by those owners.

## notifications
Written by **both** services (that's why it lives in the shared DB). Best-effort — a
failed notification never breaks the main action, and we never notify yourself.

Key fields: `user` (recipient, users._id), `type`
("like" | "comment" | "save" | "follow" | "reply" | "mention" | "message"),
`actor` + `actorName` + `actorUsername`, `project` + `projectTitle`, `text`, `read`,
timestamps.

Indexes: `user + createdAt` (newest first), `user + read` (unread badge count).

## messages
One direct message, from → to.

Key fields: `from` (users._id), `to` (users._id), `text`, `read`, timestamps.
A "conversation" is every message where the two ids match either direction; a "thread"
list groups by the other person with their latest message + unread count.

Indexes: `from + to + createdAt` (conversation order), `to + read` (unread totals).

---

## Relationships (ascii)

```
users ──< projects ──< comments (parent → comments, self-reference for replies)
  │           │
  │           ├──< saves >── users
  │           └──< collections.projects[]
  │
  ├──< follows >── users        (follower / following)
  ├──< notifications             (recipient = user)
  └──< messages >── users        (from / to)
```

## Reseeding
The portfolio seed (`npm run seed`) is idempotent — it skips when projects already exist.
To reseed from scratch, wipe the volumes first: `npm run infra:reset` then `infra:up`,
`seed`. Demo login after a fresh seed: **vicky / paw12345** (also `miloart`, `sunnydraws`).
