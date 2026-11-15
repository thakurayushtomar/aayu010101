/* ==========================================
   EARTH JUKEBOX — 3D GALAXY & EARTH ENGINE
   ========================================== */

window.Galaxy = (() => {

    let scene, camera, renderer;
    let earth, stars, atmosphere;
    let animationId;
    let startTime = null;

    const EARTH_Z = -12;
    const INTRO_DURATION = 11000;

    function createGalaxyBackground() {

        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;

        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(
            0, 0, 1024, 512
        );

        gradient.addColorStop(0, "#020313");
        gradient.addColorStop(0.5, "#10103c");
        gradient.addColorStop(1, "#030518");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 512);

        // Nebula clouds
        const colors = [
            "rgba(75, 45, 180, 0.20)",
            "rgba(25, 105, 210, 0.20)",
            "rgba(150, 45, 190, 0.15)",
            "rgba(30, 150, 190, 0.12)"
        ];

        colors.forEach((color, i) => {

            const x = 180 + i * 220;
            const y = 150 + (i % 2) * 180;

            const glow = ctx.createRadialGradient(
                x, y, 10, x, y, 260
            );

            glow.addColorStop(0, color);
            glow.addColorStop(1, "transparent");

            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, 1024, 512);

        });

        const texture = new THREE.CanvasTexture(canvas);

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const nebula = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 55),
            material
        );

        nebula.position.z = -35;
        scene.add(nebula);

    }

    function createStars() {

        const geometry = new THREE.BufferGeometry();

        const count = 9000;
        const positions = [];

        for (let i = 0; i < count; i++) {

            positions.push(
                (Math.random() - 0.5) * 180,
                (Math.random() - 0.5) * 100,
                -Math.random() * 180
            );

        }

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
        );

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.13,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        stars = new THREE.Points(geometry, material);

        scene.add(stars);

    }

    function createEarth() {

        const geometry = new THREE.SphereGeometry(2.6, 96, 96);

        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 15
        });

        earth = new THREE.Mesh(geometry, material);

        earth.position.set(0, 0, EARTH_Z);

        scene.add(earth);

        // Load realistic Earth texture
        const loader = new THREE.TextureLoader();

        loader.load(
            "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",

            texture => {
                texture.encoding = THREE.sRGBEncoding;
                material.map = texture;
                material.needsUpdate = true;
            },

            undefined,

            error => {
                console.warn("Earth texture could not load:", error);
                material.color.set("#1766a8");
            }
        );

        // Blue atmospheric glow
        const atmosphereGeometry = new THREE.SphereGeometry(
            2.72, 64, 64
        );

        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x328dff,
            transparent: true,
            opacity: 0.19,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });

        atmosphere = new THREE.Mesh(
            atmosphereGeometry,
            atmosphereMaterial
        );

        atmosphere.position.copy(earth.position);

        scene.add(atmosphere);

    }

    function start() {

        const canvas = document.getElementById("galaxyCanvas");

        if (!canvas || renderer) return;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        camera.position.set(0, 0, 5);

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 1.75)
        );

        renderer.outputEncoding = THREE.sRGBEncoding;

        // Space lighting
        const ambient = new THREE.AmbientLight(
            0xffffff, 1.1
        );

        scene.add(ambient);

        const sunlight = new THREE.DirectionalLight(
            0xffffff, 2
        );

        sunlight.position.set(-5, 3, 8);

        scene.add(sunlight);

        createGalaxyBackground();
        createStars();
        createEarth();

        startTime = performance.now();

        animate();

        window.addEventListener("resize", resize);

    }

    function animate() {

        animationId = requestAnimationFrame(animate);

        const elapsed = performance.now() - startTime;

        // Smooth cinematic camera journey
        const progress = Math.min(
            elapsed / INTRO_DURATION, 1
        );

        const smooth = progress * progress *
            (3 - 2 * progress);

        camera.position.z = 5 - (9.5 * smooth);

        // Earth rotation
        if (earth) {
            earth.rotation.y += 0.0008;
        }

        // Atmosphere rotation
        if (atmosphere) {
            atmosphere.rotation.y += 0.0008;
        }

        // Moving galaxy
        if (stars) {
            stars.rotation.z += 0.00004;
        }

        renderer.render(scene, camera);

    }

    function resize() {

        if (!camera || !renderer) return;

        camera.aspect =
            window.innerWidth / window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }

    function stop() {

        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        animationId = null;

    }

    return {
        start,
        stop
    };

})();