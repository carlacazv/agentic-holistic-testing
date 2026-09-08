const currentYear = document.querySelector("[data-current-year]");
if (currentYear) {
  currentYear.textContent = String(new Date().getUTCFullYear());
}

const copyButton = document.querySelector("[data-copy]");
const copyStatus = document.querySelector(".copy-status");

if (copyButton && copyStatus) {
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copy ?? "");
      copyButton.textContent = "Copied";
      copyStatus.textContent = "Install command copied to the clipboard.";
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
        copyStatus.textContent = "";
      }, 2200);
    } catch {
      copyStatus.textContent = "Select the command and copy it manually.";
    }
  });
}

const navigationLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
const sections = navigationLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && navigationLinks.length && sections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

      if (!visible) return;

      navigationLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${visible.target.id}`;
        if (active) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    { rootMargin: "-22% 0px -62%", threshold: [0, 0.2, 0.5] },
  );

  sections.forEach((section) => sectionObserver.observe(section));
}
