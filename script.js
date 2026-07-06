
console.log("SCRIPT LOADED");

document.addEventListener("DOMContentLoaded", function () {

    console.log("DOM READY");

    new Typed("#text", {
        strings: ["Data Engineer", "Data Scientist", "AI Engineer"],
        typeSpeed: 50,
        backSpeed: 50,
        backDelay: 2000,
        loop: true
    });

});
