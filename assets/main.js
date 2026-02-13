(function () {
  function normalizePath(path) {
    return path.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
  }

  function updatePathNav() {
    const currentPath = normalizePath(location.pathname);
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const url = new URL(link.getAttribute("href"), location.origin);
      const linkPath = normalizePath(url.pathname);
      const isActive = linkPath === "/" ? currentPath === "/" : currentPath.startsWith(linkPath);
      link.classList.toggle("active", isActive);
    });
  }

  function smoothScrollToHash(hash) {
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindAnchorScroll() {
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const href = anchor.getAttribute("href");
        const url = new URL(href, location.origin);
        const samePath = normalizePath(url.pathname) === normalizePath(location.pathname);
        if (samePath && url.hash) {
          event.preventDefault();
          history.replaceState(null, "", url.hash);
          smoothScrollToHash(url.hash);
        }
      });
    });
  }

  function bindSectionSpy() {
    const sectionLinks = Array.from(document.querySelectorAll("[data-section-link]"));
    const sections = Array.from(document.querySelectorAll("[data-section]"));
    if (!sectionLinks.length || !sections.length) return;

    const byHash = new Map(sectionLinks.map((link) => [new URL(link.getAttribute("href"), location.origin).hash, link]));

    function setActive(hash) {
      sectionLinks.forEach((link) => {
        const linkHash = new URL(link.getAttribute("href"), location.origin).hash;
        link.classList.toggle("active", linkHash === hash);
      });
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible) return;
          const hash = `#${visible.target.id}`;
          if (byHash.has(hash)) setActive(hash);
        },
        { rootMargin: "-35% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] }
      );
      sections.forEach((section) => observer.observe(section));
    }

    if (location.hash && byHash.has(location.hash)) {
      setActive(location.hash);
    } else if (sections[0]) {
      setActive(`#${sections[0].id}`);
    }
  }

  function bindDetailsA11y() {
    document.querySelectorAll("details").forEach((details) => {
      const summary = details.querySelector("summary");
      if (!summary) return;

      function sync() {
        summary.setAttribute("aria-expanded", details.open ? "true" : "false");
      }

      details.addEventListener("toggle", sync);
      sync();
    });
  }

  function updateYear() {
    const yearNode = document.getElementById("year");
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());
  }

  updatePathNav();
  bindAnchorScroll();
  bindSectionSpy();
  bindDetailsA11y();
  updateYear();

  if (location.hash) {
    window.requestAnimationFrame(() => smoothScrollToHash(location.hash));
  }
})();
