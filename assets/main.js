(function () {
  function normalizePath(path) {
    return path.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
  }

  function getNavHeight() {
    const nav = document.querySelector(".nav");
    return nav ? nav.offsetHeight : 76;
  }

  function syncNavHeightVar() {
    const navHeight = getNavHeight();
    document.documentElement.style.setProperty("--nav-height", navHeight + "px");
  }

  function markActiveNav() {
    const currentPath = normalizePath(location.pathname);
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      const url = new URL(link.getAttribute("href"), location.origin);
      const linkPath = normalizePath(url.pathname);
      const active = linkPath === "/" ? currentPath === "/" : currentPath.startsWith(linkPath);
      link.classList.toggle("active", active);
    });
  }

  function scrollToHash(hash, behavior) {
    if (!hash || hash === "#") return;
    const target = document.querySelector(hash);
    if (!target) return;

    const navHeight = getNavHeight();
    const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
    window.scrollTo({ top: Math.max(top, 0), behavior: behavior || "smooth" });
  }

  function bindHashAnchors() {
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (event) {
        const href = anchor.getAttribute("href");
        if (!href) return;

        const url = new URL(href, location.origin);
        const isSamePage = normalizePath(url.pathname) === normalizePath(location.pathname);
        if (!isSamePage || !url.hash) return;

        event.preventDefault();
        history.replaceState(null, "", url.hash);
        scrollToHash(url.hash, "smooth");
      });
    });
  }

  function bindSectionSpy() {
    const links = Array.from(document.querySelectorAll("[data-section-link]"));
    const sections = Array.from(document.querySelectorAll("[data-section]"));
    if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

    const hashToLink = new Map();
    links.forEach(function (link) {
      const hash = new URL(link.getAttribute("href"), location.origin).hash;
      hashToLink.set(hash, link);
    });

    function setActive(hash) {
      links.forEach(function (link) {
        const linkHash = new URL(link.getAttribute("href"), location.origin).hash;
        link.classList.toggle("active", linkHash === hash);
      });
    }

    const observer = new IntersectionObserver(
      function (entries) {
        const visible = entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .sort(function (a, b) {
            return b.intersectionRatio - a.intersectionRatio;
          })[0];

        if (!visible) return;
        const hash = "#" + visible.target.id;
        if (hashToLink.has(hash)) setActive(hash);
      },
      { rootMargin: "-24% 0px -62% 0px", threshold: [0.15, 0.35, 0.65] }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });

    if (location.hash && hashToLink.has(location.hash)) {
      setActive(location.hash);
    } else {
      setActive("#" + sections[0].id);
    }
  }

  function bindRevealAnimation() {
    const nodes = Array.from(document.querySelectorAll("[data-animate]"));
    if (!nodes.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function updateYear() {
    const yearNode = document.getElementById("year");
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());
  }

  document.documentElement.classList.add("js-ready");
  syncNavHeightVar();
  markActiveNav();
  bindHashAnchors();
  bindSectionSpy();
  bindRevealAnimation();
  updateYear();

  window.addEventListener("resize", syncNavHeightVar, { passive: true });

  if (location.hash) {
    window.requestAnimationFrame(function () {
      scrollToHash(location.hash, "auto");
    });
  }
})();
