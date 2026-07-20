import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const SOURCE_VALUES = ["all", "google_ads", "organic_search", "social", "newsletter", "direct", "external", "internal", "unknown"];
const LANDING_VALUES = ["all", "home", "jugendliche", "erwachsene", "angehoerige", "ueber_mich", "preise", "kontakt", "legal", "other"];
const DEVICE_VALUES = ["all", "mobile", "desktop", "tablet", "unknown"];
const PERIODS = new Set([7, 14, 30, 90]);

const SOURCE_LABELS = {
  all: "Alle Quellen",
  google_ads: "Google Ads",
  organic_search: "Organische Suche",
  social: "Social Media",
  newsletter: "Newsletter / E-Mail",
  direct: "Direkt",
  external: "Externe Website",
  internal: "Intern",
  unknown: "Unbekannt",
};
const GROUP_LABELS = {
  all: "Alle Einstiege",
  home: "Startseite",
  jugendliche: "Jugendberatung",
  erwachsene: "Erwachsene",
  angehoerige: "Angehörige",
  ueber_mich: "Über mich",
  preise: "Preise",
  kontakt: "Kontakt",
  legal: "Rechtliches",
  other: "Sonstige",
};
const DEVICE_LABELS = { all: "Alle Geräte", mobile: "Mobile", desktop: "Desktop", tablet: "Tablet", unknown: "Unbekannt" };
const CTA_LABELS = { header: "Header", hero: "Erster Bildschirm", body: "Inhalt", sticky: "Sticky-Leiste", footer: "Footer", unknown: "Ohne Position" };
const ACTION_LABELS = {
  contact_click: "Kontakt",
  appointment_click: "Terminbuchung",
  review_click: "Bewertungen",
  route_click: "Route",
  external_click: "Externer Link",
};
const OPTIMIZATION_LABELS = {
  appointment_cta_v1: "Termin-CTA",
  contact_cta_v1: "Kontakt-CTA",
  reviews_cta_v1: "Bewertungs-CTA",
  route_cta_v1: "Anfahrts-CTA",
};

function env(name) {
  return globalThis.Netlify?.env?.get?.(name) || process.env[name] || "";
}

function response(body, status = 200, contentType = "text/plain; charset=utf-8") {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function unauthorized() {
  return new Response("Authentifizierung erforderlich.", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": 'Basic realm="Mader-Höfer Statistik"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function tokenMatches(candidate, expected) {
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authorized(req) {
  const token = env("ANALYTICS_ADMIN_TOKEN");
  if (!token) return false;
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) return tokenMatches(header.slice(7).trim(), token);
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const password = decoded.includes(":") ? decoded.split(":").slice(1).join(":") : decoded;
    return tokenMatches(password, token);
  } catch {
    return false;
  }
}

function addDays(date, amount) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function viennaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseFilters(url) {
  const rawPeriod = url.searchParams.get("days") || "14";
  const numeric = Number(rawPeriod);
  const period = rawPeriod === "all" ? "all" : PERIODS.has(numeric) ? numeric : 14;
  const source = SOURCE_VALUES.includes(url.searchParams.get("source") || "") ? String(url.searchParams.get("source")) : "all";
  const landing = LANDING_VALUES.includes(url.searchParams.get("landing") || "") ? String(url.searchParams.get("landing")) : "all";
  const device = DEVICE_VALUES.includes(url.searchParams.get("device") || "") ? String(url.searchParams.get("device")) : "all";
  return { period, source, landing, device };
}

async function loadRows(minDate) {
  const store = getStore({ name: "maderhoefer-analytics", consistency: "strong" });
  const { blobs } = await store.list({ prefix: "counts/" });
  const relevant = minDate ? blobs.filter((blob) => (blob.key.split("/")[1] || "") >= minDate) : blobs;
  const rows = await Promise.all(relevant.map((blob) => store.get(blob.key, { type: "json" }).catch(() => null)));
  return rows
    .filter((row) => row && typeof row === "object" && row.schema === 1)
    .sort((left, right) => `${right.event_date}-${String(right.event_hour).padStart(2, "0")}`.localeCompare(`${left.event_date}-${String(left.event_hour).padStart(2, "0")}`));
}

function safeRate(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function total(rows, eventType) {
  return rows.filter((row) => row.event_type === eventType).reduce((sum, row) => sum + Number(row.count || 0), 0);
}

function summarize(rows) {
  const pageViews = total(rows, "page_view");
  const engagedViews = total(rows, "engaged_view");
  const contactClicks = total(rows, "contact_click");
  const appointmentClicks = total(rows, "appointment_click");
  const reviewClicks = total(rows, "review_click");
  const routeClicks = total(rows, "route_click");
  const externalClicks = total(rows, "external_click");
  const actions = contactClicks + appointmentClicks + reviewClicks + routeClicks;
  return {
    events: rows.reduce((sum, row) => sum + Number(row.count || 0), 0),
    sessions: total(rows, "session_start"),
    pageViews,
    engagedViews,
    contactClicks,
    appointmentClicks,
    reviewClicks,
    routeClicks,
    externalClicks,
    actions,
    engagementRate: safeRate(engagedViews, pageViews),
    actionRate: safeRate(actions, pageViews),
  };
}

function firstTouch(row) {
  return row.first_touch_source || row.source_class || "unknown";
}

function landingGroup(row) {
  return row.landing_page_group || row.page_group || "other";
}

function applyFilters(rows, filters) {
  return rows.filter((row) => {
    if (filters.source !== "all" && firstTouch(row) !== filters.source) return false;
    if (filters.landing !== "all" && landingGroup(row) !== filters.landing) return false;
    if (filters.device !== "all" && row.device_class !== filters.device) return false;
    return true;
  });
}

function windowFor(filters, rows, today) {
  if (filters.period === "all") {
    const start = rows.map((row) => row.event_date).sort()[0] || today;
    return { start, end: today, previousStart: null, previousEnd: null };
  }
  const start = addDays(today, -(filters.period - 1));
  const previousEnd = addDays(start, -1);
  return { start, end: today, previousStart: addDays(previousEnd, -(filters.period - 1)), previousEnd };
}

function dateSeries(start, end) {
  const result = [];
  for (let date = start; date <= end; date = addDays(date, 1)) result.push(date);
  return result;
}

function groupMetrics(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const label = key(row) || "unknown";
    const list = grouped.get(label) || [];
    list.push(row);
    grouped.set(label, list);
  }
  return [...grouped.entries()]
    .map(([label, values]) => ({
      label,
      firstDate: values.map((row) => row.event_date).sort()[0] || "",
      lastDate: values.map((row) => row.event_date).sort().at(-1) || "",
      ...summarize(values),
    }))
    .sort((a, b) => b.pageViews - a.pageViews || b.actions - a.actions || b.events - a.events);
}

function buildModel(rows, filters, today = viennaToday()) {
  const filtered = applyFilters(rows, filters);
  const window = windowFor(filters, filtered, today);
  const currentRows = filtered.filter((row) => row.event_date >= window.start && row.event_date <= window.end);
  const previousRows = window.previousStart && window.previousEnd ? filtered.filter((row) => row.event_date >= window.previousStart && row.event_date <= window.previousEnd) : [];
  const actionRows = currentRows.filter((row) => ["contact_click", "appointment_click", "review_click", "route_click", "external_click"].includes(row.event_type));
  return {
    filters,
    window,
    current: summarize(currentRows),
    previous: window.previousStart ? summarize(previousRows) : null,
    currentRows,
    sourceRows: groupMetrics(currentRows, firstTouch),
    landingRows: groupMetrics(currentRows, landingGroup),
    pageRows: groupMetrics(currentRows, (row) => row.page_path || "/"),
    groupRows: groupMetrics(currentRows, (row) => row.page_group || "other"),
    deviceRows: groupMetrics(currentRows, (row) => row.device_class || "unknown"),
    ctaRows: groupMetrics(actionRows, (row) => row.cta_location || "unknown"),
    actionRows: groupMetrics(actionRows, (row) => row.event_type || "unknown"),
    optimizationRows: groupMetrics(actionRows.filter((row) => (row.optimization_id || "none") !== "none"), (row) => row.optimization_id || "none"),
    trendRows: dateSeries(window.start, window.end).map((date) => ({ date, ...summarize(currentRows.filter((row) => row.event_date === date)) })),
    firstSessionDate: rows.filter((row) => row.event_type === "session_start").map((row) => row.event_date).sort()[0] || null,
    coverageDays: new Set(currentRows.map((row) => row.event_date)).size,
    dataQuality: {
      totalEvents: summarize(currentRows).events,
      unknownFirstTouch: currentRows.filter((row) => firstTouch(row) === "unknown").reduce((sum, row) => sum + Number(row.count || 0), 0),
      legacyRelease: currentRows.filter((row) => !row.site_release || row.site_release === "legacy").reduce((sum, row) => sum + Number(row.count || 0), 0),
    },
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(/"/gu, "&quot;");
}

function number(value) {
  return new Intl.NumberFormat("de-AT").format(value);
}

function percent(value) {
  return new Intl.NumberFormat("de-AT", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

function label(value, labels) {
  return labels[value] || value;
}

function delta(current, previous, rate = false) {
  if (previous === null || previous === undefined) return '<span class="delta neutral">Start</span>';
  if (previous === 0) return current === 0 ? '<span class="delta neutral">0</span>' : '<span class="delta neutral">neu</span>';
  const value = rate ? current - previous : (current - previous) / previous;
  const style = value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
  const text = rate
    ? `${value > 0 ? "+" : ""}${(value * 100).toLocaleString("de-AT", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %-Pkt.`
    : new Intl.NumberFormat("de-AT", { style: "percent", signDisplay: "exceptZero", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  return `<span class="delta ${style}">${escapeHtml(text)}</span>`;
}

function kpi(labelText, value, previous, description, rate = false) {
  return `<article class="kpi"><div class="kpi-head"><h2>${escapeHtml(labelText)}</h2>${delta(value, previous, rate)}</div><div class="metric">${rate ? percent(value) : number(value)}</div><p>${escapeHtml(description)}</p>${previous === null || previous === undefined ? "" : `<small>Vorperiode: ${rate ? percent(previous) : number(previous)}</small>`}</article>`;
}

function optionList(values, selected, labels) {
  return values.map((value) => `<option value="${escapeHtml(value)}"${String(value) === String(selected) ? " selected" : ""}>${escapeHtml(labels[String(value)] || value)}</option>`).join("");
}

function dimensionTable(rows, heading, labels = {}, limit = 14) {
  if (!rows.length) return '<p class="empty">Für diesen Filter liegen noch keine Daten vor.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>${escapeHtml(heading)}</th><th class="num">Aufrufe</th><th class="num">Engagiert</th><th class="num">Termine</th><th class="num">Kontakt</th><th class="num">Bewertungen</th><th class="num">Route</th><th class="num">Aktionsquote</th></tr></thead><tbody>${rows.slice(0, limit).map((row) => `<tr><th scope="row">${escapeHtml(label(row.label, labels))}<small>${escapeHtml(row.firstDate)} bis ${escapeHtml(row.lastDate)}</small></th><td class="num">${number(row.pageViews)}</td><td class="num">${number(row.engagedViews)}</td><td class="num strong">${number(row.appointmentClicks)}</td><td class="num">${number(row.contactClicks)}</td><td class="num">${number(row.reviewClicks)}</td><td class="num">${number(row.routeClicks)}</td><td class="num strong">${percent(row.actionRate)}</td></tr>`).join("")}</tbody></table></div>`;
}

function trendTable(rows) {
  const maxViews = Math.max(1, ...rows.map((row) => row.pageViews));
  return `<div class="table-wrap"><table><thead><tr><th>Tag</th><th>Seitenaufrufe</th><th class="num">Besuche</th><th class="num">Engagiert</th><th class="num">Termine</th><th class="num">Kontakt</th><th class="num">Bewertungen</th><th class="num">Route</th></tr></thead><tbody>${rows.map((row) => `<tr><th scope="row">${escapeHtml(row.date)}</th><td><div class="bar-row"><span class="bar"><span style="width:${Math.max(row.pageViews > 0 ? 2 : 0, (row.pageViews / maxViews) * 100).toFixed(1)}%"></span></span><strong>${number(row.pageViews)}</strong></div></td><td class="num">${number(row.sessions)}</td><td class="num">${number(row.engagedViews)}</td><td class="num strong">${number(row.appointmentClicks)}</td><td class="num">${number(row.contactClicks)}</td><td class="num">${number(row.reviewClicks)}</td><td class="num">${number(row.routeClicks)}</td></tr>`).join("")}</tbody></table></div>`;
}

function insights(model) {
  if (model.current.pageViews === 0) return ["Die Statistik beginnt mit diesem Deploy. Erste Tendenzen werden nach einigen vollständigen Tagen sichtbar."];
  const result = [];
  const mobile = model.deviceRows.find((row) => row.label === "mobile");
  const bestPage = [...model.pageRows].filter((row) => row.pageViews >= 3).sort((a, b) => b.actionRate - a.actionRate)[0];
  const mostViewed = model.pageRows[0];
  if (mobile) result.push(`${percent(mobile.pageViews / Math.max(1, model.current.pageViews))} der Seitenaufrufe kommen mobil; dort entstehen ${number(mobile.actions)} direkte Handlungen.`);
  if (bestPage) result.push(`${bestPage.label} verbindet Reichweite und Handlung derzeit am stärksten: ${number(bestPage.pageViews)} Aufrufe und ${percent(bestPage.actionRate)} Aktionsquote.`);
  if (mostViewed && mostViewed.actions === 0) result.push(`${mostViewed.label} ist sichtbar, löst im Messzeitraum aber noch keine direkte Handlung aus.`);
  return result.slice(0, 3);
}

function query(filters) {
  return new URLSearchParams({ days: String(filters.period), source: filters.source, landing: filters.landing, device: filters.device }).toString();
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/gu, '""')}"`;
}

function toCsv(rows) {
  const fields = ["event_date", "event_hour", "event_type", "page_group", "page_path", "cta_location", "device_class", "referrer_class", "source_class", "first_touch_source", "landing_page_group", "site_release", "optimization_id", "count"];
  return [fields.join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
}

function renderDashboard(model) {
  const previous = model.previous;
  const periodLabels = { "7": "Letzte 7 Tage", "14": "Letzte 14 Tage", "30": "Letzte 30 Tage", "90": "Letzte 90 Tage", all: "Gesamtzeitraum" };
  const q = query(model.filters);
  const unknownRate = model.dataQuality.totalEvents ? model.dataQuality.unknownFirstTouch / model.dataQuality.totalEvents : 0;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Statistik | Mader-Höfer</title><style>
:root{color-scheme:light;--ink:#243a34;--muted:#5d7069;--line:#dce7e1;--bg:#f4f8f6;--panel:#fff;--soft:#eaf3ef;--green:#4f8b7b;--green-dark:#2d5b50;--warm:#b9875a;--red:#9f342d;--blue:#446f91}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:14px ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:0}a{color:var(--green-dark)}button,select{font:inherit}main{max-width:1440px;margin:auto;padding:24px 18px 60px}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:18px}.eyebrow{margin:0 0 7px;color:var(--warm);font-size:12px;font-weight:800;text-transform:uppercase}.top h1{margin:0;font-size:clamp(30px,4vw,42px);line-height:1.06}.top p{max-width:820px;margin:10px 0 0;color:var(--muted);line-height:1.55}.actions{display:flex;gap:8px;flex-wrap:wrap}.button{display:inline-flex;min-height:42px;align-items:center;justify-content:center;padding:0 14px;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--ink);font-weight:760;text-decoration:none;cursor:pointer}.button:hover{border-color:var(--green);background:var(--soft)}.button.primary{border-color:var(--green-dark);background:var(--green-dark);color:#fff}.button:focus-visible,select:focus-visible{outline:3px solid rgba(79,139,123,.34);outline-offset:2px}.filters{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr)) auto;gap:10px;align-items:end;padding:14px;border:1px solid var(--line);border-radius:7px;background:#fff}.field{display:grid;gap:5px}.field label{color:var(--muted);font-size:12px;font-weight:760}.field select{width:100%;min-height:42px;border:1px solid #cbd8d2;border-radius:6px;background:#fff;padding:0 10px;color:var(--ink)}.context{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0 18px;color:var(--muted);font-size:12px}.nav{display:flex;gap:12px;overflow:auto;padding-bottom:10px}.nav a{white-space:nowrap;border-bottom:2px solid transparent;padding:8px 2px;color:var(--muted);font-weight:760;text-decoration:none}.nav a:hover{border-color:var(--green);color:var(--ink)}.kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:12px 0}.kpi{min-width:0;min-height:156px;border:1px solid var(--line);border-radius:7px;background:#fff;padding:15px}.kpi-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.kpi h2{margin:0;font-size:13px}.metric{margin-top:16px;font-size:31px;font-weight:830;line-height:1;font-variant-numeric:tabular-nums}.kpi p{min-height:35px;margin:11px 0 7px;color:var(--muted);font-size:12px;line-height:1.45}.kpi small{color:var(--muted);font-size:11px}.delta{border-radius:4px;padding:3px 5px;font-size:10px;font-weight:830;white-space:nowrap}.delta.positive{background:#e4f2ec;color:#23684d}.delta.negative{background:#fae8e8;color:var(--red)}.delta.neutral{background:#eef2f0;color:var(--muted)}.insights{margin:0 0 12px;padding:16px 18px 16px 38px;border-left:4px solid var(--blue);background:#eef5f8;color:#29495f;line-height:1.55}.insights li+li{margin-top:6px}.layout{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{min-width:0;border:1px solid var(--line);border-radius:7px;background:#fff;padding:16px;margin-top:12px}.panel.full{grid-column:1/-1}.panel-head{margin-bottom:12px}.panel h2{margin:0;font-size:19px}.panel p{margin:5px 0 0;color:var(--muted);font-size:12px;line-height:1.45}.table-wrap{width:100%;overflow:auto;border:1px solid #e6ece9;border-radius:5px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:9px 8px;border-bottom:1px solid #e6ece9;text-align:left;vertical-align:top}thead th{position:sticky;top:0;background:#f7faf8;color:#465a53;font-size:10px;font-weight:830;z-index:1}tbody th{min-width:150px;font-weight:740}tbody th small{display:block;margin-top:3px;color:#788a83;font-weight:500}tbody tr:hover{background:#f8fbfa}.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.strong{color:var(--green-dark);font-weight:830}.bar-row{display:flex;align-items:center;gap:8px;min-width:190px}.bar{display:block;width:130px;height:8px;border-radius:3px;background:#e7eeeb;overflow:hidden}.bar span{display:block;height:100%;background:var(--blue)}.empty{padding:20px;border:1px dashed #cbd8d2;border-radius:5px;text-align:center;color:var(--muted)}.quality{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.quality-item{border-left:3px solid var(--line);padding:5px 10px}.quality-item.good{border-color:#23684d}.quality-item.warn{border-color:var(--warm)}.quality-item strong{display:block;font-size:18px}.quality-item span{display:block;margin-top:3px;color:var(--muted);font-size:11px}.footnote{color:var(--muted);font-size:11px;line-height:1.55}.footnote li+li{margin-top:6px}@media(max-width:1180px){.kpi-grid{grid-template-columns:repeat(3,1fr)}.filters{grid-template-columns:repeat(2,1fr) auto}.layout{grid-template-columns:1fr}}@media(max-width:720px){main{padding:16px 10px 40px}.top{display:grid}.actions,.actions .button{width:100%}.filters{grid-template-columns:1fr}.filters .button{width:100%}.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi{min-height:148px;padding:12px}.kpi-head{display:grid;justify-content:start}.metric{font-size:27px}.quality{grid-template-columns:1fr}.panel{padding:12px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style></head><body><main><header class="top"><div><p class="eyebrow">Mader-Höfer · datenschutzfreundliche Eigenmessung</p><h1>Admin-Statistik</h1><p>Aggregierte Besuche, Seitenaufrufe, Termin-, Kontakt-, Bewertungs- und Routen-Klicks. Ohne Cookies, ohne User-ID, ohne E-Mail-Adresse und ohne vollständige IP-Speicherung.</p></div><div class="actions"><a class="button" href="/api/analytics/export.csv?${escapeHtml(q)}">CSV</a><a class="button" href="/api/analytics/data.json?${escapeHtml(q)}">JSON</a><a class="button" href="/">Website</a></div></header>
<form class="filters" method="get" action="/admin/statistik"><div class="field"><label for="days">Zeitraum</label><select id="days" name="days">${optionList([7,14,30,90,"all"],model.filters.period,periodLabels)}</select></div><div class="field"><label for="source">First-Touch-Quelle</label><select id="source" name="source">${optionList(SOURCE_VALUES,model.filters.source,SOURCE_LABELS)}</select></div><div class="field"><label for="landing">Einstiegsgruppe</label><select id="landing" name="landing">${optionList(LANDING_VALUES,model.filters.landing,GROUP_LABELS)}</select></div><div class="field"><label for="device">Gerät</label><select id="device" name="device">${optionList(DEVICE_VALUES,model.filters.device,DEVICE_LABELS)}</select></div><button class="button primary" type="submit">Auswerten</button></form>
<div class="context"><span><strong>Aktuell:</strong> ${escapeHtml(model.window.start)} bis ${escapeHtml(model.window.end)}</span><span><strong>Vergleich:</strong> ${model.window.previousStart ? `${escapeHtml(model.window.previousStart)} bis ${escapeHtml(model.window.previousEnd)}` : "keine Vorperiode"}</span><span><strong>Datentage:</strong> ${number(model.coverageDays)}</span></div>
<nav class="nav" aria-label="Dashboard-Bereiche"><a href="#ueberblick">Überblick</a><a href="#trend">Trend</a><a href="#quellen">Quellen</a><a href="#seiten">Seiten</a><a href="#aktionen">Aktionen</a><a href="#qualitaet">Datenqualität</a></nav>
<section id="ueberblick" class="kpi-grid" aria-label="Zentrale Kennzahlen">${kpi("Besuche",model.current.sessions,previous?.sessions,"Anonyme Browser-Sitzungen.")}${kpi("Seitenaufrufe",model.current.pageViews,previous?.pageViews,"Alle gemessenen öffentlichen Seiten.")}${kpi("Termin-Klicks",model.current.appointmentClicks,previous?.appointmentClicks,"Direkte Klicks zu Calendly.")}${kpi("Kontakt-Klicks",model.current.contactClicks,previous?.contactClicks,"Telefon, E-Mail und WhatsApp.")}${kpi("Engagement",model.current.engagementRate,previous?.engagementRate,"20 Sekunden aktiv oder 45 % gescrollt.",true)}${kpi("Aktionsquote",model.current.actionRate,previous?.actionRate,"Direkte Handlungen je Seitenaufruf.",true)}</section>
<ul class="insights">${insights(model).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
<div class="layout"><section id="trend" class="panel full"><div class="panel-head"><h2>Tagestrend</h2><p>Besuche, Seitenaufrufe und direkte Handlungen pro Kalendertag in Europe/Vienna.</p></div>${trendTable(model.trendRows)}</section>
<section id="quellen" class="panel full"><div class="panel-head"><h2>First-Touch-Quellen</h2><p>Die ursprüngliche Herkunft bleibt während interner Navigation innerhalb einer Sitzung erhalten.</p></div>${dimensionTable(model.sourceRows,"Quelle",SOURCE_LABELS)}</section>
<section class="panel full"><div class="panel-head"><h2>Einstiegsbereiche</h2><p>Welche Seite den Besuch begonnen hat.</p></div>${dimensionTable(model.landingRows,"Einstieg",GROUP_LABELS)}</section>
<section id="seiten" class="panel full"><div class="panel-head"><h2>Seitenleistung</h2><p>Reichweite, Engagement und direkte Handlungen je öffentlicher Seite.</p></div>${dimensionTable(model.pageRows,"Seite",{},20)}</section>
<section class="panel"><div class="panel-head"><h2>Themenbereiche</h2><p>Beratungsangebote und rechtliche Bereiche im Vergleich.</p></div>${dimensionTable(model.groupRows,"Bereich",GROUP_LABELS,10)}</section>
<section class="panel"><div class="panel-head"><h2>Geräte</h2><p>Mobile, Desktop und Tablet.</p></div>${dimensionTable(model.deviceRows,"Gerät",DEVICE_LABELS,6)}</section>
<section id="aktionen" class="panel"><div class="panel-head"><h2>Handlungsarten</h2><p>Was Besucher:innen nach dem Lesen konkret tun.</p></div>${dimensionTable(model.actionRows,"Handlung",ACTION_LABELS,10)}</section>
<section class="panel"><div class="panel-head"><h2>CTA-Positionen</h2><p>Wo direkte Handlungen ausgelöst werden.</p></div>${dimensionTable(model.ctaRows,"Position",CTA_LABELS,8)}</section>
<section class="panel full"><div class="panel-head"><h2>Optimierungen</h2><p>Markierte CTA-Gruppen für Vorher-/Nachher-Vergleiche.</p></div>${dimensionTable(model.optimizationRows,"Optimierung",OPTIMIZATION_LABELS,12)}</section>
<section id="qualitaet" class="panel"><div class="panel-head"><h2>Datenqualität</h2><p>Hinweise zur Belastbarkeit der Messung.</p></div><div class="quality"><div class="quality-item ${unknownRate < .05 ? "good" : "warn"}"><strong>${percent(unknownRate)}</strong><span>unbekannte First-Touch-Quelle</span></div><div class="quality-item"><strong>${number(model.dataQuality.legacyRelease)}</strong><span>Ereignisse ohne Release-ID</span></div><div class="quality-item good"><strong>2</strong><span>ausgeschlossene Privatpfade: /admin und /api</span></div></div></section>
<section class="panel"><div class="panel-head"><h2>Messlogik</h2><p>Was bewusst nicht gemessen wird.</p></div><ul class="footnote"><li>Keine Cookies und keine dauerhafte Besucher-ID.</li><li>Keine E-Mail-Adresse, kein Name, keine vollständige IP-Adresse und kein Formularinhalt.</li><li>Ein Download oder externer Klick bedeutet nicht automatisch, dass dort eine Buchung abgeschlossen wurde.</li><li>Die Zahlen sind aggregierte Orientierung, kein personenbezogener Funnel.</li></ul></section></div></main></body></html>`;
}

export default async (req) => {
  if (!env("ANALYTICS_ADMIN_TOKEN")) return response("ANALYTICS_ADMIN_TOKEN ist nicht gesetzt.", 503);
  if (!authorized(req)) return unauthorized();
  const url = new URL(req.url);
  const filters = parseFilters(url);
  const today = viennaToday();
  const earliest = filters.period === "all" ? null : addDays(today, -(Number(filters.period) * 2 - 1));
  const rows = await loadRows(earliest);
  const model = buildModel(rows, filters, today);
  if (url.pathname.endsWith("/data.json")) {
    return response(JSON.stringify({ generated_at: new Date().toISOString(), period: model.window, filters: model.filters, summary: model.current, rows: model.currentRows }, null, 2), 200, "application/json; charset=utf-8");
  }
  if (url.pathname.endsWith("/export.csv")) {
    return new Response(toCsv(model.currentRows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maderhoefer-statistik-${model.window.start}-${model.window.end}.csv"`,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
  return response(renderDashboard(model), 200, "text/html; charset=utf-8");
};

export const config = {
  path: ["/admin/statistik", "/admin/statistik/", "/api/analytics/data.json", "/api/analytics/export.csv"],
  method: ["GET"],
};
