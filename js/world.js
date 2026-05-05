/**
 * world.js — Three.js Forest Scene (Immersive Overhaul)
 * Forest Portfolio — Full cinematic experience
 */
(function () {
    'use strict';

    // get season from local storage if it is there and not expired
    function getStoredSeason() {
    const raw = localStorage.getItem('selectedSeason');
    if (!raw) return detectSeason();

    try {
        const data = JSON.parse(raw);

        if (Date.now() > data.expires) {
            localStorage.removeItem('selectedSeason');
            return detectSeason();
        }

        return data.season;
    } catch {
        return detectSeason();
    }
}

    /* ─────────────────────────────────────────────────────────
       T005: WebGL Fallback
    ───────────────────────────────────────────────────────── */
    const canvas = document.getElementById('three-canvas');
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
        document.body.classList.add('no-webgl');
        const bg = document.getElementById('no-webgl-bg');
        if (bg) bg.style.display = 'block';
        // Expose a no-op public API so ui.js does not throw
        window.forestScene  = { toggleDayNight: function(){}, setRain: function(){}, get isNight(){ return false; }, get introDone(){ return true; } };
        window.seasonManager = { setSeason: function(){}, onSeasonChange: function(){}, get currentSeason(){ return 'spring'; }, get isTransitioning(){ return false; } };
        // window.grassSystem   = { get tier(){ return 'LOW'; }, setWind: function(){} };
        window.grassSystem = window.grassSystem || {};

        window.grassSystem.setDensity = function (count) {
            this.targetDensity = count;

            if (this.particles) {
                this.particles.count = count;
                this.particles.needsUpdate = true;
            }
        };
        return;
    }

    /* ─────────────────────────────────────────────────────────
       T007: Performance Tier Detection
    ───────────────────────────────────────────────────────── */
    const CPU = navigator.hardwareConcurrency || 2;
    const DPR = window.devicePixelRatio || 1;
    const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let TIER = 'LOW';
    if (!REDUCED_MOTION) {
        if (CPU >= 8 && DPR <= 1.5) TIER = 'HIGH';
        else if (CPU >= 4 && DPR <= 2) TIER = 'MED';
    }

    // FPS monitoring 
    let fps = 60;
let lastFrame = performance.now();
let frameCount = 0;
let fpsTimer = performance.now();

function monitorFPS(now) {
    frameCount++;

    if (now - fpsTimer >= 1000) {
        fps = frameCount;
        frameCount = 0;
        fpsTimer = now;

        adaptivePerformanceControl();
    }

    lastFrame = now;
    requestAnimationFrame(monitorFPS);
}

requestAnimationFrame(monitorFPS);


// adaptive performance control based on the FPS 
function adaptivePerformanceControl() {
    // downgrade if FPS drops
    if (fps < 30 && TIER !== 'LOW') {
        TIER = 'LOW';
        applyPerformanceTier();
    }

    // upgrade if stable
    else if (fps > 50 && TIER === 'LOW' && CPU >= 4) {
        TIER = 'MED';
        applyPerformanceTier();
    }
}

// centralizing performance settings 
function applyPerformanceTier() {
    const settings = getTierSettings(TIER);

    if (renderer) {
        renderer.setPixelRatio(settings.PIXEL_RATIO);
        renderer.shadowMap.enabled = settings.SHADOWS;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    if (window.grassSystem && typeof window.grassSystem.setDensity === 'function') {
    window.grassSystem.setDensity(settings.GRASS_COUNT);
    }

    window.__PERF_SETTINGS = settings;
}

// defining tier config:
function getTierSettings(tier) {
    const DPR = window.devicePixelRatio || 1;

    if (tier === 'HIGH') {
        return {
            SHADOW_SIZE: 2048,
            PIXEL_RATIO: Math.min(DPR, 2),
            GRASS_COUNT: 8000,
            PART_MAX: 700,
            SHADOWS: true
        };
    }

    if (tier === 'MED') {
        return {
            SHADOW_SIZE: 1024,
            PIXEL_RATIO: Math.min(DPR, 1.5),
            GRASS_COUNT: 3000,
            PART_MAX: 350,
            SHADOWS: true
        };
    }

    return {
        SHADOW_SIZE: 512,
        PIXEL_RATIO: 1,
        GRASS_COUNT: 1000,
        PART_MAX: 150,
        SHADOWS: false
    };
}

// fixing webgl init:
renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: TIER !== 'LOW',
    powerPreference: 'high-performance',
    alpha: false,
    stencil: false,
    depth: true
});

// adding tab visibility performance drop 
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        TIER = 'LOW';
        applyPerformanceTier();
    }
});

    const SHADOW_SIZE   = TIER === 'HIGH' ? 2048 : TIER === 'MED' ? 1024 : 512;
    const PIXEL_RATIO   = TIER === 'HIGH' ? Math.min(DPR, 2) : TIER === 'MED' ? Math.min(DPR, 1.5) : 1;
    const GRASS_COUNT   = TIER === 'HIGH' ? 8000  : TIER === 'MED' ? 3000  : 1000;
    const PART_MAX      = TIER === 'HIGH' ? 700   : TIER === 'MED' ? 350   : 150;


    /* Shared ground height function — keeps grass Y flush with terrain */
    function groundHeightAt(x, z) {
        return Math.sin(x * 0.07) * 1.8
             + Math.cos(z * 0.05) * 1.4
             + Math.sin(x * 0.18 + z * 0.12) * 0.6
             + Math.sin(x * 0.4  + z * 0.35) * 0.2;
    }

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    renderer.setPixelRatio(PIXEL_RATIO);
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = TIER !== 'LOW';
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    try { renderer.outputEncoding = THREE.sRGBEncoding; } catch (e) {}

    /* T053: Pre-allocated Color scratch objects — reused every frame to avoid GC pressure */
    const _ca = new THREE.Color();
    const _cb = new THREE.Color();
    const _cc = new THREE.Color();

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, W() / H(), 0.1, 1200);
    camera.position.set(0, 130, 40);
    camera.lookAt(0, 50, 0);

    /* ─────────────────────────────────────────────────────────
       T008: Season Configurations (expanded)
    ───────────────────────────────────────────────────────── */
    const SEASONS = {
       spring: {
    fogColor: 0xd7ead9, fogDensity: 0.010,

    skyTop: 0x4eb8ea,
    skyBottom: 0x99c460,

    // 🌱 Ground — soft natural green (not neon)
    groundColor: 0x99c460,

    // 🌸 Leaves — lighter, softer blossom tones
    leafColors: [
        0x5fae5d, // medium green
        0x78c67a, // fresh green
        0xff7aa2, // lighter pink 🌸
        0xff9bb5, // soft blossom pink
        0xa5d6a7  // soft pastel green
    ],

    // 🌳 Trunks — contrast strongly with ground
    trunkColor: 0x5c4433, // rich brown (main trunk)

    // ☀️ Lighting — soft and readable
    sunColor: 0xfff4d6,
    ambientColor: 0xcfe6cf,
    ambientInt: 0.6,
    sunInt: 1.4,

    hemiSky: 0x9fd3f0,

    // important: slightly darker than ground for depth
    hemiGround: 0x4e6f45,

    // 🌸 Petals (match lighter blossoms)
    particleColor: 0xffb3c7,
    particleSize: 0.14,

    // 🌿 Grass — slightly brighter than ground but not neon
    grassColor: 0x99c460,
    grassDensity: 1.0,

    creekColor: 0x3a8fb7,
    creekFrozen: false,

    accentCss: '#7bbf8a',
    badge: '🌸 Spring'
},
        summer: {
            fogColor: 0x8fc48a, fogDensity: 0.01,
            skyTop: 0x1e90ff,   skyBottom: 0x72bb6e,
            groundColor: 0x2e6b2a,
            leafColors: [0x2e7d32, 0x388e3c, 0x43a047, 0x66bb6a, 0x81c784],
            trunkColor: 0x4e3b2a,
            sunColor: 0xfff9e6,  ambientColor: 0xc8e6c9, ambientInt: 0.7,
            sunInt: 1.9, hemiSky: 0x1e90ff, hemiGround: 0x3a6b2f,
            particleColor: 0xa8d5a2, particleSize: 0.0,
            grassColor: 0x2e7d32, grassDensity: 1.0,
            creekColor: 0x1a6e8c, creekFrozen: false,
            accentCss: '#4db34a', badge: '☀️ Summer'
        },
        fall: {
    // 🌫️ Softer, slightly warm haze (not orange soup)
    fogColor: 0xd6b48a,
    fogDensity: 0.012,

    // 🌤️ Realistic autumn sky (blue with warm tint near horizon)
    skyTop: 0x6fa3d9,      // soft autumn blue
    skyBottom: 0xf2c38b,   // warm sunset glow

    // 🌱 Ground — earthy brown with a hint of green decay
    groundColor: 0x5a3e24,

    // 🍁 LEAVES — REAL fall palette
    leafColors: [
        0xc76b2b, // burnt orange
        0xd94f2b, // orange-red
        0xa83232, // crimson
        0xe0a13b, // golden yellow
        0x8b4513  // brown
    ],

    // 🌳 Trunks — slightly deeper for contrast
    trunkColor: 0x4a2f1b,

    // ☀️ Lighting — warm but not exaggerated
    sunColor: 0xffd9a6,
    ambientColor: 0xd8b48a,
    ambientInt: 0.55,
    sunInt: 1.2,

    // 🌤️ Hemisphere
    hemiSky: 0x6fa3d9,
    hemiGround: 0x5a3e24,

    // 🍂 Falling leaves particles
    particleColor: 0xc76b2b,
    particleSize: 0.18,

    // 🌿 Grass — dry/desaturated
    grassColor: 0xa8843a,
    grassDensity: 0.7,

    // 🌊 Creek — slightly darker, colder water
    creekColor: 0x3f6f85,
    creekFrozen: false,

    accentCss: '#c27a3a',
    badge: '🍁 Fall'
},
        winter: {
    // 🌫️ Slightly darker fog so things don’t disappear
    fogColor: 0xd6e2ee,
    fogDensity: 0.018,

    // 🌤️ Sky — keep it clearly blue for contrast
    skyTop: 0xa9c7e3,
    skyBottom: 0xeaf3fb,

    // ❄️ Ground — NOT pure white (this was your main issue)
    groundColor: 0xe3edf6,

    // 🌲 Leaves — barely there, but visible
    leafColors: [
        0xd6dee6,
        0xc2ccd6,
        0xadb8c2,
        0xe6edf3
    ],

    // 🌳 Trunks — darker so trees stand out
    trunkColor: 0x3a281a,

    // ☀️ Lighting — slightly stronger for contrast
    sunColor: 0xf4faff,
    ambientColor: 0xcfddeb,
    ambientInt: 0.5,
    sunInt: 1.25,

    // 🌤️ Hemisphere — key for depth
    hemiSky: 0xbcd3e6,
    hemiGround: 0xd6e2ee,

    // ❄️ Snow particles
    particleColor: 0xffffff,
    particleSize: 0.2,

    // 🌿 Grass — snow covered but NOT pure white
    grassColor: 0xdfe8f2,
    grassDensity: 0.35,

    // 🧊 Water
    creekColor: 0xa9c7d8,
    creekFrozen: true,

    accentCss: '#bcd3e6',
    badge: '❄️ Winter'
}
    };

    function detectSeason() {
        const m = new Date().getMonth();
        if (m >= 2 && m <= 4) return 'spring';
        if (m >= 5 && m <= 7) return 'summer';
        if (m >= 8 && m <= 10) return 'fall';
        return 'winter';
    }

    let currentSeason = getStoredSeason() || detectSeason();
    let SC = SEASONS[currentSeason];
    document.body.classList.add('season-' + currentSeason);

    /* ─────────────────────────────────────────────────────────
       SCENE ATMOSPHERE
    ───────────────────────────────────────────────────────── */
    scene.fog = new THREE.FogExp2(SC.fogColor, SC.fogDensity);
    renderer.setClearColor(SC.fogColor, 1);

    /* ─────────────────────────────────────────────────────────
       LIGHTING
    ───────────────────────────────────────────────────────── */
    const ambientLight = new THREE.AmbientLight(SC.ambientColor, SC.ambientInt);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(SC.hemiSky, SC.hemiGround, 0.55);
    scene.add(hemisphereLight);

    const sunLight = new THREE.DirectionalLight(SC.sunColor, SC.sunInt);
    sunLight.position.set(60, 100, 40);
    sunLight.castShadow = TIER !== 'LOW';
    sunLight.shadow.mapSize.set(SHADOW_SIZE, SHADOW_SIZE);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far  = 600;
    sunLight.shadow.camera.left = sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.camera.right = sunLight.shadow.camera.top   =  120;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const moonLight = new THREE.DirectionalLight(0x8aafd4, 0);
    moonLight.position.set(-60, 90, -30);
    scene.add(moonLight);

    /* ─────────────────────────────────────────────────────────
       SKY DOME
    ───────────────────────────────────────────────────────── */
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

    /* Sun & Moon spheres — fog:false keeps them visible at sky distance */
    const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(10, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xfff5a0, fog: false })
    );
    scene.add(sunMesh);

    /* Sun glow halo */
    const sunGlowMesh = new THREE.Mesh(
        new THREE.SphereGeometry(18, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffee88, fog: false, transparent: true, opacity: 0.18, side: THREE.BackSide })
    );
    scene.add(sunGlowMesh);

    /* Crescent moon — shader discards the shadowed hemisphere */
    const moonMat = new THREE.ShaderMaterial({
        fog: false,
        uniforms: {
            /* uSunDir points from moon toward sun; angle controls crescent thickness */
            uSunDir: { value: new THREE.Vector3(0.55, 0.25, 0.80).normalize() }
        },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: `
            uniform vec3 uSunDir;
            varying vec3 vNormal;
            void main() {
                float lit = dot(vNormal, normalize(uSunDir));
                if (lit < 0.0) discard;
                float face = smoothstep(0.0, 0.18, lit);
                vec3 col = mix(vec3(0.12, 0.14, 0.22), vec3(0.88, 0.93, 1.0), face);
                gl_FragColor = vec4(col, 1.0);
            }`
    });
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(8, 24, 24), moonMat);
    moonMesh.visible = false;
    scene.add(moonMesh);

    /* Moon glow */
    const moonGlowMesh = new THREE.Mesh(
        new THREE.SphereGeometry(14, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x8aafd4, fog: false, transparent: true, opacity: 0.12, side: THREE.BackSide })
    );
    moonGlowMesh.visible = false;
    scene.add(moonGlowMesh);

    /* ─────────────────────────────────────────────────────────
       T039: Star Field
    ───────────────────────────────────────────────────────── */
    /* Stars — upper hemisphere only, fog:false so fog doesn't hide them */
    const STAR_COUNT = 2500;
    const starPositions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        /* acos(random 0→1) gives phi 0→PI/2 (upper hemisphere) */
        const phi   = Math.acos(Math.random());
        const r     = 480;
        starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.cos(phi) + 20;  /* bias upward */
        starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
        color: 0xffffff, size: 1.8, transparent: true, opacity: 0,
        sizeAttenuation: true, fog: false
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    /* ─────────────────────────────────────────────────────────
   AURORA BOREALIS (Winter night) 
───────────────────────────────────────────────────────── */

const auroraUniforms = {
    uTime:      { value: 0 },
    uIntensity: { value: 0 }
};

const auroraGeo = new THREE.PlaneGeometry(800, 140, 60, 20);

const auroraMat = new THREE.ShaderMaterial({
    uniforms: auroraUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    fog: false,

    vertexShader: `
        uniform float uTime;
        varying vec2 vUv;

        // subtle 2D vertex warping for curtain motion
        void main() {
            vUv = uv;

            vec3 p = position;

            float waveX = sin(uv.x * 4.0 + uTime * 0.25);
            float waveY = sin(uv.y * 3.0 - uTime * 0.18);

            p.y += waveX * 12.0 + waveY * 6.0;
            p.x += sin(uv.y * 2.0 + uTime * 0.15) * 4.0;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
    `,

    fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;

        // cheap pseudo-noise (replaces fract/stripe artifacts)
        float noise(vec2 p) {
            return sin(p.x * 3.0 + uTime * 0.3)
                 * sin(p.y * 2.0 - uTime * 0.25)
                 * 0.5 + 0.5;
        }

        void main() {

            // 2D turbulence field (fixes vertical striping completely)
            vec2 uv = vUv;

            float n1 = noise(uv * 3.0);
            float n2 = noise(uv * 6.0 + n1 * 0.5);
            float n3 = noise(uv * 12.0 - uTime * 0.2);

            float turbulence = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);

            // flowing vertical curtain shape
            float curtain = smoothstep(0.2, 0.6, uv.y + turbulence * 0.25)
                          - smoothstep(0.65, 1.0, uv.y + turbulence * 0.2);

            // soft horizontal drift (no repetition bands)
            float drift = sin(uv.x * 2.0 + turbulence * 2.0 + uTime * 0.4) * 0.5 + 0.5;

            // aurora colors
            vec3 green  = vec3(0.0, 0.95, 0.55);
            vec3 teal   = vec3(0.0, 0.75, 0.85);
            vec3 violet = vec3(0.65, 0.25, 1.0);

            // smooth gradient blend (no hard splits)
            float grad = uv.y + turbulence * 0.2;

            vec3 col = mix(green, teal, smoothstep(0.0, 0.6, grad));
            col = mix(col, violet, smoothstep(0.4, 1.0, grad));

            // shimmer like solar activity
            float shimmer = 0.6 + 0.4 * sin(uTime * 1.8 + uv.x * 5.0);

            float alpha = curtain * drift * shimmer * uIntensity * 0.75;

            gl_FragColor = vec4(col, alpha);
        }
    `
});

const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
auroraMesh.position.set(0, 75, -220);
auroraMesh.rotation.x = -0.18;
auroraMesh.visible = false;
scene.add(auroraMesh);

class SimplexNoise {
    constructor() {
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        this.p = Array.from({length: 256}, () => Math.floor(Math.random() * 256));
        this.perm = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }

    dot(g, x, y) {
        return g[0]*x + g[1]*y;
    }

    noise(xin, yin) {
        let n0, n1, n2;

        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);

        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;

        const x0 = xin - X0;
        const y0 = yin - Y0;

        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; }
        else { i1 = 0; j1 = 1; }

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;

        const ii = i & 255;
        const jj = j & 255;

        const gi0 = this.perm[ii + this.perm[jj]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;

        let t0 = 0.5 - x0*x0 - y0*y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }

        let t1 = 0.5 - x1*x1 - y1*y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }

        let t2 = 0.5 - x2*x2 - y2*y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }

        return 70.0 * (n0 + n1 + n2);
    }
}

const simplex = new SimplexNoise();

    /* ─────────────────────────────────────────────────────────
       GROUND
    ───────────────────────────────────────────────────────── */
   const gGeo = new THREE.PlaneGeometry(500, 500, 120, 120);
const gPos = gGeo.attributes.position;

// better terrain noise (break repetition)
for (let i = 0; i < gPos.count; i++) {

    const x = gPos.getX(i);
    const z = gPos.getZ(i);

    // base terrain (mountains + hills)
    let h =
        simplex.noise(x * 0.008, z * 0.008) * 8.0 +   // big mountains
        simplex.noise(x * 0.02,  z * 0.02)  * 3.0 +   // hills
        simplex.noise(x * 0.06,  z * 0.06)  * 1.0;    // micro detail

    // erosion pass (smooth valleys naturally)
    const erosion =
        Math.abs(simplex.noise(x * 0.015, z * 0.015));

    h -= erosion * erosion * 2.5;

    gPos.setY(i, h);
}
gGeo.computeVertexNormals();


function applySeasonalTerrain() {

    const season = window.seasonManager?.currentSeason || 'spring';

    let factor = 1;

    if (season === 'winter') factor = 0.7; // compressed snow terrain
    if (season === 'fall')   factor = 0.95; // slightly softened
    if (season === 'summer') factor = 1.0;
    if (season === 'spring') factor = 1.05; // slightly more lush

    const pos = gGeo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        pos.setY(i, y * factor);
    }

    pos.needsUpdate = true;
    gGeo.computeVertexNormals();
}
applySeasonalTerrain();

// vertex color variation (CRUCIAL for realism)
const colors = [];
const base = new THREE.Color();

for (let i = 0; i < gPos.count; i++) {
    const x = gPos.getX(i);
    const z = gPos.getZ(i);

    const noise =
        (Math.sin(x * 0.1) + Math.cos(z * 0.1) + Math.sin((x + z) * 0.05)) * 0.33 + 0.5;

    base.set(SC.groundColor);

    // subtle natural breakup
    base.offsetHSL(
        0,
        (noise - 0.5) * 0.08,
        (noise - 0.5) * 0.12
    );

    colors.push(base.r, base.g, base.b);
}

gGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

// improved material
const ground = new THREE.Mesh(
    gGeo,
    new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1.0,
        metalness: 0,
        flatShading: false,
        color: 0xffffff // vertex colors fully control it
    })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -2.5;
ground.receiveShadow = true;
scene.add(ground);

    /* ─────────────────────────────────────────────────────────
       TREES
    ───────────────────────────────────────────────────────── */
    const trunkMat = new THREE.MeshStandardMaterial({ color: SC.trunkColor, roughness: 0.95 });
    const leafMats = [];

    function makeTree(x, z, s, leafIdx) {
        const g = new THREE.Group();
        g.position.set(x, -2.5 + groundHeightAt(x, z), z);
        const tH    = (3.5 + Math.random() * 4) * s;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.28 * s, tH, 7), trunkMat);
        trunk.position.y = tH / 2;
        trunk.castShadow = true;
        g.add(trunk);
        const lc  = SC.leafColors[leafIdx % SC.leafColors.length];
        const lMat = new THREE.MeshStandardMaterial({ color: lc, roughness: 0.88 });
        leafMats.push(lMat);
        const layers = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < layers; i++) {
            const r    = (2.2 - i * 0.25 + Math.random() * 0.5) * s;
            const ch   = (2.8 - i * 0.2  + Math.random() * 0.8) * s;
            const cone = new THREE.Mesh(new THREE.ConeGeometry(r, ch, 8 + Math.floor(Math.random() * 3)), lMat);
            cone.position.y = tH + i * ch * 0.6 + ch * 0.35;
            cone.rotation.y = Math.random() * Math.PI;
            cone.castShadow = true;
            g.add(cone);
        }
        g.rotation.y = Math.random() * Math.PI * 2;
        return g;
    }

    const treeGroup = new THREE.Group();
    for (let i = 0; i < 160; i++) {
        const side   = Math.random() > 0.5 ? 1 : -1;
        const spread = 6 + Math.random() * 65;
        treeGroup.add(makeTree(side * spread, (Math.random() - 0.5) * 280, 0.65 + Math.random() * 0.9, Math.floor(Math.random() * SC.leafColors.length)));
    }
    for (let i = 0; i < 20; i++) {
        treeGroup.add(makeTree((Math.random() - 0.5) * 8, -50 - Math.random() * 200, 0.5 + Math.random() * 0.4, 0));
    }
    scene.add(treeGroup);

    /* ─────────────────────────────────────────────────────────
       ROCKS
    ───────────────────────────────────────────────────────── */
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.95 });
    for (let i = 0; i < 40; i++) {
        const s    = 0.15 + Math.random() * 0.9;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
        rock.position.set((Math.random() - 0.5) * 100, -2.5 + s * 0.5, (Math.random() - 0.5) * 240);
        rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        rock.castShadow = rock.receiveShadow = true;
        scene.add(rock);
    }

    /* ─────────────────────────────────────────────────────────
       T043–T047: Creek (replaces flat water lake)
    ───────────────────────────────────────────────────────── */
    /* Creek spans from far horizon ahead (-z) through the scene to camera start */
    const CREEK_Y = -0.8;  /* above ground level so terrain bumps don't block it */
    const creekControlPoints = [
        new THREE.Vector3(-10, CREEK_Y, -320),
        new THREE.Vector3(-16, CREEK_Y, -250),
        new THREE.Vector3(-8,  CREEK_Y, -180),
        new THREE.Vector3(-14, CREEK_Y, -120),
        new THREE.Vector3(-9,  CREEK_Y, -70),
        new THREE.Vector3(-13, CREEK_Y, -20),
        new THREE.Vector3(-7,  CREEK_Y,  20),
        new THREE.Vector3(-11, CREEK_Y,  55),
        new THREE.Vector3(-6,  CREEK_Y,  80),
    ];
    const creekCurve   = new THREE.CatmullRomCurve3(creekControlPoints);
    const creekSamples = creekCurve.getPoints(120);
    const creekWidth   = 4.5;

    function buildCreekGeometry(samples, width) {
        const verts = [], uvs = [], indices = [];
        const up = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i < samples.length; i++) {
            const t   = i / (samples.length - 1);
            const dir = i < samples.length - 1
                ? new THREE.Vector3().subVectors(samples[i + 1], samples[i]).normalize()
                : new THREE.Vector3().subVectors(samples[i], samples[i - 1]).normalize();
            const right = new THREE.Vector3().crossVectors(dir, up).normalize();
            const L = samples[i].clone().addScaledVector(right, -width / 2);
            const R = samples[i].clone().addScaledVector(right,  width / 2);
            verts.push(L.x, L.y, L.z, R.x, R.y, R.z);
            uvs.push(0, t, 1, t);
            if (i < samples.length - 1) {
                const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
                indices.push(a, b, c, b, d, c);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        geo.setAttribute('uv',       new THREE.BufferAttribute(new Float32Array(uvs),   2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    }

    const creekUniforms = {
        uTime:      { value: 0 },
        uFlowSpeed: { value: 0.14 },
        uColor:     { value: new THREE.Color(SC.creekColor) }
    };

    const creekMat = new THREE.ShaderMaterial({
        uniforms: creekUniforms,
        transparent: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        vertexShader: `
            uniform float uTime;
            varying vec2  vUv;
            void main() {
                vUv = uv;
                vec3 p = position;
                /* Slow, gentle surface undulation */
                p.y += sin(uv.x * 5.0  + uTime * 0.38) * 0.045
                     + cos(uv.y * 3.5  + uTime * 0.28) * 0.032
                     + sin(uv.x * 10.0 - uTime * 0.52) * 0.014;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }`,
        fragmentShader: `
            uniform float uTime;
            uniform float uFlowSpeed;
            uniform vec3  uColor;
            varying vec2  vUv;

            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

            void main() {
                float flow = vUv.y * 8.0 - uTime * uFlowSpeed;

                /* Scrolling flow lines — soft streaks along the current */
                float f1 = pow(max(sin(vUv.x * 16.0 + flow * 1.2),       0.0), 5.0) * 0.50;
                float f2 = pow(max(cos(vUv.x * 10.0 - flow * 0.8 + 1.1), 0.0), 5.0) * 0.30;
                float flowLines = f1 + f2;

                /* Caustic shimmer — slow dancing light patches */
                vec2 cp = vec2(vUv.x * 4.0, flow * 0.30);
                float c1 = sin(cp.x * 5.2 + uTime * 0.18) * sin(cp.y * 4.8 + uTime * 0.14);
                float c2 = cos(cp.x * 7.1 - uTime * 0.12) * cos(cp.y * 6.3 + uTime * 0.20);
                float caustic = pow(max((c1 + c2) * 0.5 + 0.5, 0.0), 3.5) * 0.45;

                /* Sparkles — travel continuously with the current, smooth fade-in/out */
                float sparkFlow  = vUv.y * 5.0 - uTime * 0.10;   /* slow scroll */
                float sparkGen   = floor(uTime * 1.2);            /* new batch every ~0.8 s */
                vec2  sp         = vec2(floor(vUv.x * 22.0), floor(sparkFlow));
                float sparkRaw   = step(0.965, hash(sp + sparkGen));
                /* Smooth crossfade between batches instead of a hard cut */
                float phase      = fract(uTime * 1.2);
                float sparkFade  = smoothstep(0.0, 0.35, phase) * smoothstep(1.0, 0.65, phase);
                float spark      = sparkRaw * sparkFade;

                /* Edge foam — frothy white at banks */
                float edgeL = 1.0 - smoothstep(0.0, 0.14, vUv.x);
                float edgeR = 1.0 - smoothstep(0.0, 0.14, 1.0 - vUv.x);
                float foam  = max(edgeL, edgeR);
                float foamAnim = 0.55 + sin(flow * 1.4 + vUv.x * 6.0) * 0.45;
                foam = pow(foam, 1.8) * foamAnim;

                /* Depth: darker / more saturated toward center */
                float depth = smoothstep(0.0, 0.35, vUv.x) * smoothstep(0.0, 0.35, 1.0 - vUv.x);
                vec3 deepCol    = uColor * 0.6;
                vec3 shallowCol = uColor * 1.2;
                vec3 waterCol   = mix(shallowCol, deepCol, depth);

                vec3 col = waterCol
                         + flowLines * 0.28
                         + caustic   * 0.25
                         + spark     * 1.80
                         + foam      * vec3(0.85, 0.92, 1.0);

                float alpha = 0.82 * smoothstep(0.0, 0.06, vUv.x)
                                   * smoothstep(0.0, 0.06, 1.0 - vUv.x);

                gl_FragColor = vec4(col, alpha);
            }`
    });

    const creekGeo  = buildCreekGeometry(creekSamples, creekWidth);
    const creekMesh = new THREE.Mesh(creekGeo, creekMat);
    scene.add(creekMesh);

    /* Ice overlay (Winter) */
    const iceGeo = buildCreekGeometry(creekSamples, creekWidth * 1.5);
    const iceMat = new THREE.MeshStandardMaterial({ color: 0xd0eeff, transparent: true, opacity: 0.62, roughness: 0.3, metalness: 0.1 });
    const iceMesh = new THREE.Mesh(iceGeo, iceMat);
    iceMesh.position.y = 0.02;
    iceMesh.visible = SC.creekFrozen;
    scene.add(iceMesh);

    /* ─────────────────────────────────────────────────────────
       CLOUDS
    ───────────────────────────────────────────────────────── */
    function makeCloud(x, y, z, s) {
        const g  = new THREE.Group();
        const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, roughness: 1 });
        for (let i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
            const r = (1.4 + Math.random() * 2.0) * s;
            const m = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), cm.clone());
            m.position.set((Math.random() - 0.5) * 8 * s, (Math.random() - 0.3) * 2 * s, (Math.random() - 0.5) * 5 * s);
            g.add(m);
        }
        g.position.set(x, y, z);
        return g;
    }
    const cloudGroup = new THREE.Group();
    for (let i = 0; i < 22; i++) {
        cloudGroup.add(makeCloud((Math.random() - 0.5) * 250, 55 + Math.random() * 40, (Math.random() - 0.5) * 250, 1.0 + Math.random() * 1.6));
    }
    for (let i = 0; i < 12; i++) {
        cloudGroup.add(makeCloud((Math.random() - 0.5) * 180, 22 + Math.random() * 14, -80 - Math.random() * 180, 0.7 + Math.random() * 0.9));
    }
    scene.add(cloudGroup);

    /* ─────────────────────────────────────────────────────────
       T033–T038: Cel-Shaded Grass System (InstancedMesh)
    ───────────────────────────────────────────────────────── */
    const grassUniforms = {
        uTime:          { value: 0 },
        uWindStrength:  { value: 0.35 },
        uWindDirection: { value: new THREE.Vector2(1.0, 0.3) },
        uColor:         { value: new THREE.Color(SC.grassColor) },
        uLightDir:      { value: new THREE.Vector3(0.6, 1.0, 0.4).normalize() }
    };

    /* Creek-zone exclusion — keeps grass out of the stream */
    function isInCreekZone(x, z) {
        for (let i = 0; i < creekSamples.length; i += 2) {
            const cp = creekSamples[i];
            const dx = x - cp.x, dz = z - cp.z;
            if (dx * dx + dz * dz < 144) return true; /* 12-unit exclusion radius */
        }
        return false;
    }

    const grassMaterial = new THREE.ShaderMaterial({
        uniforms: grassUniforms,
        side: THREE.DoubleSide,
        vertexShader: `
            uniform float     uTime;
            uniform float     uWindStrength;
            uniform vec2      uWindDirection;
            attribute vec3    instanceOffset;
            attribute float   instancePhase;
            attribute float   instanceScale;
            varying   float   vHeight;

            void main() {
                vHeight = uv.y;

                /* Taper blade: wide at base, pointed at tip */
                float taper = 1.0 - uv.y * 0.78;
                vec3 blade  = position;
                blade.x    *= taper * instanceScale;
                blade.y    *= instanceScale;

                /* Random base tilt using instancePhase as a secondary seed */
                float tiltAmt = sin(instancePhase * 2.618) * 0.28;
                blade.x += tiltAmt * (1.0 - uv.y * 0.5);

                /* Quadratic wind sway — stronger at tip */
                float sw2  = uv.y * uv.y;
                float wave = (sin(uTime * 1.6  + instancePhase) * 0.7
                            + sin(uTime * 2.8  + instancePhase * 1.5) * 0.3)
                           * uWindStrength * sw2;
                blade.x += wave * uWindDirection.x;
                blade.z += wave * uWindDirection.y;

                vec3 worldPos = blade + instanceOffset;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
            }`,
        fragmentShader: `
            uniform vec3  uColor;
            varying float vHeight;

            void main() {
                float h = pow(vHeight, 0.65);

                /* 3-band height-based cel shading — BOTW/Genshin style */
                float celBand = h > 0.65 ? 1.0 : h > 0.38 ? 0.62 : 0.22;

                vec3 rootCol = uColor * 0.35;
                vec3 midCol  = uColor * 0.80;
                vec3 tipCol  = uColor * 1.12;
                vec3 col = h < 0.4
                    ? mix(rootCol, midCol, h / 0.4)
                    : mix(midCol,  tipCol, (h - 0.4) / 0.6);

                col *= celBand;
                gl_FragColor = vec4(col, 1.0);
            }`
    });

    /* Outline: backface-inflated version for toon silhouette */
    const grassOutlineMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: `
            uniform float     uTime;
            uniform float     uWindStrength;
            uniform vec2      uWindDirection;
            attribute vec3    instanceOffset;
            attribute float   instancePhase;
            attribute float   instanceScale;
            void main() {
                float taper  = 1.0 - uv.y * 0.78;
                vec3  blade  = position;
                blade.x     *= taper * (instanceScale * 1.10);
                blade.y     *= instanceScale * 1.10;
                blade.x     += sin(instancePhase * 2.618) * 0.28 * (1.0 - uv.y * 0.5);
                float sw2    = uv.y * uv.y;
                float wave   = (sin(uTime * 1.6  + instancePhase) * 0.7
                              + sin(uTime * 2.8  + instancePhase * 1.5) * 0.3)
                             * uWindStrength * sw2;
                blade.x     += wave * uWindDirection.x;
                blade.z     += wave * uWindDirection.y;
                gl_Position  = projectionMatrix * modelViewMatrix * vec4(blade + instanceOffset, 1.0);
            }`,
        fragmentShader: `void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.85); }`,
        uniforms: {
            uTime:          grassUniforms.uTime,
            uWindStrength:  grassUniforms.uWindStrength,
            uWindDirection: grassUniforms.uWindDirection
        }
    });

    /* Wider, taller blade with 5 height segments for smoother curve */
    const bladeMasterGeo = new THREE.PlaneGeometry(0.22, 0.82, 1, 5);

    /* Per-instance data — cluster approach: several blades near each other */
    const offsets = new Float32Array(GRASS_COUNT * 3);
    const phases  = new Float32Array(GRASS_COUNT);
    const scales  = new Float32Array(GRASS_COUNT);

    const BLADES_PER_CLUSTER = 5;
    let placed = 0, retries = 0;
    while (placed < GRASS_COUNT) {
        const cx = (Math.random() - 0.5) * 120;
        const cz = (Math.random() - 0.5) * 240 - 40;
        if (isInCreekZone(cx, cz) && ++retries < GRASS_COUNT * 4) continue;
        retries = 0;

        for (let b = 0; b < BLADES_PER_CLUSTER && placed < GRASS_COUNT; b++) {
            const gx = cx + (Math.random() - 0.5) * 0.55;
            const gz = cz + (Math.random() - 0.5) * 0.55;
            offsets[placed * 3]     = gx;
            offsets[placed * 3 + 1] = -2.5 + groundHeightAt(gx, gz);
            offsets[placed * 3 + 2] = gz;
            phases[placed] = Math.random() * Math.PI * 2;
            scales[placed] = 0.75 + Math.random() * 0.65;
            placed++;
        }
    }

    /* InstancedBufferGeometry: per-instance attributes advance once per instance */
    function makeGrassInstanceGeo() {
        const ig = new THREE.InstancedBufferGeometry();
        ig.index = bladeMasterGeo.index;
        ig.setAttribute('position', bladeMasterGeo.getAttribute('position'));
        ig.setAttribute('normal',   bladeMasterGeo.getAttribute('normal'));
        ig.setAttribute('uv',       bladeMasterGeo.getAttribute('uv'));
        ig.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets, 3));
        ig.setAttribute('instancePhase',  new THREE.InstancedBufferAttribute(phases,  1));
        ig.setAttribute('instanceScale',  new THREE.InstancedBufferAttribute(scales,  1));
        ig.instanceCount = GRASS_COUNT;
        return ig;
    }

    const grassMesh    = new THREE.Mesh(makeGrassInstanceGeo(), grassMaterial);
    const grassOutline = new THREE.Mesh(makeGrassInstanceGeo(), grassOutlineMat);
    grassMesh.frustumCulled = grassOutline.frustumCulled = false;
    scene.add(grassMesh);
    scene.add(grassOutline);

    /* ─────────────────────────────────────────────────────────
       SEASONAL PARTICLES
    ───────────────────────────────────────────────────────── */
    const PART_COUNT = SC.particleSize > 0 ? PART_MAX : 0;
    const pPos = new Float32Array(PART_MAX * 3);
    const pVel = [];
    for (let i = 0; i < PART_MAX; i++) {
        pPos[i * 3]     = (Math.random() - 0.5) * 80;
        pPos[i * 3 + 1] = Math.random() * 25 + 2;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        pVel.push({ vx: (Math.random() - 0.5) * 0.025, vy: -(0.018 + Math.random() * 0.04), vz: (Math.random() - 0.5) * 0.018, wb: Math.random() * Math.PI * 2, ws: 0.015 + Math.random() * 0.03 });
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particlesMat = new THREE.PointsMaterial({
        color: SC.particleColor,
        size:  SC.particleSize || 0.16,
        transparent: true,
        opacity: SC.particleSize > 0 ? 0.82 : 0,
        sizeAttenuation: true
    });
    const particles = new THREE.Points(partGeo, particlesMat);
    scene.add(particles);

    /* ─────────────────────────────────────────────────────────
       RAIN
    ───────────────────────────────────────────────────────── */
    const RAIN_COUNT = TIER === 'LOW' ? 800 : 2500;
    const rPos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
        rPos[i * 3]     = (Math.random() - 0.5) * 80;
        rPos[i * 3 + 1] = Math.random() * 40;
        rPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
    const rainMat  = new THREE.PointsMaterial({ color: 0x99ccee, size: 0.08, transparent: true, opacity: 0, sizeAttenuation: true });
    const rain     = new THREE.Points(rainGeo, rainMat);
    scene.add(rain);

    /* ─────────────────────────────────────────────────────────
       FIREFLIES
    ───────────────────────────────────────────────────────── */
    const FF_COUNT = 70;
    const ffPos = new Float32Array(FF_COUNT * 3);
    const ffData = [];
    for (let i = 0; i < FF_COUNT; i++) {
        ffPos[i * 3]     = (Math.random() - 0.5) * 60;
        ffPos[i * 3 + 1] = 0.4 + Math.random() * 7;
        ffPos[i * 3 + 2] = (Math.random() - 0.5) * 100;
        ffData.push({ bx: ffPos[i*3], by: ffPos[i*3+1], bz: ffPos[i*3+2], ph: Math.random() * Math.PI * 2, sp: 0.25 + Math.random() * 0.55, r: 0.8 + Math.random() * 2.2, bp: Math.random() * Math.PI * 2 });
    }
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    const ffMat    = new THREE.PointsMaterial({ color: 0x88ff44, size: 0.45, transparent: true, opacity: 0, sizeAttenuation: true });
    const fireflies = new THREE.Points(ffGeo, ffMat);
    scene.add(fireflies);

    /* ─────────────────────────────────────────────────────────
       STATE
    ───────────────────────────────────────────────────────── */
    let time          = 0;
    let introDone     = false;
    let scrollY       = 0;
    let scrollMax     = 1;
    let nightLerp     = 0;
    let nightTarget   = 0;
    let isNight       = false;
    let nightTransitioning = false;
    let arcOffset     = 0;
    let camX = 0, camY = 4, camZ = 30;

    // Load saved time of day
    const storedTime = getStoredTimeOfDay();

    if (storedTime !== null) {
        isNight = storedTime;
    }

    // Sync animation system with loaded value
    nightTarget = isNight ? 1 : 0;
    nightLerp   = nightTarget;

    const NIGHT = {
        ambientColor: 0x0a1020, ambientInt: 0.12,
        skyTop: 0x020812,  skyBottom: 0x0a1018,
        fogColor: 0x060810, sunInt: 0, moonInt: 0.85
    };

    // get time of day from localstorage if it is there and not expired 

function getStoredTimeOfDay() {
    const raw = localStorage.getItem('timeOfDay');
    if (!raw) return null;

    try {
        const data = JSON.parse(raw);

        if (Date.now() > data.expires) {
            localStorage.removeItem('timeOfDay');
            return null;
        }

        return data.isNight;
    } catch {
        return null;
    }
    }

   
    /* ─────────────────────────────────────────────────────────
       T009: Season Manager
    ───────────────────────────────────────────────────────── */
    let _seasonTransitioning = false;
    const _seasonListeners   = [];

    function _applySeasonInstant(name) {
        const ns = SEASONS[name];
        ambientLight.color.set(ns.ambientColor);
        ambientLight.intensity = ns.ambientInt;
        sunLight.color.set(ns.sunColor);
        sunLight.intensity     = ns.sunInt * (1 - nightLerp);
        hemisphereLight.color.set(ns.hemiSky);
        hemisphereLight.groundColor.set(ns.hemiGround);
        skyUniforms.uTop.value.set(ns.skyTop);
        skyUniforms.uBottom.value.set(ns.skyBottom);
        scene.fog.color.set(ns.fogColor);
        scene.fog.density = ns.fogDensity;
        renderer.setClearColor(ns.fogColor, 1);
        ground.material.color.set(ns.groundColor);
        grassUniforms.uColor.value.set(ns.grassColor);
        creekUniforms.uColor.value.set(ns.creekColor);
        iceMesh.visible = ns.creekFrozen;
        leafMats.forEach((m, idx) => { m.color.set(ns.leafColors[idx % ns.leafColors.length]); });
        trunkMat.color.set(ns.trunkColor);
        particlesMat.color.set(ns.particleColor);
        particlesMat.size    = ns.particleSize || 0.16;
        particlesMat.opacity = ns.particleSize > 0 ? 0.82 : 0;
        document.body.classList.remove('season-spring', 'season-summer', 'season-fall', 'season-winter');
        document.body.classList.add('season-' + name);
        document.documentElement.style.setProperty('--accent', ns.accentCss);
        const badge = document.getElementById('season-badge');
        if (badge) badge.textContent = ns.badge;
    }

    const seasonManager = {
        get currentSeason()    { return currentSeason; },
        get isTransitioning()  { return _seasonTransitioning; },
        onSeasonChange(cb)     { _seasonListeners.push(cb); },
        setSeason(name) {
    if (!SEASONS[name] || name === currentSeason || _seasonTransitioning) return;

    const ns = SEASONS[name];

    // 🔥 IMMEDIATE STATE UPDATE (fixes your delay)
    currentSeason = name;
    SC = ns;

    // 🔥 Notify systems immediately (audio, UI, etc.)
    _seasonListeners.forEach(cb => cb(name));

    if (REDUCED_MOTION) {
        _applySeasonInstant(name);
        return;
    }

    _seasonTransitioning = true;

    if (typeof gsap === 'undefined') {
        _applySeasonInstant(name);
        _seasonTransitioning = false;
        return;
    }

    /* Fade particles out */
    gsap.to(particlesMat, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            particlesMat.color.set(ns.particleColor);
            particlesMat.size = ns.particleSize || 0.16;

            /* Reset particle positions */
            for (let i = 0; i < PART_MAX; i++) {
                pPos[i * 3]     = camera.position.x + (Math.random() - 0.5) * 60;
                pPos[i * 3 + 1] = camera.position.y + 18 + Math.random() * 8;
                pPos[i * 3 + 2] = camera.position.z + (Math.random() - 0.5) * 60;
            }

            partGeo.attributes.position.needsUpdate = true;

            if (ns.particleSize > 0) {
                gsap.to(particlesMat, { opacity: 0.82, duration: 0.3 });
            }
        }
    });

    /* Smooth visual transition */
    const tl = gsap.timeline({
        duration: 1.5,
        ease: 'power2.inOut',
        onComplete: () => {
            iceMesh.visible = ns.creekFrozen;
            _seasonTransitioning = false;

            document.body.classList.remove(
                'season-spring',
                'season-summer',
                'season-fall',
                'season-winter'
            );
            document.body.classList.add('season-' + name);

            document.documentElement.style.setProperty('--accent', ns.accentCss);

            const badge = document.getElementById('season-badge');
            if (badge) badge.textContent = ns.badge;
        }
    });

    tl.to(scene.fog.color, {
        r: new THREE.Color(ns.fogColor).r,
        g: new THREE.Color(ns.fogColor).g,
        b: new THREE.Color(ns.fogColor).b
    }, 0);

    tl.to(skyUniforms.uTop.value, {
        r: new THREE.Color(ns.skyTop).r,
        g: new THREE.Color(ns.skyTop).g,
        b: new THREE.Color(ns.skyTop).b
    }, 0);

    tl.to(skyUniforms.uBottom.value, {
        r: new THREE.Color(ns.skyBottom).r,
        g: new THREE.Color(ns.skyBottom).g,
        b: new THREE.Color(ns.skyBottom).b
    }, 0);

    tl.to(ambientLight.color, {
        r: new THREE.Color(ns.ambientColor).r,
        g: new THREE.Color(ns.ambientColor).g,
        b: new THREE.Color(ns.ambientColor).b
    }, 0);

    tl.to(ambientLight, {
        intensity: ns.ambientInt * (1 - nightLerp)
    }, 0);

    tl.to(sunLight.color, {
        r: new THREE.Color(ns.sunColor).r,
        g: new THREE.Color(ns.sunColor).g,
        b: new THREE.Color(ns.sunColor).b
    }, 0);

    tl.to(ground.material.color, {
        r: new THREE.Color(ns.groundColor).r,
        g: new THREE.Color(ns.groundColor).g,
        b: new THREE.Color(ns.groundColor).b
    }, 0);

    tl.to(grassUniforms.uColor.value, {
        r: new THREE.Color(ns.grassColor).r,
        g: new THREE.Color(ns.grassColor).g,
        b: new THREE.Color(ns.grassColor).b
    }, 0);

    tl.to(creekUniforms.uColor.value, {
        r: new THREE.Color(ns.creekColor).r,
        g: new THREE.Color(ns.creekColor).g,
        b: new THREE.Color(ns.creekColor).b
    }, 0);

    leafMats.forEach((m, idx) => {
        const col = new THREE.Color(ns.leafColors[idx % ns.leafColors.length]);

        tl.to(m.color, {
            r: col.r,
            g: col.g,
            b: col.b
        }, 0);
    });
}
    };
    window.seasonManager = seasonManager;

    /* ─────────────────────────────────────────────────────────
       T010: Day / Night Cycle (with system pref on load)
    ───────────────────────────────────────────────────────── */
    const LERP_SPEED = REDUCED_MOTION ? 0.12 : 0.018;

    function applySystemDarkMode() {
    const storedTimeLocal = getStoredTimeOfDay();

    // Do not override if user already chose
    if (storedTimeLocal !== null) return;

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isNight = true;
        nightTarget = 1;
        nightLerp   = 1;
        document.body.classList.add('night-mode');

        const dayIcon   = document.querySelector('.day-icon');
        const nightIcon = document.querySelector('.night-icon');
        if (dayIcon)   dayIcon.classList.add('hidden');
        if (nightIcon) nightIcon.classList.remove('hidden');

        const btn = document.getElementById('day-night-btn');
        if (btn) btn.setAttribute('title', 'Switch to Day');
    }
}

    function toggleDayNight() {
        if (Math.abs(nightLerp - nightTarget) > 0.05) return; /* T048: debounce */
        isNight     = !isNight;
        const data = {
        isNight: isNight,
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
     };
        localStorage.setItem('timeOfDay', JSON.stringify(data));
        nightTarget = isNight ? 1 : 0;
        nightTransitioning = true;
        document.body.classList.toggle('night-mode', isNight);
        /* Animate arc clockwise (−π) so sun/moon visibly swap positions */
        const _arc = { v: arcOffset };
        if (typeof gsap !== 'undefined') {
            gsap.to(_arc, { v: arcOffset - Math.PI, duration: 1.6, ease: 'power2.inOut',
                onUpdate: function () { arcOffset = _arc.v; } });
        } else {
            arcOffset -= Math.PI;
        }
    }

    /* ─────────────────────────────────────────────────────────
       LOADING & INTRO ANIMATION (T023–T026)
    ───────────────────────────────────────────────────────── */
    applyLoadingScreenTheme();
    
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

    function applyLoadingScreenTheme() {
    const ls = document.getElementById('loading-screen');
    if (!ls) return;

    const season = currentSeason || 'spring';
    const sc = SEASONS[season];

    if (!sc) return;

    const top = `#${new THREE.Color(sc.skyTop).getHexString()}`;
    const bottom = `#${new THREE.Color(sc.skyBottom).getHexString()}`;

    ls.style.background = `
        linear-gradient(
            180deg,
            ${top} 0%,
            ${bottom} 100%
        )
    `;
}

    function doReveal() {
        const ls = document.getElementById('loading-screen');
        if (ls) { ls.classList.add('fade-out'); setTimeout(() => { ls.style.display = 'none'; }, 900); }

        applySystemDarkMode();

        setTimeout(() => {
            ['main-nav', 'control-strip'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.opacity = '1';
            });
            const eb = document.getElementById('env-badge-wrap');
            if (eb) eb.style.opacity = '1';
            const ss = document.getElementById('season-selector');
            if (ss) ss.style.opacity = '1';
        }, 3200);

        setTimeout(() => {
            const hc = document.getElementById('hero-content');
            if (hc) hc.style.opacity = '1';
            const sh = document.getElementById('scroll-hint');
            if (sh) sh.style.opacity = '1';
        }, 3500);

        startIntro();
    }

    function startIntro() {
        /* T025: prefers-reduced-motion — skip tween */
        if (REDUCED_MOTION || typeof gsap === 'undefined') {
            camera.position.set(0, 3.5, 30);
            camera.lookAt(0, 1, 10);
            camX = 0; camY = 3.5; camZ = 30;
            introDone = true;
            return;
        }

        /* T024: cloud pass-through effect */
        const cloudMats = [];
        cloudGroup.children.forEach(c => c.children.forEach(m => { if (m.material) cloudMats.push(m.material); }));

        gsap.to(camera.position, {
            x: 0, y: 3.5, z: 30,
            duration: 5.5,
            ease: 'power3.inOut',
            onUpdate: () => {
                const py = camera.position.y;
                /* Cloud pass-through: boost opacity when inside cloud layer */
                const inCloud = py > 48 && py < 95;
                cloudMats.forEach(m => { m.opacity = inCloud ? 0.97 : 0.88; });
                if (inCloud) renderer.setClearColor(0xe8f0ec, 1);
                else {
                    const fc = new THREE.Color().lerpColors(new THREE.Color(SC.fogColor), new THREE.Color(NIGHT.fogColor), nightLerp);
                    renderer.setClearColor(fc, 1);
                }
                /* Lerp look-at from high point down */
                const p = Math.max(0, Math.min(1, 1 - (py - 3.5) / (130 - 3.5)));
                camera.lookAt(0, THREE.MathUtils.lerp(60, 1, p), THREE.MathUtils.lerp(0, 10, p));
            },
            onComplete: () => {
                introDone = true;
                camX = 0; camY = 3.5; camZ = 30;
                cloudMats.forEach(m => { m.opacity = 0.88; });
            }
        });
    }

    /* ─────────────────────────────────────────────────────────
       SCROLL
    ───────────────────────────────────────────────────────── */
    window.addEventListener('scroll', () => {
        scrollY   = window.scrollY;
        scrollMax = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    }, { passive: true });

    /* ─────────────────────────────────────────────────────────
       INTERSECTION OBSERVERS
    ───────────────────────────────────────────────────────── */
    const panels    = document.querySelectorAll('.glass-panel');
    const io        = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.18 });
    panels.forEach(p => io.observe(p));

    const skillBars = document.querySelectorAll('.skill-bar');
    const sio = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.style.width = (e.target.dataset.w || 0) + '%'; sio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    skillBars.forEach(b => sio.observe(b));

    /* ─────────────────────────────────────────────────────────
       ANIMATION LOOP
    ───────────────────────────────────────────────────────── */
    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;

        /* — Scroll-driven camera — */
        if (introDone) {
            const t  = scrollY / scrollMax;
            const tz = 30 - t * 200;
            const ty = 3.5 + Math.sin(t * Math.PI) * 4;
            const tx = Math.sin(t * Math.PI * 1.8) * 3;
            camX += (tx - camX) * 0.04;
            camY += (ty - camY) * 0.04;
            camZ += (tz - camZ) * 0.04;
            camera.position.set(camX, camY, camZ);
            camera.lookAt(camX * 0.15, 1.2, camZ - 18);
        }

        /* — Day / Night lerp — */
        const prevLerp = nightLerp;
        nightLerp += (nightTarget - nightLerp) * LERP_SPEED;
        if (Math.abs(nightLerp - nightTarget) < 0.001) { nightLerp = nightTarget; nightTransitioning = false; }
        const nl = nightLerp;

        sunLight.intensity   = SC.sunInt  * (1 - nl);
        moonLight.intensity  = 0.9        * nl;
        ambientLight.intensity = THREE.MathUtils.lerp(SC.ambientInt, NIGHT.ambientInt, nl);
        ambientLight.color.lerpColors(_ca.set(SC.ambientColor), _cb.set(NIGHT.ambientColor), nl);
        skyUniforms.uTop.value.lerpColors(   _ca.set(SC.skyTop),    _cb.set(NIGHT.skyTop),    nl);
        skyUniforms.uBottom.value.lerpColors(_ca.set(SC.skyBottom), _cb.set(NIGHT.skyBottom), nl);
        _cc.set(SC.fogColor); const fc = _cc.lerpColors(_ca.set(SC.fogColor), _cb.set(NIGHT.fogColor), nl);
        scene.fog.color.copy(fc);
        if (!introDone || camera.position.y <= 48) renderer.setClearColor(fc, 1);

        /* Sun/moon visibility is set in the arc section below */
        renderer.toneMappingExposure = THREE.MathUtils.lerp(1.1, 0.6, nl);

        /* T039: Star field opacity */
        starMat.opacity = Math.max(nl - 0.2, 0) * 1.3;

        /* Moon/sun arc is handled further below, after star field */

        /* — Fireflies — */
        ffMat.opacity = Math.max(nl - 0.15, 0) * 1.1;
        if (nl > 0.1) {
            const fa = ffGeo.attributes.position.array;
            for (let i = 0; i < FF_COUNT; i++) {
                const d  = ffData[i];
                const t2 = time * d.sp + d.ph;
                fa[i*3]     = d.bx + Math.sin(t2) * d.r;
                fa[i*3 + 1] = d.by + Math.sin(t2 * 1.6) * 0.8;
                fa[i*3 + 2] = d.bz + Math.cos(t2 * 0.75) * d.r;
            }
            ffGeo.attributes.position.needsUpdate = true;
            ffMat.size = 0.3 + (Math.sin(time * 1.8) * 0.5 + 0.5) * 0.25 * nl;
        }

        /* T037: Grass uniforms */
        grassUniforms.uTime.value         = time;
        grassUniforms.uWindStrength.value = REDUCED_MOTION ? 0.01 : 0.35;
        grassOutlineMat.uniforms.uTime.value = time;

        /* — Seasonal particles — */
        if (particlesMat.opacity > 0.01) {
            for (let i = 0; i < PART_MAX; i++) {
                const v = pVel[i];
                v.wb += v.ws;
                pPos[i*3]     += v.vx + Math.sin(v.wb) * 0.008;
                pPos[i*3 + 1] += v.vy + (currentSeason === 'winter' ? 0 : Math.cos(v.wb * 0.7) * 0.004);
                pPos[i*3 + 2] += v.vz;
                if (pPos[i*3 + 1] < -3) {
                    pPos[i*3]     = camera.position.x + (Math.random() - 0.5) * 60;
                    pPos[i*3 + 1] = camera.position.y + 18 + Math.random() * 8;
                    pPos[i*3 + 2] = camera.position.z + (Math.random() - 0.5) * 60;
                }
            }
            partGeo.attributes.position.needsUpdate = true;
        }

        /* — Rain — */
        if (rainMat.opacity > 0.01) {
            const ra = rainGeo.attributes.position.array;
            for (let i = 0; i < RAIN_COUNT; i++) {
                ra[i*3]     += 0.06;
                ra[i*3 + 1] -= 0.55;
                if (ra[i*3 + 1] < -3) {
                    ra[i*3]     = camera.position.x + (Math.random() - 0.5) * 70;
                    ra[i*3 + 1] = camera.position.y + 22;
                    ra[i*3 + 2] = camera.position.z + (Math.random() - 0.5) * 70;
                }
            }
            rainGeo.attributes.position.needsUpdate = true;
        }

        /* T047: Creek time */
        creekUniforms.uTime.value = time;

        /* — Clouds drift — */
        for (let i = 0; i < cloudGroup.children.length; i++) {
            const cl = cloudGroup.children[i];
            cl.position.x += 0.006 * (1 + (i % 4) * 0.25);
            cl.position.y += Math.sin(time * 0.15 + i * 0.4) * 0.003;
            if (cl.position.x > 140) cl.position.x = -140;
        }

        /* — Tree sway — */
        for (let i = 0; i < treeGroup.children.length; i++) {
            const tr = treeGroup.children[i];
            const sw = REDUCED_MOTION ? 0 : (0.0025 + (currentSeason === 'winter' ? 0.002 : 0));
            tr.rotation.z = Math.sin(time * 0.45 + i * 0.55) * sw;
            tr.rotation.x = Math.cos(time * 0.35 + i * 0.38) * sw * 0.4;
        }

        /* — Sun arc — sweeps across the sky in front of the camera —
           Horizontal arc in XY-plane at fixed Z = -320 (always ahead of camera).
           One full cycle every ~785 s at speed 0.008; well within camera frustum. */
        const sa   = time * 0.008 + arcOffset;
        const sunX = Math.cos(sa) * 80;           /* left–right sweep ±80  */
        const sunY = 48 + Math.sin(sa) * 65;      /* rises 113 → sets -17  */
        const sunZ = -280;
        sunMesh.position.set(sunX, sunY, sunZ);
        sunGlowMesh.position.copy(sunMesh.position);
        sunLight.position.set(sunX, sunY, sunZ);

        /* Hide sun below horizon or in night mode */
        const sunAbove = sunY > -10;
        sunMesh.visible      = nl < 0.6  && sunAbove;
        sunGlowMesh.visible  = nl < 0.55 && sunAbove;

        /* — Moon arc — offset by π so it rises when sun sets — */
        const moonX = Math.cos(sa + Math.PI) * 80;
        const moonY = 48 + Math.sin(sa + Math.PI) * 65;
        moonMesh.position.set(moonX, moonY, sunZ);
        moonGlowMesh.position.copy(moonMesh.position);
        moonLight.position.set(moonX, moonY, sunZ);

        const moonAbove = moonY > -20;
        moonMesh.visible     = nl > 0.25 && moonAbove;
        moonGlowMesh.visible = nl > 0.20 && moonAbove;

        /* — Aurora Borealis — visible only in Winter night — */
        if (currentSeason === 'winter' && nl > 0.25) {
            auroraMesh.visible = true;
            auroraUniforms.uTime.value      = time;
            auroraUniforms.uIntensity.value = Math.min((nl - 0.25) / 0.75, 1.0);
        } else {
            auroraMesh.visible = false;
        }

        renderer.render(scene, camera);
    }
    animate();

    /* ─────────────────────────────────────────────────────────
       RESIZE
    ───────────────────────────────────────────────────────── */
    window.addEventListener('resize', () => {
        camera.aspect = W() / H();
        camera.updateProjectionMatrix();
        renderer.setSize(W(), H());
    });

    /* ─────────────────────────────────────────────────────────
       PUBLIC API
    ───────────────────────────────────────────────────────── */
    window.forestScene = {
        toggleDayNight,
        setRain(v) {
            if (typeof gsap !== 'undefined') gsap.to(rainMat, { opacity: v ? 0.55 : 0, duration: 2 });
            else rainMat.opacity = v ? 0.55 : 0;
        },
        get isNight()   { return isNight; },
        get introDone() { return introDone; }
    };

    window.grassSystem = {
        get tier() { return TIER; },
        setWind(strength, dirX, dirZ) {
            grassUniforms.uWindStrength.value      = strength;
            grassUniforms.uWindDirection.value.set(dirX, dirZ);
        }
    };

}());