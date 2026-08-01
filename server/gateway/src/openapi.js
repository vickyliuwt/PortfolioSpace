// openapi.js
// hand written api reference, served at /api/docs

const tag = (name, desc) => ({ name, description: desc });

const ok = (desc = "ok") => ({ description: desc, content: { "application/json": { schema: { type: "object" } } } });
const list = (desc = "ok") => ({ description: desc, content: { "application/json": { schema: { type: "array", items: { type: "object" } } } } });
const body = (props, required = []) => ({
  required: true,
  content: { "application/json": { schema: { type: "object", required, properties: props } } },
});
const str = { type: "string" };
const num = { type: "integer" };
const bool = { type: "boolean" };
const q = (name, desc, schema = str) => ({ name, in: "query", description: desc, required: false, schema });
const pathId = (name = "id", desc = "record id") => ({ name, in: "path", required: true, description: desc, schema: str });

export function openapiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "PortfolioSpace API",
      version: "1.0.0",
      description:
        "Gateway for the PortfolioSpace services. Sign in with a cookie session, or send a JWT as `Authorization: Bearer <token>`.",
      contact: { name: "Weiting Liu" },
      license: { name: "MIT" },
    },
    servers: [{ url: "http://localhost:4000/api", description: "local gateway" }],
    tags: [
      tag("auth", "accounts, sessions, tokens, profile"),
      tag("social", "follows, notifications, messages, endorsements, recommendations"),
      tag("projects", "work, comments, boards, saves, stories, reports"),
      tag("media", "uploads and presigned links"),
      tag("search", "elasticsearch work and chat search"),
      tag("ops", "health, metrics, docs"),
    ],
    components: {
      securitySchemes: {
        bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        cookie: { type: "apiKey", in: "cookie", name: "ps.sid" },
      },
    },
    security: [{ cookie: [] }, { bearer: [] }],
    paths: {
      "/auth/signup": {
        post: {
          tags: ["auth"],
          summary: "Make an account",
          requestBody: body({ username: str, email: str, password: str, displayName: str, headline: str, skills: { type: "array", items: str } }, ["username", "email", "password"]),
          responses: { 201: ok("user plus a jwt"), 400: ok("bad input") },
        },
      },
      "/auth/signin": {
        post: {
          tags: ["auth"],
          summary: "Sign in",
          requestBody: body({ username: str, password: str }, ["username", "password"]),
          responses: { 200: ok("user plus a jwt"), 401: ok("wrong details") },
        },
      },
      "/auth/signout": { post: { tags: ["auth"], summary: "Sign out", responses: { 200: ok() } } },
      "/auth/token": { post: { tags: ["auth"], summary: "Swap a session for a jwt", responses: { 200: ok("token"), 401: ok("not signed in") } } },
      "/auth/profile": {
        get: { tags: ["auth"], summary: "Who am i", responses: { 200: ok(), 401: ok() } },
        put: { tags: ["auth"], summary: "Edit my profile", requestBody: body({ displayName: str, headline: str, bio: str, location: str, website: str, openToWork: bool, skills: { type: "array", items: str } }), responses: { 200: ok() } },
      },
      "/auth/profile/password": { put: { tags: ["auth"], summary: "Change password", requestBody: body({ current: str, next: str }, ["current", "next"]), responses: { 200: ok(), 400: ok() } } },
      "/auth/creators": { get: { tags: ["auth"], summary: "Browse creators", parameters: [q("q", "name or skill")], responses: { 200: list() } } },
      "/auth/creators/{username}": { get: { tags: ["auth"], summary: "One public profile", parameters: [pathId("username", "handle")], responses: { 200: ok(), 404: ok() } } },
      "/auth/follow/{userId}": { post: { tags: ["social"], summary: "Follow or unfollow", parameters: [pathId("userId")], responses: { 200: ok() } } },
      "/auth/follow/top": { get: { tags: ["social"], summary: "Most followed creators", parameters: [q("limit", "how many", num)], responses: { 200: list() } } },
      "/auth/notifications": { get: { tags: ["social"], summary: "My activity", responses: { 200: list() } } },
      "/auth/messages/threads": { get: { tags: ["social"], summary: "My chats", responses: { 200: list() } } },
      "/auth/messages/{userId}": {
        get: { tags: ["social"], summary: "One conversation", parameters: [pathId("userId")], responses: { 200: list() } },
        post: {
          tags: ["social"],
          summary: "Send a message",
          parameters: [pathId("userId")],
          requestBody: body({ text: str, imageUrl: str, audioUrl: str, audioSecs: num, sticker: str, project: { type: "object" } }),
          responses: { 201: ok(), 400: ok("nothing to send") },
        },
      },
      "/auth/messages/item/{msgId}": { delete: { tags: ["social"], summary: "Unsend my message", parameters: [pathId("msgId")], responses: { 200: ok(), 403: ok() } } },
      "/auth/endorsements": { post: { tags: ["social"], summary: "Endorse a skill", requestBody: body({ owner: str, skill: str }, ["owner", "skill"]), responses: { 200: ok() } } },
      "/auth/recommendations": { post: { tags: ["social"], summary: "Write a recommendation", requestBody: body({ forUser: str, text: str }, ["forUser", "text"]), responses: { 201: ok() } } },
      "/auth/profile-views/mine": { get: { tags: ["social"], summary: "Who opened my profile", responses: { 200: ok() } } },

      "/projects": {
        get: { tags: ["projects"], summary: "Public work", responses: { 200: list() } },
        post: { tags: ["projects"], summary: "Add work", requestBody: body({ title: str, summary: str, kind: str, category: str, tags: { type: "array", items: str }, visibility: str, status: str }, ["title"]), responses: { 201: ok(), 402: ok("plan cap, only when turned on") } },
      },
      "/projects/discover": { get: { tags: ["projects"], summary: "Search and filter work", parameters: [q("q", "words"), q("kind", "work type"), q("category", "category"), q("tag", "tag"), q("sort", "new, popular or views")], responses: { 200: list() } } },
      "/projects/reels": { get: { tags: ["projects"], summary: "Short video feed", responses: { 200: list() } } },
      "/projects/mine": { get: { tags: ["projects"], summary: "My work, including anything i am credited on", responses: { 200: list() } } },
      "/projects/mine/stats": { get: { tags: ["projects"], summary: "My totals", responses: { 200: ok() } } },
      "/projects/mine/trend": { get: { tags: ["projects"], summary: "Views and likes per day", parameters: [q("days", "window", num)], responses: { 200: list() } } },
      "/projects/{id}": {
        get: { tags: ["projects"], summary: "One project", parameters: [pathId()], responses: { 200: ok(), 403: ok("private"), 404: ok() } },
        put: { tags: ["projects"], summary: "Edit, owner or a credited teammate", parameters: [pathId()], responses: { 200: ok(), 403: ok("not yours") } },
        delete: { tags: ["projects"], summary: "Delete, owner only", parameters: [pathId()], responses: { 200: ok(), 403: ok("not yours") } },
      },
      "/projects/{id}/versions": { get: { tags: ["projects"], summary: "Past edits, owner or a credited teammate", parameters: [pathId()], responses: { 200: list(), 403: ok("not yours") } } },
      "/projects/{id}/restore/{index}": { post: { tags: ["projects"], summary: "Put an old version back", parameters: [pathId(), pathId("index", "which version")], responses: { 200: ok(), 403: ok("not yours") } } },
      "/projects/{id}/like": { post: { tags: ["projects"], summary: "Like or unlike", parameters: [pathId()], responses: { 200: ok() } } },
      "/projects/{id}/similar": { get: { tags: ["projects"], summary: "More like this", parameters: [pathId()], responses: { 200: list() } } },
      "/projects/comments/{projectId}": { get: { tags: ["projects"], summary: "Comments on a project", parameters: [pathId("projectId")], responses: { 200: list() } } },
      "/projects/comments/item/{commentId}/react": { post: { tags: ["projects"], summary: "React to a comment", parameters: [pathId("commentId")], requestBody: body({ emoji: str }, ["emoji"]), responses: { 200: ok() } } },
      "/projects/stories": { post: { tags: ["projects"], summary: "Post a story, gone in 24h", requestBody: body({ imageUrl: str, imageKey: str, caption: str }, ["imageUrl"]), responses: { 201: ok() } } },
      "/projects/stories/active": { post: { tags: ["projects"], summary: "Live stories for people i follow", requestBody: body({ owners: { type: "array", items: str } }), responses: { 200: list() } } },

      "/media/upload": { post: { tags: ["media"], summary: "Upload a file", requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } }, responses: { 201: ok("key, url and type") } } },

      "/search/projects": { get: { tags: ["search"], summary: "Work search", parameters: [q("q", "words"), q("kind", "work type"), q("category", "category")], responses: { 200: ok("hits, or es false when the engine is off") } } },
      "/search/messages": { get: { tags: ["search"], summary: "Search my chats", parameters: [q("q", "words")], responses: { 200: ok() } } },
      "/search/reindex": { post: { tags: ["search"], summary: "Rebuild the index, admins only", responses: { 200: ok(), 403: ok() } } },

      "/health": { get: { tags: ["ops"], summary: "Is everything up", responses: { 200: ok(), 503: ok("something is down") } } },
      "/metrics": { get: { tags: ["ops"], summary: "Numbers for every service", responses: { 200: ok() } } },
    },
  };
}

// swagger ui straight off a cdn, so nothing extra to install
export function docsPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>PortfolioSpace API</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fffcf2; }
      .topbar { display: none; }
      .swagger-ui .info .title { color: #b34a6b; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#app", docExpansion: "list", defaultModelsExpandDepth: -1 });
      };
    </script>
  </body>
</html>`;
}
