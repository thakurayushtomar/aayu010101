/* =====================================
   EARTH JUKEBOX — CINEMATIC INTRO
   ===================================== */

const Intro = (() => {

    let started = false;

    const introScreen = document.getElementById("introScreen");
    const skipButton = document.getElementById("skipIntro");
    const mainWebsite = document.getElementById("mainWebsite");

    function start() {

        if (started || !introScreen) return;

        started = true;

        introScreen.classList.add("intro-active");

        // Begin cinematic camera journey
        if (window.Galaxy && window.Galaxy.start) {
            window.Galaxy.start();
        }

        if (window.EarthCamera && window.EarthCamera.start) {
            window.EarthCamera.start();
        }

        // Finish intro after cinematic sequence
        setTimeout(finish, 11000);
    }

    function finish() {

        if (!introScreen) return;

        introScreen.classList.add("intro-finished");

        setTimeout(() => {

            introScreen.style.display = "none";

            if (mainWebsite) {
                mainWebsite.classList.add("website-visible");
            }

        }, 1500);
    }

    function skip() {
        finish();
    }

    if (skipButton) {
        skipButton.addEventListener("click", skip);
    }

    return {
        start,
        finish,
        skip
    };

})();

window.Intro = Intro;

// Start after page loads
window.addEventListener("load", () => {
    Intro.start();
});