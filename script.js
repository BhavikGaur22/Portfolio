
document.addEventListener("DOMContentLoaded", function () {

    new Typed("#text", {
        strings: ["Data Engineer", "Data Scientist", "AI Engineer"],
        typeSpeed: 150,
        backSpeed: 50,
        backDelay: 2000,
        loop: true
    });

    const aboutLink = document.querySelector('a[href="#about"]');
    const aboutSection = document.getElementById('about');

    if (aboutLink) {
        aboutLink.addEventListener('click', function(event) {
            event.preventDefault();
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

});
