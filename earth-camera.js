/* =====================================
   EARTH JUKEBOX — CAMERA SEQUENCE
   ===================================== */

window.EarthCamera = (() => {

    let started = false;
    let timers = [];

    function start() {

        if (started) return;
        started = true;

        const intro = document.getElementById("introScreen");

        if (!intro) return;

        // Stage 1: Flying through the galaxy
        intro.classList.add("camera-travel");

        // Stage 2: Earth approaching
        timers.push(setTimeout(() => {
            intro.classList.add("earth-approach");
        }, 4000));

        // Stage 3: Prepare dashboard transition
        timers.push(setTimeout(() => {
            intro.classList.add("arrival-complete");
        }, 9000));

    }

    function reset() {

        timers.forEach(clearTimeout);
        timers = [];
        started = false;

        const intro = document.getElementById("introScreen");

        if (intro) {
            intro.classList.remove(
                "camera-travel",
                "earth-approach",
                "arrival-complete"
            );
        }

    }

    return {
        start,
        reset
    };

})();