/* =========================================================================
   Portfolio engagement tracking + CV email-gate
   -------------------------------------------------------------------------
   - Sends custom events to your existing Google Analytics 4 (gtag.js):
       cv_download, scroll_depth, section_time, contact_submit
   - Email-gates the "Download CV" buttons via Formspree, so you capture the
     name + email of people who want your CV. Their message + contact-form
     submissions are emailed to you by Formspree.

   PRIVACY NOTE: GA4 gives you anonymous stats (visits, country/city, device,
   source, time on page). A visitor's real name/email can ONLY be captured
   when they voluntarily type it in (the CV gate / contact form below).
   ========================================================================= */
(function () {
  "use strict";

  // ======================= CONFIG (EDIT THIS) =============================
  // 1) Create a free form at https://formspree.io and paste its ID here.
  //    Your endpoint looks like https://formspree.io/f/abcdwxyz  -> ID = "abcdwxyz"
  var FORMSPREE_ID = "meebbknp";

  // Sections to measure engagement for (must match element ids in index.html)
  var SECTIONS = ["home", "about", "skills", "project", "contact"];
  // ========================================================================

  var FORMSPREE_URL = "https://formspree.io/f/" + FORMSPREE_ID;

  // --- GA4 helper: safe even if gtag hasn't loaded yet --------------------
  function track(eventName, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params || {});
      }
    } catch (e) { /* never let analytics break the page */ }
  }

  // --- Microsoft Clarity helpers (safe if Clarity isn't loaded) -----------
  function clarityEvent(name) {
    try { if (typeof window.clarity === "function") window.clarity("event", name); } catch (e) {}
  }
  function clarityTag(name, value) {
    try { if (typeof window.clarity === "function") window.clarity("set", name, String(value)); } catch (e) {}
  }
  // Fire an interaction to BOTH GA4 and Microsoft Clarity in one call.
  function interaction(name, params) {
    track(name, params);
    clarityEvent(name);
  }

  // ============================ 1. PAGEVIEW CONTEXT =======================
  // GA4 already logs the pageview. We add a couple of useful params.
  track("visit_context", {
    referrer: document.referrer || "(direct)",
    screen: window.screen.width + "x" + window.screen.height,
    language: navigator.language
  });

  // ============================ 2. SCROLL DEPTH ===========================
  var marks = [25, 50, 75, 100];
  var hit = {};
  function throttle(fn, wait) {
    var last = 0;
    return function () {
      var now = Date.now();
      if (now - last >= wait) { last = now; fn(); }
    };
  }
  function onScroll() {
    var docH = document.documentElement.scrollHeight;
    var pct = (window.scrollY + window.innerHeight) / docH * 100;
    marks.forEach(function (m) {
      if (!hit[m] && pct >= m) {
        hit[m] = true;
        track("scroll_depth", { percent: m });
      }
    });
  }
  window.addEventListener("scroll", throttle(onScroll, 500), { passive: true });

  // ==================== 3. TIME SPENT PER SECTION =========================
  var sectionTime = {};   // id -> total ms visible
  var sectionEnter = {};  // id -> timestamp when it became >=50% visible
  SECTIONS.forEach(function (id) { sectionTime[id] = 0; });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!sectionEnter[id]) sectionEnter[id] = Date.now();
        } else if (sectionEnter[id]) {
          sectionTime[id] += Date.now() - sectionEnter[id];
          sectionEnter[id] = 0;
        }
      });
    }, { threshold: [0, 0.5, 1] });

    SECTIONS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  function flushAndReport() {
    // close any still-open sections
    Object.keys(sectionEnter).forEach(function (id) {
      if (sectionEnter[id]) {
        sectionTime[id] += Date.now() - sectionEnter[id];
        sectionEnter[id] = 0;
      }
    });
    // find most-viewed section
    var best = null, bestMs = 0;
    SECTIONS.forEach(function (id) {
      var secs = Math.round(sectionTime[id] / 1000);
      if (secs > 0) track("section_time", { section: id, seconds: secs });
      if (sectionTime[id] > bestMs) { bestMs = sectionTime[id]; best = id; }
    });
    if (best) {
      track("most_viewed_section", { section: best, seconds: Math.round(bestMs / 1000) });
    }
    track("engagement_summary", {
      total_seconds: Math.round((Date.now() - pageStart) / 1000),
      max_scroll_percent: Math.max.apply(null, Object.keys(hit).map(Number).concat([0]))
    });
  }

  var pageStart = Date.now();
  var reported = false;
  function endVisit() {
    if (reported) return;
    reported = true;
    flushAndReport();
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") endVisit();
  });
  window.addEventListener("pagehide", endVisit);

  // ==================== 4. CV EMAIL-GATE (Formspree) ======================
  var CV_UNLOCKED_KEY = "pf_cv_unlocked";
  var pendingCvHref = null;

  function isUnlocked() { return localStorage.getItem(CV_UNLOCKED_KEY) === "1"; }

  function doDownload(href) {
    var a = document.createElement("a");
    a.href = href;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Intercept every Download CV button
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest('a[download], a[href$=".pdf"]');
    if (!link) return;

    interaction("cv_download_click", { href: link.getAttribute("href") });
    clarityTag("cv_download", "clicked");

    // If they've already given details, just let it download.
    if (isUnlocked() || FORMSPREE_ID === "YOUR_FORMSPREE_ID") {
      // (If Formspree isn't configured yet, we don't block the download.)
      return;
    }
    e.preventDefault();
    pendingCvHref = link.getAttribute("href");
    openModal();
  });

  // ---- build modal once DOM is ready ----
  var modal, form, statusEl;
  function buildModal() {
    modal = document.createElement("div");
    modal.className = "pf-modal-overlay";
    modal.innerHTML =
      '<div class="pf-modal" role="dialog" aria-modal="true" aria-labelledby="pf-modal-title">' +
        '<button class="pf-modal-close" aria-label="Close">&times;</button>' +
        '<h3 id="pf-modal-title">Get my CV</h3>' +
        '<p>Tell me who you are and I\'ll send you straight to the download.</p>' +
        '<form class="pf-lead-form">' +
          '<input type="text" name="name" placeholder="Your name" required>' +
          '<input type="email" name="email" placeholder="Your email" required>' +
          '<input type="text" name="company" placeholder="Company (optional)">' +
          '<button type="submit" class="pf-submit">Download CV</button>' +
          '<div class="pf-status" aria-live="polite"></div>' +
        '</form>' +
      '</div>';
    document.body.appendChild(modal);

    form = modal.querySelector(".pf-lead-form");
    statusEl = modal.querySelector(".pf-status");

    modal.querySelector(".pf-modal-close").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    form.addEventListener("submit", onLeadSubmit);
  }

  function openModal() {
    if (!modal) buildModal();
    modal.classList.add("open");
    var first = modal.querySelector('input[name="name"]');
    if (first) first.focus();
  }
  function closeModal() {
    if (modal) modal.classList.remove("open");
  }

  function onLeadSubmit(e) {
    e.preventDefault();
    var data = new FormData(form);
    data.append("_subject", "New CV download lead");
    data.append("intent", "cv_download");
    statusEl.textContent = "Sending...";

    fetch(FORMSPREE_URL, {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    }).then(function (res) {
      if (res.ok) {
        localStorage.setItem(CV_UNLOCKED_KEY, "1");
        interaction("cv_lead_captured", {}); // NOTE: no email sent to GA (PII policy)
        statusEl.textContent = "Thanks! Your download is starting...";
        if (pendingCvHref) doDownload(pendingCvHref);
        setTimeout(closeModal, 1200);
      } else {
        statusEl.textContent = "Something went wrong. Please try again.";
      }
    }).catch(function () {
      statusEl.textContent = "Network error. Please try again.";
    });
  }

  // ============= 4b. SOCIAL ICONS + PROJECT TILE CLICK TRACKING ===========
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";

    // Project tiles -> project_open (GA4 + Clarity)
    if (href.indexOf("project-details.html") !== -1) {
      var idMatch = href.match(/id=(\w+)/);
      var id = idMatch ? idMatch[1] : "";
      var h5 = a.querySelector("h5");
      var title = h5 ? h5.textContent.trim() : "";
      interaction("project_open", { id: id, title: title });
      clarityTag("project_open", title || id);
      return;
    }

    // Social / outbound / email icons -> outbound_click (GA4 + Clarity)
    var isExternal = /^https?:\/\//.test(href) && href.indexOf(location.host) === -1;
    var isMail = href.indexOf("mailto:") === 0;
    if (isExternal || isMail) {
      var label = "external";
      if (/github\.com/.test(href)) label = "github";
      else if (/linkedin\.com/.test(href)) label = "linkedin";
      else if (/instagram\.com/.test(href)) label = "instagram";
      else if (isMail) label = "email";
      interaction("outbound_click", { label: label, href: href });
      clarityTag("outbound_click", label);
    }
  });

  // ==================== 5. CONTACT FORM -> Formspree ======================
  function wireContactForm() {
    var contactForm = document.querySelector(".contact-right form");
    if (!contactForm) return;

    contactForm.addEventListener("submit", function (e) {
      interaction("contact_submit", {});
      if (FORMSPREE_ID === "YOUR_FORMSPREE_ID") return; // not configured -> default behavior
      e.preventDefault();

      var data = new FormData(contactForm);
      data.append("_subject", "New contact-form message");
      var btn = contactForm.querySelector('button[type="submit"]');
      var originalText = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

      fetch(FORMSPREE_URL, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      }).then(function (res) {
        if (res.ok) {
          contactForm.reset();
          if (btn) btn.textContent = "Sent!";
        } else if (btn) {
          btn.textContent = "Error - retry";
        }
      }).catch(function () {
        if (btn) btn.textContent = "Error - retry";
      }).finally(function () {
        setTimeout(function () {
          if (btn) { btn.disabled = false; btn.textContent = originalText; }
        }, 2500);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireContactForm);
  } else {
    wireContactForm();
  }
})();
