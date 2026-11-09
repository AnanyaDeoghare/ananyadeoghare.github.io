(() => {
  "use strict";

  const canvas = document.getElementById("particle-canvas");
  const hero = document.getElementById("hero");
  const header = document.querySelector(".site-header");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (window.location.hash) {
    document.body.classList.add("loader-skipped");
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = menuToggle && document.getElementById(menuToggle.getAttribute("aria-controls"));
  const menuBackdrop = header && header.querySelector(".menu-backdrop");

  if (menuToggle && primaryNav && header) {
    const setMenuOpen = (isOpen, returnFocus) => {
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
      primaryNav.classList.toggle("is-open", isOpen);
      header.classList.toggle("menu-open", isOpen);
      document.body.classList.toggle("menu-open", isOpen);

      if (isOpen) {
        const firstLink = primaryNav.querySelector("a[href]");
        if (firstLink) {
          window.requestAnimationFrame(() => {
            if (menuToggle.getAttribute("aria-expanded") === "true") firstLink.focus();
          });
        }
      } else if (returnFocus) {
        menuToggle.focus();
      }
    };

    menuToggle.addEventListener("click", () => {
      setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true", false);
    });

    if (menuBackdrop) {
      menuBackdrop.addEventListener("click", () => {
        setMenuOpen(false, true);
      });
    }

    primaryNav.addEventListener("click", (event) => {
      if (event.target.closest("a[href]") && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false, true);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (menuToggle.getAttribute("aria-expanded") !== "true") return;
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false, true);
        return;
      }
      if (event.key !== "Tab") return;

      const links = Array.from(primaryNav.querySelectorAll("a[href]"));
      if (!links.length) return;
      const firstLink = links[0];
      const lastLink = links[links.length - 1];
      if (event.shiftKey && document.activeElement === menuToggle) {
        event.preventDefault();
        lastLink.focus();
      } else if (!event.shiftKey && document.activeElement === lastLink) {
        event.preventDefault();
        menuToggle.focus();
      }
    });

    window.matchMedia("(max-width: 900px)").addEventListener("change", (event) => {
      if (!event.matches && menuToggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false, false);
      }
    });
  }

  let revealItems = [];
  let revealObserver = null;

  const initializeReveals = () => {
    revealItems = Array.from(document.querySelectorAll(
      ".content-section, .project-grid .project-card, .credentials-grid .credential-card, .archive-main > .section-kicker, .archive-main > .section-heading, .archive-intro, .archive-grid .project-card"
    ));

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => {
        item.classList.add("is-visible");
      });
      return;
    }

    document.body.classList.add("motion-enhanced");
    const archiveCards = Array.from(document.querySelectorAll(".archive-grid .project-card"));
    archiveCards.forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${Math.min(index * 45, 270)}ms`);
    });

    const projectCards = Array.from(document.querySelectorAll(".project-grid .project-card:not(.featured-project)"));
    projectCards.forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${(index % 2) * 90}ms`);
    });

    const credentialCards = Array.from(document.querySelectorAll(".credentials-grid .credential-card"));
    credentialCards.forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${index * 80}ms`);
    });

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealItems.forEach((item) => {
      item.classList.add("scroll-reveal");
      revealObserver.observe(item);
    });
  };

  initializeReveals();
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      if (revealObserver) revealObserver.disconnect();
      document.body.classList.remove("motion-enhanced");
      revealItems.forEach((item) => {
        item.classList.add("is-visible");
      });
    } else {
      revealItems.forEach((item) => {
        item.classList.remove("is-visible");
      });
      initializeReveals();
    }
  });

  if (canvas && hero) {
    const context = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let particles = [];
    let frame = 0;
    let visible = true;
    const pointer = { x: null, y: null, vx: 0, vy: 0, offsetX: 0, offsetY: 0, targetOffsetX: 0, targetOffsetY: 0 };

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.clientWidth;
      height = hero.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(115, Math.max(55, Math.floor((width * height) / 10500)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.35 + 0.9,
        opacity: Math.random() * 0.38 + 0.3,
        depth: Math.random() * 0.65 + 0.45
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const connectionDistance = 142;
      const connectionDistanceSquared = connectionDistance * connectionDistance;
      const pointerConnectionDistance = 180;
      const maxConnectionsPerNode = 3;
      const connections = new Uint8Array(particles.length);

      pointer.offsetX += (pointer.targetOffsetX - pointer.offsetX) * 0.08;
      pointer.offsetY += (pointer.targetOffsetY - pointer.offsetY) * 0.08;
      pointer.vx *= 0.9;
      pointer.vy *= 0.9;

      particles.forEach((particle, index) => {
        if (!reduceMotion.matches) {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0 || particle.x > width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        }

        if (pointer.x !== null && pointer.y !== null) {
          const px = particle.x + pointer.offsetX * particle.depth;
          const py = particle.y + pointer.offsetY * particle.depth;
          const dx = pointer.x - px;
          const dy = pointer.y - py;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < pointerConnectionDistance && distance > 1) {
            const pull = (pointerConnectionDistance - distance) / pointerConnectionDistance;
            particle.x += (dx / distance) * pull * 0.6 + pointer.vx * pull * 0.18;
            particle.y += (dy / distance) * pull * 0.6 + pointer.vy * pull * 0.18;
            particle.x = Math.max(0, Math.min(width, particle.x));
            particle.y = Math.max(0, Math.min(height, particle.y));
          }
        }

        const drawX = particle.x + pointer.offsetX * particle.depth;
        const drawY = particle.y + pointer.offsetY * particle.depth;

        context.beginPath();
        context.arc(drawX, drawY, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255,255,255,${particle.opacity.toFixed(2)})`;
        context.fill();

        let nearPointer = false;
        if (pointer.x !== null && pointer.y !== null) {
          const mdx = drawX - pointer.x;
          const mdy = drawY - pointer.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < pointerConnectionDistance) {
            nearPointer = true;
            const mAlpha = (1 - mDist / pointerConnectionDistance) * 0.4;
            context.beginPath();
            context.moveTo(drawX, drawY);
            context.lineTo(pointer.x, pointer.y);
            context.strokeStyle = `rgba(255,255,255,${mAlpha.toFixed(3)})`;
            context.lineWidth = 0.9;
            context.stroke();
          }
        }

        const nodeCap = nearPointer ? maxConnectionsPerNode + 2 : maxConnectionsPerNode;
        if (connections[index] >= nodeCap) return;

        for (let next = index + 1; next < particles.length; next += 1) {
          if (connections[next] >= nodeCap) continue;
          const other = particles[next];
          const otherX = other.x + pointer.offsetX * other.depth;
          const otherY = other.y + pointer.offsetY * other.depth;
          const offsetX = drawX - otherX;
          const offsetY = drawY - otherY;
          const distanceSquared = offsetX * offsetX + offsetY * offsetY;
          if (distanceSquared < connectionDistanceSquared) {
            connections[index] += 1;
            connections[next] += 1;
            const alpha = (1 - distanceSquared / connectionDistanceSquared) * 0.25;
            context.beginPath();
            context.moveTo(drawX, drawY);
            context.lineTo(otherX, otherY);
            context.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
            context.lineWidth = 0.85;
            context.stroke();
            if (connections[index] >= nodeCap) break;
          }
        }
      });

      if (visible && !reduceMotion.matches) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    const updatePointer = (event) => {
      const bounds = hero.getBoundingClientRect();
      const nextX = event.clientX - bounds.left;
      const nextY = event.clientY - bounds.top;
      if (pointer.x !== null && pointer.y !== null) {
        pointer.vx = nextX - pointer.x;
        pointer.vy = nextY - pointer.y;
      }
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.targetOffsetX = ((nextX / Math.max(width, 1)) - 0.5) * 42;
      pointer.targetOffsetY = ((nextY / Math.max(height, 1)) - 0.5) * 42;
      if (reduceMotion.matches) {
        draw();
      }
    };

    const clearPointer = () => {
      pointer.x = null;
      pointer.y = null;
      pointer.vx = 0;
      pointer.vy = 0;
      pointer.targetOffsetX = 0;
      pointer.targetOffsetY = 0;
    };

    const observeVisibility = (entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !reduceMotion.matches && !frame) {
        frame = window.requestAnimationFrame(draw);
      } else if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    resizeCanvas();
    draw();
    window.addEventListener("resize", resizeCanvas);
    hero.addEventListener("pointermove", updatePointer);
    hero.addEventListener("pointerleave", clearPointer);
    new IntersectionObserver(observeVisibility, { threshold: 0.05 }).observe(hero);
    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.matches && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        draw();
      } else if (!reduceMotion.matches && visible && !frame) {
        frame = window.requestAnimationFrame(draw);
      }
    });
  }

  const experienceTabList = document.querySelector('[role="tablist"]');

  const updateTabHighlight = (activeTab) => {
    if (!experienceTabList) return;
    const tab = activeTab || experienceTabList.querySelector('.experience-tab[aria-selected="true"]');
    if (!tab) return;
    experienceTabList.style.setProperty("--tab-offset-y", `${tab.offsetTop}px`);
    experienceTabList.style.setProperty("--tab-height", `${tab.offsetHeight}px`);
    experienceTabList.style.setProperty("--tab-offset-x", `${tab.offsetLeft}px`);
    experienceTabList.style.setProperty("--tab-width", `${tab.offsetWidth}px`);
  };

  const setActiveTab = (tab) => {
    const tabs = Array.from(document.querySelectorAll(".experience-tab"));
    const panels = Array.from(document.querySelectorAll(".experience-panel"));
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.id !== tab.getAttribute("aria-controls");
    });
    updateTabHighlight(tab);
  };

  document.querySelectorAll(".experience-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab);
    });
    tab.addEventListener("keydown", (event) => {
      const tabs = Array.from(document.querySelectorAll(".experience-tab"));
      const index = tabs.indexOf(tab);
      let nextIndex = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      tabs[nextIndex].focus();
      setActiveTab(tabs[nextIndex]);
    });
  });

  if (experienceTabList) {
    const updateTabOrientation = () => {
      experienceTabList.setAttribute(
        "aria-orientation",
        window.matchMedia("(max-width: 900px)").matches ? "horizontal" : "vertical"
      );
      updateTabHighlight();
    };
    updateTabOrientation();
    window.addEventListener("resize", updateTabOrientation);
  }

  if (header) {
    let lastScrollY = window.scrollY;
    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const scrolled = currentScrollY > 24;
      header.classList.toggle("is-scrolled", scrolled);

      if (currentScrollY <= 70 || header.classList.contains("menu-open")) {
        header.classList.remove("is-hidden");
      } else if (currentScrollY > lastScrollY + 6) {
        header.classList.add("is-hidden");
      } else if (currentScrollY < lastScrollY - 6) {
        header.classList.remove("is-hidden");
      }
      lastScrollY = currentScrollY;
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  const navSectionLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
  if (navSectionLinks.length && "IntersectionObserver" in window) {
    const sectionMap = new Map();
    navSectionLinks.forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      const section = id && document.getElementById(id);
      if (section) sectionMap.set(section, link);
    });

    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = sectionMap.get(entry.target);
        if (link && entry.isIntersecting) {
          navSectionLinks.forEach((item) => {
            item.classList.toggle("is-active", item === link);
          });
        }
      });
    }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });

    sectionMap.forEach((_, section) => {
      spyObserver.observe(section);
    });
  }

  document.querySelectorAll(".project-card").forEach((card) => {
    const links = card.querySelectorAll("a[href]");
    if (links.length !== 1) return;
    const primaryLink = links[0];
    card.classList.add("has-primary-link");
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      const selection = window.getSelection && window.getSelection();
      if (selection && selection.toString().length > 0) return;
      primaryLink.click();
    });
  });

  const copyButton = document.querySelector("[data-copy-email]");
  const copyStatus = document.getElementById("copy-status");
  if (copyButton && copyStatus) {
    copyButton.addEventListener("click", () => {
      const email = `${copyButton.dataset.user}@${copyButton.dataset.domain}`;
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        copyStatus.textContent = `Email: ${copyButton.dataset.user} [at] ${copyButton.dataset.domain}`;
        return;
      }
      navigator.clipboard.writeText(email).then(() => {
        copyStatus.textContent = "Email address copied.";
      }).catch(() => {
        copyStatus.textContent = "Copy unavailable. Connect via LinkedIn instead.";
      });
    });
  }
})();
