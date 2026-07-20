(function () {
  "use strict";

  var endpoint = "/api/analytics/collect";
  var release = "2026-07-20-maderhoefer-analytics-v1";
  var attributionKey = "mh_privacy_attribution_v1";
  var sessionKey = "mh_privacy_session_started_v1";
  var disabledKey = "mh_privacy_analytics_disabled_v1";
  var privatePaths = ["/admin", "/api"];
  var sourceClasses = new Set(["google_ads", "organic_search", "social", "newsletter", "direct", "external", "internal", "unknown"]);
  var groups = new Set(["home", "jugendliche", "erwachsene", "angehoerige", "ueber_mich", "preise", "kontakt", "legal", "other"]);
  var trackedPath = "";
  var engagementCleanup = null;

  function normalizePath(pathname) {
    var path = String(pathname || "/").split(/[?#]/u)[0] || "/";
    if (path === "/") return path;
    return "/" + path.replace(/^\/+|\/+$/gu, "");
  }

  function pageGroup(pathname) {
    var path = normalizePath(pathname);
    if (path === "/") return "home";
    if (path.indexOf("/jugendliche") === 0) return "jugendliche";
    if (path.indexOf("/erwachsene") === 0) return "erwachsene";
    if (path.indexOf("/angehoerige") === 0) return "angehoerige";
    if (path.indexOf("/ueber-mich") === 0) return "ueber_mich";
    if (path.indexOf("/preise") === 0) return "preise";
    if (path.indexOf("/kontakt") === 0) return "kontakt";
    if (path.indexOf("/datenschutz") === 0 || path.indexOf("/impressum") === 0) return "legal";
    return "other";
  }

  function isPrivatePath(pathname) {
    var path = normalizePath(pathname);
    return privatePaths.some(function (prefix) {
      return path === prefix || path.indexOf(prefix + "/") === 0;
    });
  }

  function storage() {
    try {
      var value = window.sessionStorage;
      var probe = "__mh_analytics_probe__";
      value.setItem(probe, "1");
      value.removeItem(probe);
      return value;
    } catch (_) {
      return null;
    }
  }

  function privacySignalActive() {
    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1") return true;
    var currentStorage = storage();
    var params = new URLSearchParams(window.location.search);
    if (params.get("analytics_on") === "1") currentStorage?.removeItem(disabledKey);
    if (params.get("analytics_off") === "1") {
      currentStorage?.setItem(disabledKey, "1");
      return true;
    }
    return currentStorage?.getItem(disabledKey) === "1";
  }

  function deviceClass() {
    if (window.innerWidth <= 767) return "mobile";
    if (window.innerWidth <= 1024) return "tablet";
    return "desktop";
  }

  function referrerClass() {
    if (!document.referrer) return "direct";
    try {
      var referrerHost = new URL(document.referrer).hostname.replace(/^www\./u, "");
      var currentHost = window.location.hostname.replace(/^www\./u, "");
      if (referrerHost === currentHost) return "internal";
      if (/google|bing|duckduckgo|yahoo|ecosia|startpage/u.test(referrerHost)) return "search";
      if (/facebook|instagram|linkedin|x\.com|twitter|whatsapp|tiktok/u.test(referrerHost)) return "social";
      return "external";
    } catch (_) {
      return "unknown";
    }
  }

  function sourceClass() {
    var params = new URLSearchParams(window.location.search);
    var source = (params.get("utm_source") || "").toLowerCase();
    var medium = (params.get("utm_medium") || "").toLowerCase();
    if (params.has("gclid") || params.has("gbraid") || params.has("wbraid")) return "google_ads";
    if (source.indexOf("google") >= 0 && ["cpc", "ppc", "paid"].indexOf(medium) >= 0) return "google_ads";
    if (/facebook|instagram|linkedin|twitter|whatsapp|tiktok|x$/u.test(source)) return "social";
    if (/newsletter|mailchimp|brevo|email/u.test(source) || medium === "email") return "newsletter";
    var referrer = referrerClass();
    if (referrer === "search") return "organic_search";
    if (referrer === "social") return "social";
    if (referrer === "internal") return "internal";
    if (referrer === "direct") return "direct";
    if (referrer === "external") return "external";
    return "unknown";
  }

  function explicitCampaignSource() {
    var params = new URLSearchParams(window.location.search);
    return params.has("gclid") || params.has("gbraid") || params.has("wbraid") || params.has("utm_source") ? sourceClass() : null;
  }

  function validValue(value, allowed) {
    return typeof value === "string" && allowed.has(value) ? value : null;
  }

  function sessionAttribution() {
    var currentSource = sourceClass();
    var currentLanding = pageGroup(window.location.pathname);
    var fallback = {
      source_class: currentSource,
      first_touch_source: currentSource,
      landing_page_group: currentLanding,
    };
    var currentStorage = storage();
    if (!currentStorage) return fallback;
    try {
      var raw = currentStorage.getItem(attributionKey);
      var existing = raw ? JSON.parse(raw) : {};
      var storedSource = validValue(existing.source_class, sourceClasses);
      var storedFirstTouch = validValue(existing.first_touch_source, sourceClasses) || storedSource;
      var storedLanding = validValue(existing.landing_page_group, groups);
      var explicit = explicitCampaignSource();
      var refresh = explicit && (!storedFirstTouch || ["direct", "internal", "unknown"].indexOf(storedFirstTouch) >= 0);
      var value = {
        source_class: refresh ? explicit : storedSource || currentSource,
        first_touch_source: refresh ? explicit : storedFirstTouch || currentSource,
        landing_page_group: refresh ? currentLanding : storedLanding || currentLanding,
      };
      currentStorage.setItem(attributionKey, JSON.stringify(value));
      return value;
    } catch (_) {
      return fallback;
    }
  }

  function ctaLocation(element) {
    if (element.closest("header")) return "header";
    if (element.closest("footer")) return "footer";
    if (element.closest(".hero, [data-analytics-region='hero']")) return "hero";
    if (element.closest("[data-sticky], .sticky-cta")) return "sticky";
    return "body";
  }

  function sameHost(url) {
    try {
      return new URL(url, window.location.href).hostname.replace(/^www\./u, "") === window.location.hostname.replace(/^www\./u, "");
    } catch (_) {
      return true;
    }
  }

  function classifyLink(href) {
    if (!href) return null;
    var lower = href.toLowerCase();
    if (lower.indexOf("calendly.com/manuelamaderhofer") >= 0) return "appointment_click";
    if (lower.indexOf("provenexpert.com") >= 0 || lower.indexOf("google.com/search") >= 0 && lower.indexOf("rezension") >= 0) return "review_click";
    if (lower.indexOf("maps.google") >= 0 || lower.indexOf("google.com/maps") >= 0) return "route_click";
    if (lower.indexOf("tel:") === 0 || lower.indexOf("mailto:") === 0 || lower.indexOf("wa.me/") >= 0 || lower.indexOf("whatsapp") >= 0 || lower === "/kontakt" || lower === "/kontakt/" || lower.indexOf("#kontakt") >= 0) return "contact_click";
    if (/^https?:\/\//u.test(lower) && !sameHost(href)) return "external_click";
    return null;
  }

  function classifyButtonText(element) {
    var text = String(element.textContent || "").toLowerCase();
    if (/erstgespräch|termin|buchen/u.test(text)) return "appointment_click";
    if (/anrufen|telefon|e-mail|whatsapp|chat starten|kontakt/u.test(text)) return "contact_click";
    if (/bewertung|rezension|provenexpert/u.test(text)) return "review_click";
    if (/route|anfahrt|maps/u.test(text)) return "route_click";
    return null;
  }

  function optimizationId(eventType) {
    if (eventType === "appointment_click") return "appointment_cta_v1";
    if (eventType === "contact_click") return "contact_cta_v1";
    if (eventType === "review_click") return "reviews_cta_v1";
    if (eventType === "route_click") return "route_cta_v1";
    return "none";
  }

  function send(eventType, details) {
    if (isPrivatePath(window.location.pathname) || privacySignalActive()) return;
    var attribution = sessionAttribution();
    var payload = {
      event_type: eventType,
      page_path: normalizePath(window.location.pathname),
      cta_location: details?.cta_location || "unknown",
      device_class: deviceClass(),
      referrer_class: referrerClass(),
      source_class: attribution.source_class,
      first_touch_source: attribution.first_touch_source,
      landing_page_group: attribution.landing_page_group,
      site_release: release,
      optimization_id: details?.optimization_id || "none",
    };
    try {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "omit",
        keepalive: true,
        referrerPolicy: "no-referrer",
      }).catch(function () {});
    } catch (_) {
      /* Analytics darf die Website nie unterbrechen. */
    }
  }

  function trackEngagement() {
    if (typeof engagementCleanup === "function") engagementCleanup();
    var sent = false;
    var timer = 0;
    var mark = function () {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      send("engaged_view");
      cleanup();
    };
    var onScroll = function () {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.45) mark();
    };
    var cleanup = function () {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    timer = window.setTimeout(mark, 20000);
    engagementCleanup = cleanup;
  }

  function trackPageView() {
    var path = normalizePath(window.location.pathname);
    if (path === trackedPath) return;
    trackedPath = path;
    send("page_view");
    trackEngagement();
  }

  function patchNavigation() {
    ["pushState", "replaceState"].forEach(function (method) {
      var original = history[method];
      history[method] = function () {
        var result = original.apply(this, arguments);
        window.setTimeout(trackPageView, 0);
        return result;
      };
    });
    window.addEventListener("popstate", function () {
      window.setTimeout(trackPageView, 0);
    });
  }

  function startTracking() {
    if (isPrivatePath(window.location.pathname) || privacySignalActive()) return;
    var currentStorage = storage();
    if (!currentStorage?.getItem(sessionKey)) {
      currentStorage?.setItem(sessionKey, "1");
      send("session_start");
    }
    patchNavigation();
    trackPageView();
    document.addEventListener("click", function (event) {
      var target = event.target.closest?.("a[href],button,[role='button']");
      if (!target) return;
      var href = target.matches?.("a[href]") ? target.getAttribute("href") : "";
      var eventType = href ? classifyLink(href) : classifyButtonText(target);
      if (!eventType) return;
      send(eventType, {
        cta_location: ctaLocation(target),
        optimization_id: optimizationId(eventType),
      });
    });
  }

  if (typeof window !== "undefined" && typeof document !== "undefined") startTracking();
})();
