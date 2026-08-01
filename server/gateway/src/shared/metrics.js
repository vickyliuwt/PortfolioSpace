// shared/metrics.js
// counters + latency buckets, printed in prometheus text format

const BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

const state = {
  service: process.env.SERVICE_NAME || "service",
  started: Date.now(),
  total: 0,
  byStatus: new Map(),
  byRoute: new Map(),
  errors: 0,
  buckets: new Array(BUCKETS.length + 1).fill(0),
  sum: 0,
};

// group ids so routes stay readable
function label(req) {
  const base = (req.route?.path || req.path || "/").split("?")[0];
  return base
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
    .replace(/\/\d+/g, "/:n")
    .slice(0, 60);
}

// one line per request
export function metricsMw() {
  return (req, res, next) => {
    const t0 = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      state.total += 1;
      state.sum += ms;
      if (res.statusCode >= 500) state.errors += 1;

      const sk = String(res.statusCode);
      state.byStatus.set(sk, (state.byStatus.get(sk) || 0) + 1);

      const rk = `${req.method} ${label(req)}`;
      const cur = state.byRoute.get(rk) || { n: 0, ms: 0, max: 0 };
      cur.n += 1;
      cur.ms += ms;
      cur.max = Math.max(cur.max, ms);
      state.byRoute.set(rk, cur);

      let i = BUCKETS.findIndex((b) => ms <= b);
      if (i === -1) i = BUCKETS.length;
      state.buckets[i] += 1;
    });
    next();
  };
}

// prometheus text
export function renderMetrics() {
  const svc = state.service;
  const out = [];
  out.push("# HELP ps_requests_total requests handled");
  out.push("# TYPE ps_requests_total counter");
  out.push(`ps_requests_total{service="${svc}"} ${state.total}`);

  out.push("# HELP ps_request_errors_total responses with status 5xx");
  out.push("# TYPE ps_request_errors_total counter");
  out.push(`ps_request_errors_total{service="${svc}"} ${state.errors}`);

  out.push("# HELP ps_responses_total responses by status");
  out.push("# TYPE ps_responses_total counter");
  for (const [code, n] of state.byStatus) out.push(`ps_responses_total{service="${svc}",status="${code}"} ${n}`);

  out.push("# HELP ps_request_duration_ms request time");
  out.push("# TYPE ps_request_duration_ms histogram");
  let running = 0;
  BUCKETS.forEach((b, i) => {
    running += state.buckets[i];
    out.push(`ps_request_duration_ms_bucket{service="${svc}",le="${b}"} ${running}`);
  });
  running += state.buckets[BUCKETS.length];
  out.push(`ps_request_duration_ms_bucket{service="${svc}",le="+Inf"} ${running}`);
  out.push(`ps_request_duration_ms_sum{service="${svc}"} ${state.sum.toFixed(1)}`);
  out.push(`ps_request_duration_ms_count{service="${svc}"} ${state.total}`);

  out.push("# HELP ps_uptime_seconds seconds since boot");
  out.push("# TYPE ps_uptime_seconds gauge");
  out.push(`ps_uptime_seconds{service="${svc}"} ${Math.round((Date.now() - state.started) / 1000)}`);

  return out.join("\n") + "\n";
}

// json for my own dashboard
export function metricsJson() {
  const routes = [...state.byRoute.entries()]
    .map(([route, v]) => ({ route, calls: v.n, avgMs: +(v.ms / v.n).toFixed(1), maxMs: +v.max.toFixed(1) }))
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 25);
  return {
    service: state.service,
    uptimeSeconds: Math.round((Date.now() - state.started) / 1000),
    total: state.total,
    errors: state.errors,
    avgMs: state.total ? +(state.sum / state.total).toFixed(1) : 0,
    status: Object.fromEntries(state.byStatus),
    routes,
  };
}

// json log line
export function logJson(level, msg, extra = {}) {
  process.stdout.write(JSON.stringify({ t: new Date().toISOString(), level, service: state.service, msg, ...extra }) + "\n");
}
