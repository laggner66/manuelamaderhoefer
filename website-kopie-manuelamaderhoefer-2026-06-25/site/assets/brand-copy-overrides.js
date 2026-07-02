(function () {
  const serviceLine =
    "Lebensberaterin (Personzentriert), Psychologische Beratung, Coaching";

  function updateBrandServiceLine() {
    Array.from(document.querySelectorAll("a")).forEach((link) => {
      const text = link.textContent.replace(/\s+/g, " ").trim();
      if (
        !text.includes("Entfaltungsraum") ||
        !text.includes("Manuela Mader-Höfer")
      ) {
        return;
      }

      const serviceElement = Array.from(link.querySelectorAll("span")).find(
        (element) =>
          element.textContent.replace(/\s+/g, " ").trim() ===
          "Lebensberaterin",
      );

      if (!serviceElement) return;

      serviceElement.textContent = serviceLine;
      serviceElement.classList.add("brand-service-line");
    });
  }

  let scheduled = false;
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      updateBrandServiceLine();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleUpdate);
  } else {
    scheduleUpdate();
  }

  const observerTarget = document.getElementById("root") || document.documentElement;
  new MutationObserver(scheduleUpdate).observe(observerTarget, {
    childList: true,
    subtree: true,
  });
})();
