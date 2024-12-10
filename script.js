var typed=new Typed("#text", { 
strings: ["Web Developer","Frontend Developer"],
typeSpeed:50,
backSpeed:50,
backDelay: 2000,
loop:true
});

// Select the About link in the navigation
const aboutLink = document.querySelector('a[href="#about"]');

// Select the About section
const aboutSection = document.getElementById('about');

// Smooth scroll to the About section when the link is clicked
aboutLink.addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default link behavior
    aboutSection.scrollIntoView({ behavior: 'smooth' });
});
