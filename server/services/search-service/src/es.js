// es.js
// es over http

const ES_URL = (process.env.ES_URL || "http://127.0.0.1:9200").replace(/\/$/, "");

export const PROJECT_INDEX = process.env.ES_PROJECT_INDEX || "ps-projects";
export const MESSAGE_INDEX = process.env.ES_MESSAGE_INDEX || "ps-messages";

// http call
async function call(method, path, body, timeoutMs = 6000) {
  const res = await fetch(`${ES_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(json?.error?.reason || `es ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

// ping
export async function ping() {
  try {
    const info = await call("GET", "/", null, 2500);
    return { up: true, version: info?.version?.number || "?" };
  } catch (e) {
    return { up: false, error: e.message };
  }
}

// mappings
const PROJECT_MAP = {
  mappings: {
    properties: {
      title: { type: "text" },
      summary: { type: "text" },
      description: { type: "text" },
      tags: { type: "text", fields: { raw: { type: "keyword" } } },
      tools: { type: "text" },
      ownerName: { type: "text" },
      ownerUsername: { type: "keyword" },
      owner: { type: "keyword" },
      kind: { type: "keyword" },
      category: { type: "keyword" },
      coverUrl: { type: "keyword", index: false },
      likes: { type: "integer" },
      views: { type: "integer" },
      createdAt: { type: "date" },
    },
  },
};

const MESSAGE_MAP = {
  mappings: {
    properties: {
      text: { type: "text" },
      from: { type: "keyword" },
      to: { type: "keyword" },
      createdAt: { type: "date" },
    },
  },
};

// ensure index
export async function ensureIndexes() {
  for (const [name, map] of [
    [PROJECT_INDEX, PROJECT_MAP],
    [MESSAGE_INDEX, MESSAGE_MAP],
  ]) {
    try {
      await call("GET", `/${name}`, null, 3000);
    } catch {
      await call("PUT", `/${name}`, map).catch(() => {});
    }
  }
}

// bulk
export async function bulkIndex(index, docs) {
  if (!docs.length) return 0;
  const lines = [];
  for (const d of docs) {
    lines.push(JSON.stringify({ index: { _index: index, _id: d.id } }));
    const copy = { ...d };
    delete copy.id;
    lines.push(JSON.stringify(copy));
  }
  await call("POST", "/_bulk?refresh=wait_for", lines.join("\n") + "\n", 30000);
  return docs.length;
}

// put, delete
export const putDoc = (index, id, doc) => call("PUT", `/${index}/_doc/${id}?refresh=true`, doc);
export const deleteDoc = (index, id) => call("DELETE", `/${index}/_doc/${id}?refresh=true`).catch(() => null);

// query
export async function search(index, body) {
  const out = await call("POST", `/${index}/_search`, body, 8000);
  const hits = out?.hits?.hits || [];
  return {
    total: out?.hits?.total?.value ?? hits.length,
    took: out?.took ?? 0,
    hits: hits.map((h) => ({ id: h._id, score: h._score, ...h._source, highlight: h.highlight })),
  };
}

export const wipe = (index) => call("DELETE", `/${index}`).catch(() => null);
