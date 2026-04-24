# Research: Immersive Forest Scene Overhaul

**Branch**: `001-forest-scene-overhaul` | **Phase**: 0 | **Date**: 2026-04-18

---

## 1. Existing Codebase Audit

### What already exists

| Component | File | Status |
|-----------|------|--------|
| Three.js r128 scene, renderer, camera | `js/world.js` | ✅ Present |
| Sky gradient shader | `js/world.js` §5 | ✅ Present |
| Sun/Moon meshes | `js/world.js` §5 | ✅ Present (moon arc missing) |
| Ground plane (procedural terrain) | `js/world.js` §6 | ✅ Present |
| Trees (stacked ConeGeometry) | `js/world.js` §7 | ✅ Present |
| Water (flat PlaneGeometry, lake-like) | `js/world.js` §9 | ⚠️ Needs creek replacement |
| Clouds (SphereGeometry groups) | `js/world.js` §10 | ✅ Present |
| Seasonal particles (Points) | `js/world.js` §11 | ✅ Present (not runtime-switchable) |
| Loading screen + GSAP intro tween | `js/world.js` §15 | ✅ Present |
| Day/night lerp state machine | `js/world.js` §18–19 | ✅ Present |
| Scroll-driven camera | `js/world.js` §16/19 | ✅ Present |
| Season detection (calendar month) | `js/world.js` §2 | ⚠️ Auto-only, no manual switch |
| Contact form (honeypot, validation, mailto:) | `js/ui.js` | ⚠️ Email is placeholder |
| CSS glass panels with backdrop-blur | `css/style.css` | ✅ Present |
| Day/night toggle button | `js/ui.js` | ✅ Present |

### What is missing

| Feature | Status |
|---------|--------|
| Grass sprites (InstancedMesh + cel-shader) | ❌ Missing |
| Runtime season switching (manual selector UI) | ❌ Missing |
| Star field (night mode particles) | ❌ Missing |
| Moon arc animation | ❌ Missing |
| Animated creek (winding path replacing lake) | ❌ Missing |
| Performance tier detection (desktop/mobile auto-scale) | ❌ Missing |
| SRI hashes on CDN scripts | ❌ Missing (Constitution IV violation) |
| Email obfuscation in contact form | ❌ Missing |
| WebGL fallback | ❌ Missing |
| Season floating selector UI | ❌ Missing |
| System dark-mode preference auto-detection on load | ❌ Missing |

---

## 2. Grass Cel-Shading System

### Decision
Use `THREE.InstancedMesh` with a custom `ShaderMaterial` for wind sway and cel-shading.
All per-blade transforms computed on the GPU via vertex shader uniforms (`uTime`, `uWindStrength`).

### Rationale
- InstancedMesh collapses N blades to a single draw call — critical for performance.
- GPU-side wind math (sine wave per blade, phase offset from instance ID) avoids CPU
  per-blade updates each frame, keeping the main thread free for JS logic.
- Cel-shading: fragment shader discretizes the diffuse dot product into 2–3 tonal bands
  + a dark outline via backface normal inflation in a second render pass.

### Performance tiers

| Tier | Criterion | Blade count | Shadow map |
|------|-----------|-------------|------------|
| HIGH | Desktop, `devicePixelRatio ≥ 1`, `hardwareConcurrency ≥ 4` | 8 000 | 2048² |
| MED | Tablet or mid-range | 3 000 | 1024² |
| LOW | Mobile `devicePixelRatio ≥ 2` or `hardwareConcurrency ≤ 2` | 1 000 | 512² |

Tier detected once at startup; grass count and shadow map size set before scene build.

### Alternatives considered
- **Sprite sheets (Billboard quads)**: Simpler but CPU-updated, worse performance at scale.
- **Geometry instancing via Three.js `Sprite`**: No custom shaders, no cel-shading possible.
- **Compute shaders / WebGPU**: Not supported in Three.js r128 / target browsers.

---

## 3. Runtime Season Switching

### Decision
Refactor `world.js` to expose a `SeasonManager` that holds the current season state and
propagates changes to all scene subsystems via GSAP tweens.

### Rationale
Currently the `SEASON` constant is frozen at startup. Switching seasons requires
interpolating: ground material color, tree leaf material colors, particle color/size,
sky gradient uniforms, fog color, and creek color — all of which support GSAP tweening
via `onUpdate` callbacks against Three.js Color objects.

### Season floating selector
A fixed `<div>` in the bottom-right corner (above `z-index 50`) with four icon buttons
(🌸 ☀️ 🍁 ❄️). Clicking one calls `seasonManager.setSeason(name)`. Active season
highlighted with the season's accent color.

### Transition design
GSAP timeline, duration 1.5 s, `power2.inOut` ease:
1. Tween all material colors and shader uniforms.
2. Fade particles out (0.3 s), swap color, fade back in (0.3 s).
3. Update CSS body class (`season-spring` etc.) for CSS variable cascade.

---

## 4. Star Field (Night Mode)

### Decision
Add a `THREE.Points` star system (2 000 points) on a large sphere (radius 450).
Stars fade in via `material.opacity` driven by `nightLerp` in the animation loop.

### Rationale
Points geometry is the cheapest star representation. A per-point size variation
(stored in a `size` attribute and enabled via `sizeAttenuation`) creates depth.
A subtle twinkle is achievable by adding a slow `sin(uTime + phase)` to opacity
in a custom `ShaderMaterial`.

---

## 5. Moon Arc & Illumination

### Decision
Animate `moonMesh.position` along a counter-arc to the sun: when `nightLerp > 0.25`
the moon rises, following `moonAngle = time * 0.012 + Math.PI`. `moonLight` intensity
driven by `nightLerp`. Moon position also drives `moonLight.position`.

### Rationale
Existing `sunMesh` already arcs with `time * 0.015`. Moon reuses the same pattern
on a phase offset. No additional geometry needed.

---

## 6. Animated Creek (Creek Shader)

### Decision
Replace the flat `PlaneGeometry` water with a custom creek built from a
`THREE.CatmullRomCurve3` path extruded into a narrow `TubeGeometry` (or a custom
plane following the curve). The creek ShaderMaterial scrolls UVs over time to simulate
flow and adds caustic highlights.

### Creek path
A fixed Catmull-Rom spline winding through the forest floor (left of centre path),
8–12 control points, width ≈ 3–5 units, rendered as a flat mesh lying on the ground.

### Winter freeze
A secondary semi-transparent mesh (ice material, `opacity: 0.6`, `color: 0xd0eeff`)
overlaid on the creek edges fades in when `SEASON === 'winter'`.

### Rationale
TubeGeometry along a spline gives a natural winding appearance. Scrolling UVs are the
cheapest animated water effect (no additional textures needed, shader-only). This fully
replaces the existing flat PlaneGeometry "lake" which looks out of place.

---

## 7. Text Readability & Layering

### Decision
The Three.js canvas remains at `z-index: 0` with `pointer-events: none`. All content
lives in `#portfolio-scroll` at `z-index: 1`. Glass panels use
`backdrop-filter: blur(16px)` + `background: rgba(8,18,8,0.72)` — sufficient for WCAG AA.

### Issue found
The hero text (`#hero-content`) renders over the canvas without a glass backing — it
can blend with bright sky colours during certain seasons (Spring/Summer). Fix: add a
subtle text-shadow and/or a semi-transparent backdrop behind the hero title block.

---

## 8. Contact Form Security

### Decision
- Assemble destination email in JS at submit time via string concatenation/split,
  never as a literal in HTML or a named constant visible in source.
- Keep existing honeypot (`name="_hp"`) and 10-second rate limit (already implemented).
- Add time-on-form gate: record `formLoadTime = Date.now()` on DOMContentLoaded;
  reject submit if `Date.now() - formLoadTime < 3000`.

### Pattern for email obfuscation
```js
// Split across non-obvious segments, assembled only at submit:
const _a = 'khalednached', _b = '11', _c = '@gmail', _d = '.com';
const dest = _a + _b + _c + _d;
```
Stored in a closure, never exposed as a global variable or data attribute.

---

## 9. SRI Hashes (Constitution IV Compliance)

### Decision
Add `integrity` + `crossorigin="anonymous"` attributes to all three CDN `<script>` and
`<link>` tags (Three.js r128, GSAP 3.12.2, Tailwind CDN).

### Issue
Tailwind's `cdn.tailwindcss.com` script does not publish a stable SRI hash (it
dynamically injects styles). Recommended mitigation: replace with a pinned Tailwind
CSS build output (generated once, committed to `css/`) to avoid CDN dependency entirely.

### Complexity note (Constitution IV)
SRI for Three.js and GSAP from cdnjs is straightforward — hashes are available in their
release manifests. Tailwind CDN replacement is a one-time task (run Tailwind CLI to
generate output, commit file, remove CDN script).

---

## 10. WebGL Fallback

### Decision
Wrap renderer creation in `try/catch`. If `THREE.WebGLRenderer` throws (no WebGL),
add class `no-webgl` to `<body>`, hide `#three-canvas`, and apply a CSS gradient
background to `body` matching the current season palette.

---

## 11. Mobile Responsiveness

### Decisions
- Pixel ratio capped at `Math.min(devicePixelRatio, 2)` — already in place.
- Grass, particle counts, and shadow map size driven by tier (see §2 table).
- Season selector pill uses `env(safe-area-inset-bottom)` to clear iOS home bar.
- Scroll-driven camera uses `passive: true` event listener — already in place.
- All layout uses `clamp()` CSS for fluid sizing — already in `style.css`.
