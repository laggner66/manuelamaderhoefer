(function () {
  const quote =
    "„Man kann den Körper nicht ohne die Seele heilen, und die Seele nicht ohne den Körper.“";

  const paragraphs = [
    "Dieser Leitgedanke prägt meine tägliche Arbeit.",
    "Als Beraterin und Körpertherapeutin begegne ich Menschen, die an einem Punkt im Leben stehen, an dem sie spüren: Es darf sich etwas verändern. Sei es, weil der Stress überhandnimmt, eine Krise bewältigt werden muss oder der Zugang zu den eigenen Bedürfnissen verloren gegangen ist.",
    "Mein Name ist Manuela Mader-Höfer. Ich biete Ihnen einen sicheren Ankerplatz. In meiner Praxis kombiniere ich das klärende, entlastende Gespräch mit sanften, regulierenden Berührungen aus dem Shiatsu. Mein Fokus liegt darauf, Sie nicht nur mental zu beraten, sondern Sie wieder tief im eigenen Körper zu verwurzeln. Denn echte, nachhaltige Veränderung und Lebensqualität entstehen dann, wenn Geist und Körper wieder im Einklang sind.",
    "Lassen Sie uns gemeinsam den Raum für Ihre Entlastung und Ihr persönliches Wachstum öffnen. Ich freue mich auf Sie in Maria Enzersdorf/St. Gabriel.",
  ];

  function findAboutHeading() {
    return Array.from(document.querySelectorAll("h2")).find(
      (heading) => heading.textContent.trim() === "Über Manuela Mader-Höfer",
    );
  }

  function applyAboutCopy() {
    const heading = findAboutHeading();
    if (!heading || !heading.parentElement) return;

    const container = heading.parentElement;
    if (
      container.dataset.aboutCopyUpdated === "true" &&
      container.textContent.includes(paragraphs[0])
    ) {
      return;
    }

    container.dataset.aboutCopyUpdated = "true";
    container.classList.remove("lg:w-1/2");
    container.classList.add("about-copy-override");

    Array.from(container.children).forEach((child) => {
      if (child !== heading) child.remove();
    });

    const quoteElement = document.createElement("blockquote");
    quoteElement.className = "about-quote";
    quoteElement.textContent = quote;
    container.appendChild(quoteElement);

    paragraphs.forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.className = "about-paragraph";
      paragraph.textContent = text;
      container.appendChild(paragraph);
    });
  }

  let scheduled = false;
  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      applyAboutCopy();
    });
  }

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
