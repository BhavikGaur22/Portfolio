
document.addEventListener("DOMContentLoaded", function () {

    new Typed("#text", {
        strings: ["a Data Engineer", "a Data Scientist", "an AI Engineer"],
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

    // ---- Smooth scroll for in-page nav links + close mobile menu ----
    navLinks.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href && href.length > 1 && href.charAt(0) === '#') {
            link.addEventListener('click', function (event) {
                const target = document.querySelector(href);
                if (target) {
                    event.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                // close menu on mobile after choosing
                if (navbar) navbar.classList.remove('open');
                if (menuIcon) menuIcon.classList.remove('fa-xmark');
            });
        }
    });

    // ---- Scroll-spy: highlight the nav link for the section in view ----
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
        const headerH = header ? header.offsetHeight : 0;
        const pos = window.scrollY + headerH + 50;
        let current = sections.length ? sections[0] : null;

        sections.forEach(function (item) {
            if (item.sec.offsetTop <= pos) current = item;
        });

        navLinks.forEach(function (l) { l.classList.remove('active'); });
        if (current) current.link.classList.add('active');
    }

    if (sections.length) {
        setActive();
        window.addEventListener('scroll', setActive, { passive: true });
    }

});
