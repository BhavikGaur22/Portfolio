
document.addEventListener("DOMContentLoaded", function () {

    new Typed("#text", {
        strings: ["an AI Engineer", "a Data Engineer", "a Data Scientist"],
        typeSpeed: 150,
        backSpeed: 50,
        backDelay: 2000,
        loop: true
    });

    const header = document.querySelector('.header');
    const menuIcon = document.getElementById('menu-icon');
    const navbar = document.querySelector('.navbar');
    const navLinks = Array.from(document.querySelectorAll('.navbar a'));

    // ---- Mobile menu toggle ----
    if (menuIcon && navbar) {
        menuIcon.addEventListener('click', function () {
            menuIcon.classList.toggle('fa-xmark');
            navbar.classList.toggle('open');
        });
    }

    // ---- Navigation: single source of truth for scroll offset + active tab ----
    let programmatic = false;        // true only while a click-triggered scroll runs
    let programmaticTimer = null;

    // The one offset used BOTH for scrolling to a section AND for the scroll-spy,
    // so the section that lands under the header is exactly the one highlighted.
    function navOffset() {
        return header ? header.offsetHeight : 70;
    }

    function setActiveLink(link) {
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        if (link) link.classList.add('active');
    }

    function goToSection(link, target) {
        setActiveLink(link);         // activate immediately and hold it
        programmatic = true;
        clearTimeout(programmaticTimer);
        programmaticTimer = setTimeout(endProgrammatic, 1200); // fallback if scrollend unsupported
        var top = Math.max(0, target.offsetTop - navOffset());
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function endProgrammatic() {
        clearTimeout(programmaticTimer);
        programmatic = false;
        setActive();                 // reconcile with final scroll position
    }

    // ---- Nav link clicks: smooth scroll + immediate, persistent highlight ----
    navLinks.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href && href.length > 1 && href.charAt(0) === '#') {
            link.addEventListener('click', function (event) {
                const target = document.querySelector(href);
                if (target) {
                    event.preventDefault();
                    goToSection(link, target);
                }
                // close menu on mobile after choosing
                if (navbar) navbar.classList.remove('open');
                if (menuIcon) menuIcon.classList.remove('fa-xmark');
            });
        }
    });

    // ---- Prevent bare "#" links from jumping to the top of the page ----
    document.querySelectorAll('a[href="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); });
    });

    // ---- About "Read more" expand/collapse + analytics ----
    const readMoreBtn = document.getElementById('read-more-btn');
    const aboutMore = document.getElementById('about-more');
    if (readMoreBtn && aboutMore) {
        readMoreBtn.addEventListener('click', function () {
            const expanded = aboutMore.classList.toggle('open');
            readMoreBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            readMoreBtn.textContent = expanded ? 'Read less' : 'Read more';

            // Google Analytics (gtag)
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'about_read_more', {
                    action: expanded ? 'expand' : 'collapse'
                });
            }
            // Microsoft Clarity custom event/tag (if present)
            if (typeof window.clarity === 'function') {
                window.clarity('event', expanded ? 'about_read_more_expand' : 'about_read_more_collapse');
                window.clarity('set', 'about_read_more', expanded ? 'expanded' : 'collapsed');
            }
        });
    }

    // ---- Scroll-spy: keep the correct tab active during manual scrolling ----
    const sections = navLinks
        .map(function (link) {
            const href = link.getAttribute('href');
            if (href && href.length > 1 && href.charAt(0) === '#') {
                const sec = document.querySelector(href);
                return sec ? { link: link, sec: sec } : null;
            }
            return null;
        })
        .filter(Boolean);

    function setActive() {
        if (!sections.length) return;
        // Same offset the click-scroll uses -> the section that lands under the
        // header is exactly the one we highlight (no off-by-one).
        const pos = window.scrollY + navOffset() + 5;
        let current = sections[0];
        sections.forEach(function (item) {
            if (item.sec.offsetTop <= pos) current = item;
        });
        // At the very bottom, force the last section (it may not reach the top).
        if ((window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 2)) {
            current = sections[sections.length - 1];
        }
        setActiveLink(current.link);
    }

    if (sections.length) {
        setActive();

        // While a click-scroll is running we HOLD the clicked tab (no flicker).
        window.addEventListener('scroll', function () {
            if (programmatic) return;
            setActive();
        }, { passive: true });

        // Finish programmatic mode as soon as the smooth scroll settles…
        if ('onscrollend' in window) {
            window.addEventListener('scrollend', function () {
                if (programmatic) endProgrammatic();
            });
        }
        // …or the instant the user takes over (wheel / touch / keyboard).
        ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
            window.addEventListener(ev, function () {
                if (programmatic) endProgrammatic();
            }, { passive: true });
        });

        // Recompute after full load and on resize (offsets/heights can change).
        window.addEventListener('load', setActive);
        window.addEventListener('resize', function () {
            if (!programmatic) setActive();
        });
    }

});
