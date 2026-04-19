/**
 * world.js — Three.js Forest Scene
 * Forest Portfolio — Full cinematic experience
 */
(function () {
    'use strict';

    /* ────────────────────────────────────────────────────────
       1. RENDERER & CAMERA
    ──────────────────────────────────────────────────────── */
    const canvas = document.getElementById('three-canvas');
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    try { renderer.outputEncoding = THREE.sRGBEncoding; } catch (e) {}

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, W() / H(), 0.1, 1200);

    /* Start above clouds for cinematic descent */
    camera.position.set(0, 130, 40);
    camera.lookAt(0, 50, 0);

    /* ────────────────────────────────────────────────────────
       2. SEASON DETECTION
    ──────────────────────────────────────────────────────── */
    function detectSeason() {
        const m = new Date().getMonth();
        if (m >= 2 && m <= 4) return 'spring';
        if (m >= 5 && m <= 7) return 'summer';
        if (m >= 8 && m <= 10) return 'fall';
        return 'winter';
    }

    const SEASON = detectSeason();
    document.body.classList.add('season-' + SEASON);

    const SEASONS = {
        spring: {
            fogColor: 0xc2dfc4,  fogDensity: 0.012,
            skyTop: 0x87ceeb,   skyBottom: 0xbde5be,
            groundColor: 0x4a7c3f,
            leafColors: [0x6abf69, 0x81c784, 0xf8bbd0, 0xfce4ec, 0xa5d6a7],
            trunkColor: 0x4a3728,
            sunColor: 0xfffde7,  ambientColor: 0xd4e8d4, ambientInt: 0.65,
            sunInt: 1.6, hemiSky: 0x90cbe8, hemiGround: 0x4a7c3f,
            badge: '🌸 Spring'
        },
        summer: {
            fogColor: 0x8fc48a,  fogDensity: 0.01,
            skyTop: 0x1e90ff,   skyBottom: 0x72bb6e,
            groundColor: 0x2e6b2a,
            leafColors: [0x2e7d32, 0x388e3c, 0x43a047, 0x66bb6a, 0x81c784],
            trunkColor: 0x4e3b2a,
            sunColor: 0xfff9e6,  ambientColor: 0xc8e6c9, ambientInt: 0.7,
            sunInt: 1.9, hemiSky: 0x1e90ff, hemiGround: 0x3a6b2f,
            badge: '☀️ Summer'
        },
        fall: {
            fogColor: 0xc0845a,  fogDensity: 0.018,
            skyTop: 0xb07820,   skyBottom: 0xd4944a,
            groundColor: 0x4a3018,
            leafColors: [0xe67e22, 0xe74c3c, 0xf39c12, 0xd35400, 0xc0392b, 0xf1c40f],
            trunkColor: 0x3e2410,
            sunColor: 0xffe0b2,  ambientColor: 0xd4a060, ambientInt: 0.5,
            sunInt: 1.3, hemiSky: 0xb07820, hemiGround: 0x4a3018,
            badge: '🍁 Fall'
        },
        winter: {
            fogColor: 0xcbd8e8,  fogDensity: 0.022,
            skyTop: 0x546e7a,   skyBottom: 0x90a4ae,
            groundColor: 0xdce8f0,
            leafColors: [0xb0bec5, 0x90a4ae, 0xcfd8dc, 0xe0e0e0, 0xffffff],
            trunkColor: 0x5a4a3a,
            sunColor: 0xe8f4fb,  ambientColor: 0xc5d8e8, ambientInt: 0.4,
            sunInt: 1.0, hemiSky: 0x546e7a, hemiGround: 0x90a4ae,
            badge: '❄️ Winter'
        }
    };

    const SC = SEASONS[SEASON];

    const seasonBadge = document.getElementById('season-badge');
    if (seasonBadge) seasonBadge.textContent = SC.badge;

    /* ────────────────────────────────────────────────────────
       3. SCENE ATMOSPHERE
    ──────────────────────────────────────────────────────── */
    scene.fog = new THREE.FogExp2(SC.fogColor, SC.fogDensity);
    renderer.setClearColor(SC.fogColor, 1);

    /* ────────────────────────────────────────────────────────
       4. LIGHTING
    ──────────────────────────────────────────────────────── */
    const ambientLight = new THREE.AmbientLight(SC.ambientColor, SC.ambientInt);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(SC.hemiSky, SC.hemiGround, 0.55);
    scene.add(hemisphereLight);

    const sunLight = new THREE.DirectionalLight(SC.sunColor, SC.sunInt);
    sunLight.position.set(60, 100, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 600;
    sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.camera.right = sunLight.shadow.camera.top = 120;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const moonLight = new THREE.DirectionalLight(0x8aafd4, 0.9);
    moonLight.position.set(-60, 90, -30);
    moonLight.intensity = 0;
    scene.add(moonLight);

    /* ────────────────────────────────────────────────────────
       5. SKY DOME  (gradient shader)
    ──────────────────────────────────────────────────────── */
    const skyUniforms = {
        uTop:    { value: new THREE.Color(SC.skyTop) },
        uBottom: { value: new THREE.Color(SC.skyBottom) },
        uOffset: { value: 0.25 }
    };

    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(600, 32, 32),
        new THREE.ShaderMaterial({
            uniforms: skyUniforms,
            vertexShader: `
                varying vec3 vWorldPos;
                void main() {
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vWorldPos = wp.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }`,
            fragmentShader: `
                uniform vec3 uTop;
                uniform vec3 uBottom;
                uniform float uOffset;
                varying vec3 vWorldPos;
                void main() {
                    float h = normalize(vWorldPos).y;
                    vec3 col = mix(uBottom, uTop, clamp(h + uOffset, 0.0, 1.0));
                    gl_FragColor = vec4(col, 1.0);
                }`,
            side: THREE.BackSide,
            depthWrite: false
        })
    );
    scene.add(sky);

    /* Sun & Moon spheres */
    const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(4, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xfff5a0 })
    );
    sunMesh.position.set(60, 120, -200);
    scene.add(sunMesh);

    const moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(3, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xddeeff })
    );
    moonMesh.position.set(-80, 110, -200);
    moonMesh.visible = false;
    scene.add(moonMesh);

    /* ────────────────────────────────────────────────────────
       6. GROUND
    ──────────────────────────────────────────────────────── */
    const gGeo = new THREE.PlaneGeometry(500, 500, 60, 60);
    const gPos = gGeo.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
        const x = gPos.getX(i), z = gPos.getZ(i);
        const h = Math.sin(x * 0.07) * 1.8
                + Math.cos(z * 0.05) * 1.4
                + Math.sin(x * 0.18 + z * 0.12) * 0.6
                + Math.sin(x * 0.4 + z * 0.35) * 0.2;
        gPos.setY(i, h);
    }
    gGeo.computeVertexNormals();

    const gColor = SEASON === 'winter' ? 0xdde8f0
                 : SEASON === 'fall'   ? 0x4a3018
                 : SC.groundColor;

    const ground = new THREE.Mesh(gGeo, new THREE.MeshStandardMaterial({
        color: gColor, roughness: 0.96, metalness: 0
    }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.5;
    ground.receiveShadow = true;
    scene.add(ground);

    /* ────────────────────────────────────────────────────────
       7. TREES
    ──────────────────────────────────────────────────────── */
    const trunkMat = new THREE.MeshStandardMaterial({ color: SC.trunkColor, roughness: 0.95 });

    function makeTree(x, z, s, leafIdx) {
        const g = new THREE.Group();
        g.position.set(x, -2.5, z);

        // Trunk
        const tH = (3.5 + Math.random() * 4) * s;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14 * s, 0.28 * s, tH, 7),
            trunkMat
        );
        trunk.position.y = tH / 2;
        trunk.castShadow = true;
        g.add(trunk);

        // Canopy (stacked cones for layered NE-US look)
        const lc = SC.leafColors[leafIdx % SC.leafColors.length];
        const lMat = new THREE.MeshStandardMaterial({ color: lc, roughness: 0.88 });
        const layers = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < layers; i++) {
            const r  = (2.2 - i * 0.25 + Math.random() * 0.5) * s;
            const ch = (2.8 - i * 0.2  + Math.random() * 0.8) * s;
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(r, ch, 8 + Math.floor(Math.random() * 3)),
                lMat.clone()
            );
            cone.position.y = tH + i * ch * 0.6 + ch * 0.35;
            cone.rotation.y = Math.random() * Math.PI;
            cone.castShadow = true;
            g.add(cone);
        }

        g.rotation.y = Math.random() * Math.PI * 2;
        return g;
    }

    const treeGroup = new THREE.Group();

    // Dense forest on sides, path down the middle
    for (let i = 0; i < 160; i++) {
        const side   = (Math.random() > 0.5 ? 1 : -1);
        const spread = 6 + Math.random() * 65;
        const x      = side * spread;
        const z      = (Math.random() - 0.5) * 280;
        const s      = 0.65 + Math.random() * 0.9;
        const ci     = Math.floor(Math.random() * SC.leafColors.length);
        treeGroup.add(makeTree(x, z, s, ci));
    }

    // Some scattered trees on the path for realism
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 8;
        const z = -50 - Math.random() * 200;
        treeGroup.add(makeTree(x, z, 0.5 + Math.random() * 0.4, 0));
    }

    scene.add(treeGroup);

    /* ────────────────────────────────────────────────────────
       8. ROCKS & GROUND DETAILS
    ──────────────────────────────────────────────────────── */
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.95 });
    for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 240;
        const s = 0.15 + Math.random() * 0.9;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
        rock.position.set(x, -2.5 + s * 0.5, z);
        rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    }

    /* ────────────────────────────────────────────────────────
       9. WATER (Custom shader)
    ──────────────────────────────────────────────────────── */
    const waterUniforms = {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color(SEASON === 'winter' ? 0x7a9dba : 0x1e6b8c) }
    };

    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(28, 24, 24, 24),
        new THREE.ShaderMaterial({
            uniforms: waterUniforms,
            transparent: true,
            side: THREE.DoubleSide,
            vertexShader: `
                uniform float uTime;
                varying vec2  vUv;
                void main() {
                    vUv = uv;
                    vec3 p = position;
                    p.z += sin(p.x * 0.6 + uTime * 1.2) * 0.12
                         + cos(p.y * 0.4 + uTime * 0.9) * 0.08;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
                }`,
            fragmentShader: `
                uniform float uTime;
                uniform vec3  uColor;
                varying vec2  vUv;
                void main() {
                    vec2 uv = vUv * 10.0;
                    float c1 = sin(uv.x * 2.0 + uTime * 0.6) * 0.5 + 0.5;
                    float c2 = cos(uv.y * 1.5 + uTime * 0.4) * 0.5 + 0.5;
                    vec3  col = uColor + (c1 * c2) * 0.18;
                    float edge = smoothstep(0.0, 0.1, vUv.x)
                               * smoothstep(0.0, 0.1, vUv.y)
                               * smoothstep(0.0, 0.1, 1.0 - vUv.x)
                               * smoothstep(0.0, 0.1, 1.0 - vUv.y);
                    gl_FragColor = vec4(col, 0.72 * edge);
                }`
        })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(10, -2.0, -60);
    scene.add(water);

    /* ────────────────────────────────────────────────────────
       10. CLOUDS
    ──────────────────────────────────────────────────────── */
    function makeCloud(x, y, z, s) {
        const g = new THREE.Group();
        const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, roughness: 1 });
        const puffs = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < puffs; i++) {
            const r = (1.4 + Math.random() * 2.0) * s;
            const m = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), cm.clone());
            m.position.set((Math.random() - 0.5) * 8 * s, (Math.random() - 0.3) * 2 * s, (Math.random() - 0.5) * 5 * s);
            g.add(m);
        }
        g.position.set(x, y, z);
        return g;
    }

    const cloudGroup = new THREE.Group();
    // High clouds for intro descent
    for (let i = 0; i < 22; i++) {
        cloudGroup.add(makeCloud(
            (Math.random() - 0.5) * 250,
            55 + Math.random() * 40,
            (Math.random() - 0.5) * 250,
            1.0 + Math.random() * 1.6
        ));
    }
    // Lower atmospheric clouds
    for (let i = 0; i < 12; i++) {
        cloudGroup.add(makeCloud(
            (Math.random() - 0.5) * 180,
            22 + Math.random() * 14,
            -80 - Math.random() * 180,
            0.7 + Math.random() * 0.9
        ));
    }
    scene.add(cloudGroup);

    /* ────────────────────────────────────────────────────────
       11. SEASONAL PARTICLES (leaves / petals / snow)
    ──────────────────────────────────────────────────────── */
    const PART_COUNT = 700;
    const pPos = new Float32Array(PART_COUNT * 3);
    const pVel = [];

    const particleColors = {
        spring: 0xf8bbd0, summer: 0xa8d5a2,
        fall:   0xe67e22, winter: 0xffffff
    };

    for (let i = 0; i < PART_COUNT; i++) {
        pPos[i * 3]     = (Math.random() - 0.5) * 80;
        pPos[i * 3 + 1] = Math.random() * 25 + 2;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        pVel.push({
            vx: (Math.random() - 0.5) * 0.025,
            vy: -(0.018 + Math.random() * 0.04),
            vz: (Math.random() - 0.5) * 0.018,
            wb: Math.random() * Math.PI * 2,
            ws: 0.015 + Math.random() * 0.03
        });
    }

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const particlesMat = new THREE.PointsMaterial({
        color: particleColors[SEASON],
        size: SEASON === 'winter' ? 0.22 : 0.16,
        transparent: true,
        opacity: 0.82,
        sizeAttenuation: true
    });
    const particles = new THREE.Points(partGeo, particlesMat);
    scene.add(particles);

    /* ────────────────────────────────────────────────────────
       12. RAIN PARTICLES
    ──────────────────────────────────────────────────────── */
    const RAIN_COUNT = 2500;
    const rPos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
        rPos[i * 3]     = (Math.random() - 0.5) * 80;
        rPos[i * 3 + 1] = Math.random() * 40;
        rPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
    const rainMat = new THREE.PointsMaterial({
        color: 0x99ccee, size: 0.08, transparent: true, opacity: 0, sizeAttenuation: true
    });
    const rain = new THREE.Points(rainGeo, rainMat);
    scene.add(rain);

    /* ────────────────────────────────────────────────────────
       13. FIREFLIES
    ──────────────────────────────────────────────────────── */
    const FF_COUNT = 70;
    const ffPos  = new Float32Array(FF_COUNT * 3);
    const ffData = [];
    for (let i = 0; i < FF_COUNT; i++) {
        ffPos[i * 3]     = (Math.random() - 0.5) * 60;
        ffPos[i * 3 + 1] = 0.4 + Math.random() * 7;
        ffPos[i * 3 + 2] = (Math.random() - 0.5) * 100;
        ffData.push({
            bx: ffPos[i * 3], by: ffPos[i * 3 + 1], bz: ffPos[i * 3 + 2],
            ph: Math.random() * Math.PI * 2,
            sp: 0.25 + Math.random() * 0.55,
            r:  0.8 + Math.random() * 2.2,
            bp: Math.random() * Math.PI * 2
        });
    }
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    const ffMat = new THREE.PointsMaterial({
        color: 0x88ff44, size: 0.45, transparent: true, opacity: 0, sizeAttenuation: true
    });
    const fireflies = new THREE.Points(ffGeo, ffMat);
    scene.add(fireflies);

    /* ────────────────────────────────────────────────────────
       14. STATE
    ──────────────────────────────────────────────────────── */
    let time          = 0;
    let introProgress = 0;        // 0→1
    let introDone     = false;
    let scrollY       = 0;
    let scrollMax     = 1;
    let nightLerp     = 0;        // 0=day, 1=night
    let nightTarget   = 0;
    let isNight       = false;

    const NIGHT = {
        ambientColor: 0x0a1020, ambientInt: 0.12,
        skyTop: 0x020812, skyBottom: 0x0a1018,
        fogColor: 0x060810, sunInt: 0, moonInt: 0.85
    };

    /* ────────────────────────────────────────────────────────
       15. LOADING & INTRO ANIMATION
    ──────────────────────────────────────────────────────── */
    const progressEl = document.getElementById('loading-progress');
    let loadVal = 0;
    const loadInterval = setInterval(() => {
        loadVal += 8 + Math.random() * 14;
        if (loadVal >= 100) {
            loadVal = 100;
            clearInterval(loadInterval);
            if (progressEl) progressEl.style.width = '100%';
            setTimeout(doReveal, 600);
        }
        if (progressEl) progressEl.style.width = Math.min(loadVal, 99) + '%';
    }, 120);

    function doReveal() {
        const ls = document.getElementById('loading-screen');
        if (ls) {
            ls.classList.add('fade-out');
            setTimeout(() => { ls.style.display = 'none'; }, 900);
        }

        // Fade in HUD after a beat
        setTimeout(() => {
            const nav = document.getElementById('main-nav');
            const cs  = document.getElementById('control-strip');
            const eb  = document.getElementById('env-badge-wrap');
            if (nav) nav.style.opacity = '1';
            if (cs)  cs.style.opacity  = '1';
            if (eb)  eb.style.opacity  = '1';
        }, 3200);

        // Animate hero content
        setTimeout(() => {
            const hc = document.getElementById('hero-content');
            if (hc) hc.style.opacity = '1';
            const sh = document.getElementById('scroll-hint');
            if (sh) sh.style.opacity = '1';
        }, 3500);

        startIntro();
    }

    function startIntro() {
        if (typeof gsap === 'undefined') {
            // Fallback – skip straight to final position
            camera.position.set(0, 4, 30);
            camera.lookAt(0, 1, 10);
            introDone = true;
            return;
        }

        gsap.to(camera.position, {
            x: 0, y: 3.5, z: 30,
            duration: 5.5,
            ease: 'power3.inOut',
            onUpdate: () => {
                const p = Math.min((5.5 - gsap.getProperty(camera, 'y') / 100), 1);
                introProgress = p;
                const lx = THREE.MathUtils.lerp(0, 0, p);
                const ly = THREE.MathUtils.lerp(60, 1, p);
                const lz = THREE.MathUtils.lerp(0, 10, p);
                camera.lookAt(lx, ly, lz);
            },
            onComplete: () => {
                introDone = true;
            }
        });
    }

    /* ────────────────────────────────────────────────────────
       16. SCROLL
    ──────────────────────────────────────────────────────── */
    window.addEventListener('scroll', () => {
        scrollY   = window.scrollY;
        scrollMax = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    }, { passive: true });

    /* ────────────────────────────────────────────────────────
       17. INTERSECTION OBSERVER — section reveals
    ──────────────────────────────────────────────────────── */
    const panels = document.querySelectorAll('.glass-panel');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('visible');
        });
    }, { threshold: 0.18 });
    panels.forEach(p => io.observe(p));

    // Skill bars
    const skillBars = document.querySelectorAll('.skill-bar');
    const sio = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const w = e.target.dataset.w || 0;
                e.target.style.width = w + '%';
                sio.unobserve(e.target);
            }
        });
    }, { threshold: 0.4 });
    skillBars.forEach(b => sio.observe(b));

    /* ────────────────────────────────────────────────────────
       18. DAY / NIGHT TOGGLE (exposed via window.forestScene)
    ──────────────────────────────────────────────────────── */
    function toggleDayNight() {
        isNight     = !isNight;
        nightTarget = isNight ? 1 : 0;
        document.body.classList.toggle('night-mode', isNight);
    }

    /* ────────────────────────────────────────────────────────
       19. ANIMATION LOOP
    ──────────────────────────────────────────────────────── */
    let camX = 0, camY = 4, camZ = 30;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;

        /* — Scroll-driven camera —————————————————————— */
        if (introDone) {
            const t  = scrollY / scrollMax;      // 0→1
            const tz = 30 - t * 200;             // approach deep forest
            const ty = 3.5 + Math.sin(t * Math.PI) * 4;
            const tx = Math.sin(t * Math.PI * 1.8) * 3;

            camX += (tx - camX) * 0.04;
            camY += (ty - camY) * 0.04;
            camZ += (tz - camZ) * 0.04;

            camera.position.set(camX, camY, camZ);
            camera.lookAt(camX * 0.15, 1.2, camZ - 18);
        }

        /* — Day / Night lerp ─────────────────────────── */
        nightLerp += (nightTarget - nightLerp) * 0.018;
        const nl = nightLerp;

        // Lights
        sunLight.intensity  = SC.sunInt  * (1 - nl);
        moonLight.intensity = 0.9        * nl;
        ambientLight.intensity = THREE.MathUtils.lerp(SC.ambientInt, NIGHT.ambientInt, nl);
        ambientLight.color.set(new THREE.Color().lerpColors(
            new THREE.Color(SC.ambientColor), new THREE.Color(NIGHT.ambientColor), nl
        ));

        // Sky
        skyUniforms.uTop.value.lerpColors(
            new THREE.Color(SC.skyTop), new THREE.Color(NIGHT.skyTop), nl
        );
        skyUniforms.uBottom.value.lerpColors(
            new THREE.Color(SC.skyBottom), new THREE.Color(NIGHT.skyBottom), nl
        );

        // Fog
        const fc = new THREE.Color().lerpColors(
            new THREE.Color(SC.fogColor), new THREE.Color(NIGHT.fogColor), nl
        );
        scene.fog.color.copy(fc);
        renderer.setClearColor(fc, 1);

        // Sun / Moon objects
        sunMesh.visible  = nl < 0.55;
        moonMesh.visible = nl > 0.25;

        // Tone
        renderer.toneMappingExposure = THREE.MathUtils.lerp(1.1, 0.6, nl);

        /* — Fireflies ────────────────────────────────── */
        ffMat.opacity = Math.max(nl - 0.15, 0) * 1.1;
        if (nl > 0.1) {
            const fa = ffGeo.attributes.position.array;
            for (let i = 0; i < FF_COUNT; i++) {
                const d = ffData[i];
                const t2 = time * d.sp + d.ph;
                fa[i * 3]     = d.bx + Math.sin(t2) * d.r;
                fa[i * 3 + 1] = d.by + Math.sin(t2 * 1.6) * 0.8;
                fa[i * 3 + 2] = d.bz + Math.cos(t2 * 0.75) * d.r;
            }
            ffGeo.attributes.position.needsUpdate = true;
            ffMat.size = 0.3 + (Math.sin(time * 1.8) * 0.5 + 0.5) * 0.25 * nl;
        }

        /* — Seasonal particles ───────────────────────── */
        for (let i = 0; i < PART_COUNT; i++) {
            const v = pVel[i];
            v.wb += v.ws;
            pPos[i * 3]     += v.vx + Math.sin(v.wb) * 0.008;
            pPos[i * 3 + 1] += v.vy + (SEASON === 'winter' ? 0 : Math.cos(v.wb * 0.7) * 0.004);
            pPos[i * 3 + 2] += v.vz;
            if (pPos[i * 3 + 1] < -3) {
                pPos[i * 3]     = camera.position.x + (Math.random() - 0.5) * 60;
                pPos[i * 3 + 1] = camera.position.y + 18 + Math.random() * 8;
                pPos[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 60;
            }
        }
        partGeo.attributes.position.needsUpdate = true;

        /* — Rain ─────────────────────────────────────── */
        if (rainMat.opacity > 0.01) {
            const ra = rainGeo.attributes.position.array;
            for (let i = 0; i < RAIN_COUNT; i++) {
                ra[i * 3]     += 0.06;
                ra[i * 3 + 1] -= 0.55;
                if (ra[i * 3 + 1] < -3) {
                    ra[i * 3]     = camera.position.x + (Math.random() - 0.5) * 70;
                    ra[i * 3 + 1] = camera.position.y + 22;
                    ra[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 70;
                }
            }
            rainGeo.attributes.position.needsUpdate = true;
        }

        /* — Water ────────────────────────────────────── */
        waterUniforms.uTime.value = time;

        /* — Clouds drift ─────────────────────────────── */
        for (let i = 0; i < cloudGroup.children.length; i++) {
            const cl = cloudGroup.children[i];
            cl.position.x += 0.006 * (1 + (i % 4) * 0.25);
            cl.position.y += Math.sin(time * 0.15 + i * 0.4) * 0.003;
            if (cl.position.x > 140) cl.position.x = -140;
        }

        /* — Tree sway ────────────────────────────────── */
        for (let i = 0; i < treeGroup.children.length; i++) {
            const tr = treeGroup.children[i];
            const sw = 0.0025 + (SEASON === 'winter' ? 0.002 : 0);
            tr.rotation.z = Math.sin(time * 0.45 + i * 0.55) * sw;
            tr.rotation.x = Math.cos(time * 0.35 + i * 0.38) * sw * 0.4;
        }

        /* — Sun arc ──────────────────────────────────── */
        const sa = time * 0.015;
        sunMesh.position.x = Math.cos(sa) * 180;
        sunMesh.position.y = 60 + Math.sin(sa) * 80;
        sunLight.position.copy(sunMesh.position);

        renderer.render(scene, camera);
    }

    animate();

    /* ────────────────────────────────────────────────────────
       20. RESIZE
    ──────────────────────────────────────────────────────── */
    window.addEventListener('resize', () => {
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
        renderer.setSize(W(), H());
    });

    /* ────────────────────────────────────────────────────────
       21. PUBLIC API
    ──────────────────────────────────────────────────────── */
    window.forestScene = {
        toggleDayNight,
        setRain: (v) => {
            if (typeof gsap !== 'undefined') {
                gsap.to(rainMat, { opacity: v ? 0.55 : 0, duration: 2 });
            } else {
                rainMat.opacity = v ? 0.55 : 0;
            }
        },
        get isNight() { return isNight; }
    };

}());
