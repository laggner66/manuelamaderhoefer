(function () {
  const calendlyUrl =
    "https://calendly.com/manuelamaderhofer/kostenloses-erstgesprach?month=2026-07";

  function isTerminCta(element) {
    const text = element.textContent.replace(/\s+/g, " ").trim();
    return (
      text.includes("Kostenloses Erstgespräch") ||
      text.includes("Erstgespräch buchen") ||
      text.includes("Termin buchen")
    );
  }

  function wireTerminButtons() {
    Array.from(document.querySelectorAll("a, button")).forEach((element) => {
      if (!isTerminCta(element)) return;

      element.dataset.calendlyUrl = calendlyUrl;
      if (element.tagName === "A") {
        element.setAttribute("href", calendlyUrl);
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function findHeroActions(heading) {
    const container = heading.parentElement;
    if (!container) return null;

    return Array.from(container.querySelectorAll("div")).find((element) =>
      Array.from(element.children).some((child) =>
        child.textContent.includes("Kostenloses Erstgespräch"),
      ),
    );
  }

  function insertHeroCalendlyButton() {
    if (document.querySelector(".homepage-calendly-panel")) return;

    const heading = Array.from(document.querySelectorAll("h1")).find((element) =>
      element.textContent.includes("Manchmal braucht es"),
    );
    if (!heading) return;

    const actions = findHeroActions(heading);
    if (!actions) return;

    const panel = document.createElement("div");
    panel.className = "homepage-calendly-panel";

    const link = document.createElement("a");
    link.className = "homepage-calendly-cta";
    link.href = calendlyUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.dataset.calendlyUrl = calendlyUrl;
    link.textContent = "Erstgespräch im Juli buchen";

    const note = document.createElement("p");
    note.className = "homepage-calendly-note";
    note.textContent = "Direkt zur Terminübersicht in Calendly.";

    panel.append(link, note);
    actions.insertAdjacentElement("afterend", panel);
  }

  function openCalendly(event) {
    const target = event.target.closest("[data-calendly-url]");
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.open(calendlyUrl, "_blank", "noopener");
  }

  let scheduled = false;
  function applyCtaOverrides() {
    wireTerminButtons();
    insertHeroCalendlyButton();
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      applyCtaOverrides();
    });
  }

  document.addEventListener("click", openCalendly, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleApply);
  } else {
    scheduleApply();
  }

  const observerTarget = document.getElementById("root") || document.documentElement;
  new MutationObserver(scheduleApply).observe(observerTarget, {
    childList: true,
    subtree: true,
  });
})();
