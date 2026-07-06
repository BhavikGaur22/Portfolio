console.log("SCRIPT LOADED");
var typed = new Typed("#text", {
    strings: ["BHAVIK TEST"],
    typeSpeed: 50,
    backSpeed: 50,
    backDelay: 2000,
    loop: true
});

const aboutLink = document.querySelector('a[href="#about"]');
const aboutSection = document.getElementById('about');

aboutLink.addEventListener('click', function(event) {
    event.preventDefault();
    aboutSection.scrollIntoView({ behavior: 'smooth' });
});
