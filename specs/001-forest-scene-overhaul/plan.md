# Implementation Plan: Immersive Forest Scene Overhaul

**Branch**: `001-forest-scene-overhaul` | **Date**: 2026-04-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-forest-scene-overhaul/spec.md`

---

## Summary

Overhaul the existing Three.js forest portfolio scene to add: a cinematic cloud-descent
intro on every page load; cel-shaded InstancedMesh grass with GPU wind physics; a
runtime-switchable four-season system with a floating selector UI; a full day/night
cycle driven by the existing toggle (sun arc, star field, moonrise, forest illumination
transitions in 3–8 s); an animated winding creek replacing the out-of-place lake
geometry; WCAG AA-compliant text layering across all scene states; a frontend-only
`mailto:` contact form with honeypot, time gate, and email obfuscation; and adaptive
performance scaling (60 fps desktop / 30 fps mobile).

---

## Technical Context

**Language/Version**: Vanilla JavaScript (ES2020), HTML5, CSS3
**Primary Dependencies**: Three.js r128 (CDN + SRI), GSAP 3.12.2 + ScrollTrigger (CDN + SRI), Tailwind CSS (replaced with committed build output), Google Fonts (CDN)
**Storage**: None — static frontend, no persistence beyond session
**Testing**: Manual browser testing (Chrome, Safari, Firefox + mobile emulation); Lighthouse for accessibility/performance
**Target Platform**: Desktop browsers (Chrome 110+, Safari 16+, Firefox 115+) + Mobile (iOS Safari, Android Chrome); minimum viewport 375 px
**Project Type**: Static frontend web application (single-page portfolio)
**Performance Goals**: ≥ 60 fps desktop, ≥ 30 fps mobile; season switch ≤ 2 s desktop / ≤ 3 s mobile; day/night transition 3–8 s
**Constraints**: Frontend-only (no backend, no build system required), all secrets/email assembled at runtime in closures
**Scale/Scope**: Single-page portfolio, one visitor session at a time

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Secure Coding Foundation | Input validation + sanitization at all boundaries; no hardcoded credentials | ✅ PASS | Contact form uses `createTextNode` sanitization; email assembled at runtime in closure; honeypot + time gate |
| II. Content Security Policy | CSP meta tag or header; no inline scripts/eval | ⚠️ NEEDS ACTION | Inline `<script>` blocks in `index.html` (Tailwind config, GSAP calls). Mitigation: move to external JS files; add CSP meta tag allowing only enumerated CDN origins |
| III. Data Protection & HTTPS | HTTPS in production; no PII in localStorage/URL | ✅ PASS | Static frontend, no session tokens; `mailto:` form constructs no URLs with PII |
| IV. Third-Party Integration Safety | SRI hashes on all CDN resources; pinned versions | ⚠️ NEEDS ACTION | Three.js r128 + GSAP 3.12.2 from cdnjs lack SRI attributes; Tailwind CDN has no stable SRI. Resolution: add SRI to Three.js + GSAP; replace Tailwind CDN with committed build |
| V. Security-Aware UX | Security controls do not create friction; clear feedback | ✅ PASS | Form validation is inline/real-time; honeypot is invisible; mailto: is standard UX |

**Post-design re-check**: Both ⚠️ items are resolved by implementation tasks (T003 CSP meta tag; T004 SRI hashes + Tailwind build). No blocking violations requiring plan halt.

---

## Complexity Tracking

| Noted complexity | Why needed | Simpler alternative rejected because |
|-----------------|------------|--------------------------------------|
| Inline `<script>` block for Tailwind config | Tailwind CDN requires config inline | Resolved by switching to committed Tailwind build output — inline block removed entirely |
| InstancedMesh + custom ShaderMaterial for grass | 5 000–8 000 blades require single draw call | Per-mesh approach crashes performance; Sprite-based approach cannot do cel-shading |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-forest-scene-overhaul/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── window-api.md    ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
forest-portfolio 2/
├── index.html                    ← Markup; CDN scripts with SRI; no inline JS blocks
├── css/
│   ├── style.css                 ← Custom styles + CSS variables (extended for grass,
│   │                                season selector, creek, star field, text overlays)
│   └── tailwind.css              ← Committed Tailwind build output (replaces CDN script)
└── js/
    ├── world.js                  ← Core scene: renderer, camera, sky, lighting, ground,
    │                                trees, clouds, scroll camera, resize, WebGL fallback,
    │                                SeasonManager, DayNightCycle, StarField, GrassSystem,
    │                                Creek, ParticleEmitter, intro animation
    └── ui.js                     ← DOM: season selector, day/night button, contact form
                                     (with obfuscated email, honeypot, time gate),
                                     audio, nav scroll, skill bars, panel reveals
```

**Structure decision**: Single-project static frontend. All Three.js scene logic stays
in `world.js` (extended, not split into separate files — avoids adding a module bundler).
`ui.js` handles all DOM-side interactions and calls `window.forestScene` /
`window.seasonManager` APIs. This keeps the zero-build-tool constraint intact.

---

## Phase 0: Research Summary

See `research.md` for full findings. Key resolved decisions:

| Unknown | Resolution |
|---------|-----------|
| Grass rendering approach | `THREE.InstancedMesh` + custom `ShaderMaterial` (GPU wind + cel-shading) |
| Season switching at runtime | `SeasonManager` singleton; GSAP tweens all material colors/uniforms over 1.5 s |
| Star field | `THREE.Points` (2 000) on sphere radius 450; opacity driven by `nightLerp` |
| Moon arc | Same arc pattern as sun, phase-offset by π; position drives `moonLight` |
| Creek geometry | Catmull-Rom spline → planar strip + scrolling UV shader; ice overlay for Winter |
| Text readability | Canvas at z-index 0 `pointer-events:none`; glass panels at z-index 1; hero text gets text-shadow + backdrop |
| Email obfuscation | Runtime string concatenation in submit handler closure |
| SRI compliance | Three.js + GSAP: add hashes; Tailwind: replace CDN with committed build |
| WebGL fallback | try/catch on renderer init; `no-webgl` body class → CSS gradient background |
| System dark-mode | `window.matchMedia('(prefers-color-scheme: dark)')` on load; skip transition animation |

---

## Phase 1: Design Summary

### Key design decisions

**GrassSystem** — InstancedMesh approach:
- One `THREE.InstancedMesh` with a thin `PlaneGeometry` (2 tris) per blade.
- Per-blade transforms (position, random rotation, scale) set via `setMatrixAt()` once at init.
- Wind sway entirely in vertex shader: `sin(uTime * 1.5 + instanceId * 0.37) * uWindStrength`.
- Cel-shading: fragment shader discretizes NdotL into 3 bands; dark outline via second backface pass.
- Blade counts: HIGH=8 000, MED=3 000, LOW=1 000 (see PerformanceTier in data-model.md).

**SeasonManager** — runtime switching:
- Holds a GSAP timeline per switch; tweens `THREE.Color` objects for all materials.
- Particle fade-out → color swap → fade-in pattern (total 1.5 s).
- Updates `document.body.className` for CSS variable cascade.

**DayNightCycle** — system pref + animation:
- On load: check `matchMedia('prefers-color-scheme: dark')`, set `nightLerp = nightTarget = isNight ? 1 : 0` immediately (no animation).
- Toggle: flip `nightTarget`; `nightLerp` approaches target at `LERP_SPEED = 0.018` per frame (≈55 fps → ~3–5 s transition).

**Creek** — geometry:
- 8 Catmull-Rom control points produce a smooth winding path.
- Path extruded to a 3-unit-wide flat strip using custom geometry builder.
- ShaderMaterial scrolls `vUv.x` by `uTime * uFlowSpeed` for flow animation.
- Ice mesh: second `THREE.Mesh` sharing the same path, slightly wider, with `opacity: 0.6` ice-blue material; shown only in Winter.

**Text readability**:
- Hero title: `text-shadow: 0 2px 12px rgba(0,0,0,0.8)`.
- All section glass panels: `backdrop-filter: blur(16px)` + `background: rgba(8,18,8,0.72)` — already provides WCAG AA.
- Canvas: `pointer-events: none; z-index: 0`. Content: `z-index: 1`.

**Contact form**:
- Email assembled: `const _d = ['khalednached','11','@','gmail','.com']; dest = _d.join('');`
- Stored inside the `submit` event handler's closure — never on `window` or in DOM.

**Season selector**:
- `<div id="season-selector">` injected by `ui.js`, fixed bottom-right, z-index 100.
- Four `<button>` elements with `data-season` attributes.
- CSS: pill shape, semi-transparent glass background, matching `--accent` active highlight.
- `padding-bottom: env(safe-area-inset-bottom)` for iOS home bar clearance.

### Artifacts produced

- `specs/001-forest-scene-overhaul/research.md` ✅
- `specs/001-forest-scene-overhaul/data-model.md` ✅
- `specs/001-forest-scene-overhaul/contracts/window-api.md` ✅
- `specs/001-forest-scene-overhaul/quickstart.md` ✅
