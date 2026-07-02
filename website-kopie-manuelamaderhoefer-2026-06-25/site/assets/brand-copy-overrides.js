(function () {
  const logoUrl = "/assets/entfaltungsraum-baum-logo-512.png";
  const serviceLine =
    "Lebensberaterin (Personzentriert), Psychologische Beratung, Coaching";

  function addHeaderLogo(link) {
    link.classList.add("brand-link-with-logo");

    if (!link.querySelector(".brand-logo-mark")) {
      const logo = document.createElement("img");
      logo.className = "brand-logo-mark";
      logo.src = logoUrl;
      logo.alt = "";
      logo.width = 48;
      logo.height = 48;
      logo.decoding = "async";
      logo.loading = "eager";
      link.prepend(logo);
    }

    if (!link.querySelector(".brand-text-stack")) {
      const stack = document.createElement("span");
      stack.className = "brand-text-stack";
      Array.from(link.children)
        .filter((child) => child.tagName === "SPAN")
        .forEach((child) => stack.appendChild(child));
      link.append(stack);
    }
  }

  function addFooterLogo() {
    Array.from(document.querySelectorAll("footer a")).forEach((link) => {
      const text = link.textContent.replace(/\s+/g, " ").trim();
      if (text !== "Entfaltungsraum") return;

      link.classList.add("footer-brand-with-logo");
      if (link.querySelector(".footer-brand-logo-mark")) return;

      const logo = document.createElement("img");
      logo.className = "footer-brand-logo-mark";
      logo.src = logoUrl;
      logo.alt = "";
      logo.width = 34;
      logo.height = 34;
      logo.decoding = "async";
      logo.loading = "lazy";
      link.prepend(logo);
    });
  }

  function updateBrand() {
    Array.from(document.querySelectorAll("a")).forEach((link) => {
      const text = link.textContent.replace(/\s+/g, " ").trim();
      if (
        !text.includes("Entfaltungsraum") ||
        !text.includes("Manuela Mader-Höfer")
      ) {
        return;
      }

      addHeaderLogo(link);

      const serviceElement = Array.from(link.querySelectorAll("span")).find(
        (element) =>
          element.textContent.replace(/\s+/g, " ").trim() ===
          "Lebensberaterin",
      );

      if (!serviceElement) return;

      serviceElement.textContent = serviceLine;
      serviceElement.classList.add("brand-service-line");
    });

    addFooterLogo();
  }

  let scheduled = false;
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      updateBrand();
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
