import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const EVENT_TYPES = new Set([
  "session_start",
  "page_view",
  "engaged_view",
  "contact_click",
  "appointment_click",
  "review_click",
  "route_click",
  "external_click",
]);
const DEVICES = new Set(["mobile", "tablet", "desktop", "unknown"]);
const CTA_LOCATIONS = new Set(["header", "hero", "body", "sticky", "footer", "unknown"]);
const REFERRERS = new Set(["direct", "internal", "search", "social", "external", "unknown"]);
const SOURCES = new Set(["google_ads", "organic_search", "social", "newsletter", "direct", "external", "internal", "unknown"]);
const GROUPS = new Set(["home", "jugendliche", "erwachsene", "angehoerige", "ueber_mich", "preise", "kontakt", "legal", "other"]);
const PRIVATE_PATHS = ["/admin", "/api"];

function env(name) {
  return globalThis.Netlify?.env?.get?.(name) || process.env[name] || "";
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function enumValue(value, allowed, fallback) {
  return typeof value === "string" && allowed.has(value) ? value : fallback;
}

function normalizePath(value) {
  if (typeof value !== "string") return "/";
  let path = value.trim().split(/[?#]/u)[0] || "/";
  try {
    if (/^https?:\/\//u.test(path)) path = new URL(path).pathname;
  } catch {
    return "/";
  }
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 180) path = path.slice(0, 180);
  if (!/^\/[a-zA-Z0-9äöüÄÖÜß\-_/]*$/u.test(path)) return "/";
  return path === "/" ? path : path.replace(/\/+$/u, "");
}

function privatePath(path) {
  return PRIVATE_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function pageGroup(path) {
  if (path === "/") return "home";
  if (path.startsWith("/jugendliche")) return "jugendliche";
  if (path.startsWith("/erwachsene")) return "erwachsene";
  if (path.startsWith("/angehoerige")) return "angehoerige";
  if (path.startsWith("/ueber-mich")) return "ueber_mich";
  if (path.startsWith("/preise")) return "preise";
  if (path.startsWith("/kontakt")) return "kontakt";
  if (path.startsWith("/datenschutz") || path.startsWith("/impressum")) return "legal";
  return "other";
}

function classifyReferrer(req) {
  const raw = req.headers.get("referer");
  if (!raw) return "direct";
  try {
    const referrer = new URL(raw).hostname.replace(/^www\./u, "");
    const current = new URL(req.url).hostname.replace(/^www\./u, "");
    if (referrer === current) return "internal";
    if (/google|bing|duckduckgo|yahoo|ecosia|startpage/u.test(referrer)) return "search";
    if (/facebook|instagram|linkedin|x\.com|twitter|whatsapp|tiktok/u.test(referrer)) return "social";
    return "external";
  } catch {
    return "unknown";
  }
}

function allowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

function viennaParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type)?.value || "00";
  return {
    event_date: `${value("year")}-${value("month")}-${value("day")}`,
    event_hour: Number(value("hour")),
  };
}

function cleanToken(value, fallback, maxLength = 64) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]*$/u.test(normalized) && normalized.length <= maxLength ? normalized : fallback;
}

function keyFor(row) {
  const digest = createHash("sha256").update(JSON.stringify(row)).digest("hex").slice(0, 24);
  return `counts/${row.event_date}/${String(row.event_hour).padStart(2, "0")}/${digest}.json`;
}

async function record(payload, req) {
  if (typeof payload.event_type !== "string" || !EVENT_TYPES.has(payload.event_type)) return;
  if (req.headers.get("sec-gpc") === "1") return;
  const path = normalizePath(payload.page_path);
  if (privatePath(path)) return;
  const group = pageGroup(path);
  const source = enumValue(payload.source_class, SOURCES, "unknown");
  const row = {
    schema: 1,
    site: "manuelamaderhoefer",
    ...viennaParts(),
    event_type: payload.event_type,
    page_group: group,
    page_path: path,
    cta_location: enumValue(payload.cta_location, CTA_LOCATIONS, "unknown"),
    device_class: enumValue(payload.device_class, DEVICES, "unknown"),
    referrer_class: enumValue(payload.referrer_class, REFERRERS, classifyReferrer(req)),
    source_class: source,
    first_touch_source: enumValue(payload.first_touch_source, SOURCES, source),
    landing_page_group: enumValue(payload.landing_page_group, GROUPS, group),
    site_release: cleanToken(payload.site_release, "legacy", 80),
    optimization_id: cleanToken(payload.optimization_id, "none", 64),
  };
  const store = getStore({ name: "maderhoefer-analytics", consistency: "strong" });
  const key = keyFor(row);
  const current = await store.get(key, { type: "json" }).catch(() => null);
  await store.setJSON(key, { ...row, count: (Number(current?.count) || 0) + 1 });
}

export default async (req, context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!allowedOrigin(req)) return json({ error: "origin_not_allowed" }, 403);
  if (Number(req.headers.get("content-length") || "0") > 4096) return json({ error: "payload_too_large" }, 413);
  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (env("PRIVACY_ANALYTICS_DISABLED") !== "true") {
    const task = record(payload, req);
    if (typeof context?.waitUntil === "function") context.waitUntil(task);
    else await task;
  }
  return json({ ok: true }, 202);
};

export const config = {
  path: "/api/analytics/collect",
  method: ["POST", "OPTIONS"],
};
