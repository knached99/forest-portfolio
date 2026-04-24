---
description: "Task list for Immersive Forest Scene Overhaul"
---

# Tasks: Immersive Forest Scene Overhaul

**Input**: Design documents from `specs/001-forest-scene-overhaul/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/window-api.md ✅ | quickstart.md ✅

**Project root for all source paths**: `forest-portfolio 2/` (nested directory)

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Security baseline and build infrastructure. These tasks are prerequisites
for all user story work and have no dependencies on each other.

- [X] T001 [P] Replace Tailwind CDN `<script>` with committed build — generate `forest-portfolio 2/css/tailwind.css` via Tailwind CLI and update `forest-portfolio 2/index.html` `<link>` tag
- [X] T002 [P] Add SRI `integrity` + `crossorigin="anonymous"` attributes to Three.js r128 and GSAP 3.12.2 CDN `<script>` tags in `forest-portfolio 2/index.html`
- [X] T003 [P] Add `<meta http-equiv="Content-Security-Policy">` to `forest-portfolio 2/index.html` permitting only enumerated CDN origins for scripts, styles, fonts; block inline eval
- [X] T004 [P] Remove the inline Tailwind `<script>` config block from `forest-portfolio 2/index.html`; move Tailwind dark-mode and font theme config into `forest-portfolio 2/css/tailwind.css` build step
- [X] T005 [P] Add WebGL fallback to `forest-portfolio 2/js/world.js`: wrap `THREE.WebGLRenderer` init in `try/catch`; on failure add `no-webgl` class to `document.body`, hide `#three-canvas`, and return early
- [X] T006 [P] Add `.no-webgl` CSS rule to `forest-portfolio 2/css/style.css`: apply a season-appropriate CSS gradient as `body` background when canvas is unavailable

**Checkpoint**: Security baseline complete — CSP, SRI, Tailwind build, WebGL fallback all in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core scene infrastructure shared by all user stories — PerformanceTier
detection, SeasonManager, and DayNightCycle. No user story can begin until this is done.

⚠️ **CRITICAL**: Phases 3–10 depend on this phase being complete.

- [X] T007 Implement `PerformanceTier` detection in `forest-portfolio 2/js/world.js`: evaluate `navigator.hardwareConcurrency` and `window.devicePixelRatio` once at startup; set module-level constant `TIER` to `'HIGH'|'MED'|'LOW'`; use TIER to set renderer pixel ratio cap and shadow map sizes
- [X] T008 Refactor season data in `forest-portfolio 2/js/world.js`: expand each `SEASONS` entry with `grassColor`, `grassDensity`, `particleColor`, `particleSize`, `creekColor`, `creekFrozen`, and `accentCss` fields per data-model.md SeasonConfig
- [X] T009 Implement `SeasonManager` singleton in `forest-portfolio 2/js/world.js`: `currentSeason` (init from calendar month), `isTransitioning` flag, `setSeason(name)` method (GSAP 1.5 s tween across all scene material colors/uniforms + CSS class swap), `onSeasonChange(cb)` listener registry; expose as `window.seasonManager`
- [X] T010 Refactor `DayNightCycle` in `forest-portfolio 2/js/world.js`: add `LERP_SPEED = 0.018` constant; on init check `window.matchMedia('(prefers-color-scheme: dark)')` and set `nightLerp = nightTarget = 1` immediately (no animation) if dark mode preferred; expose updated `window.forestScene.toggleDayNight()` and `window.forestScene.isNight`

**Checkpoint**: Foundation ready — all user story implementations can now begin.

---

## Phase 3: User Story 6 — Content Readability & UI Non-Interference (Priority: P1) 🎯 MVP

**Goal**: All text and interactive elements are readable (WCAG AA) in every scene state.
**Independent Test**: Open page; verify hero, nav, all section headings/body text pass
4.5:1 contrast in all 4 seasons × 2 modes (8 combinations) using browser accessibility tools.

### Implementation for User Story 6

- [X] T011 [US6] Fix hero text layering in `forest-portfolio 2/css/style.css`: add `text-shadow: 0 2px 12px rgba(0,0,0,0.85)` and a `background: rgba(0,0,0,0.18); border-radius: 8px; padding: ...` backdrop to `.hero-content` so text remains readable against bright Spring/Summer skies
- [X] T012 [US6] Verify `#three-canvas` has `pointer-events: none; z-index: 0` and `#portfolio-scroll` has `position: relative; z-index: 1` in `forest-portfolio 2/css/style.css`; add rules if missing
- [X] T013 [US6] Ensure all `.glass-panel` elements have `backdrop-filter: blur(16px)` and `background: rgba(8,18,8,0.72)` in `forest-portfolio 2/css/style.css`; verify contrast passes WCAG AA by inspecting against each season's skyBottom color
- [X] T014 [US6] Add `prefers-reduced-motion` media query block to `forest-portfolio 2/css/style.css`: disable CSS transitions on `.glass-panel`, `.reveal-panel`, `.loading-progress`; corresponding JS check in `forest-portfolio 2/js/world.js` to skip GSAP tweens on intro and season transitions when `prefers-reduced-motion` is set

**Checkpoint**: Text readable across all seasons/modes; intro animation doesn't block UI.

---

## Phase 4: User Story 7 — Secure Contact Form (Priority: P1)

**Goal**: Frontend-only `mailto:` form with honeypot, time gate, email obfuscation, and sanitization.
**Independent Test**: Submit form; mail client opens. Inspect DevTools Sources — no email address as plain string. Test honeypot and time gate suppression.

### Implementation for User Story 7

- [X] T015 [US7] Replace placeholder email `hello@alexchen.dev` in `forest-portfolio 2/js/ui.js` with runtime-assembled obfuscated address: define `const _d = ['khalednached','11','@','gmail','.com']` inside the `submit` event handler closure; concatenate to `dest` only at submit time; never assign to a global or data attribute
- [X] T016 [US7] Add time-on-form gate to `forest-portfolio 2/js/ui.js`: record `const _ft = Date.now()` at `DOMContentLoaded`; in `submit` handler, silent abort if `Date.now() - _ft < 3000`
- [X] T017 [US7] Verify existing honeypot (`[name="_hp"]`) and 10-second rate limit are present in `forest-portfolio 2/js/ui.js`; if missing, add them; confirm silent abort (no error shown to user, no mailto triggered)
- [X] T018 [US7] Add mail-client-unavailable fallback in `forest-portfolio 2/js/ui.js`: after `window.location.href = mailtoHref`, set a `setTimeout` of 1 500 ms; if page is still focused (mail client didn't open), show a fallback message in `#form-success` with the email address as a readable (not obfuscated) fallback string for manual copy

**Checkpoint**: Form submits via native mailto:; no credentials/email in source; bots suppressed.

---

## Phase 5: User Story 8 — Mobile Responsiveness (Priority: P1)

**Goal**: All features perform correctly on 375 px viewports at ≥ 30 fps.
**Independent Test**: Chrome DevTools → Device toolbar → iPhone SE (375×667). No horizontal overflow; season selector above iOS home bar; animations run smoothly.

### Implementation for User Story 8

- [X] T019 [US8] Wire `TIER` constant (from T007) into renderer setup in `forest-portfolio 2/js/world.js`: LOW → `renderer.setPixelRatio(1)` + shadow map 512²; MED → `renderer.setPixelRatio(Math.min(dpr,1.5))` + 1024²; HIGH → existing `Math.min(dpr,2)` + 2048²
- [X] T020 [US8] Add responsive CSS for season selector (Phase 8 / T039) in `forest-portfolio 2/css/style.css`: `padding-bottom: max(12px, env(safe-area-inset-bottom))`; on viewports ≤ 480 px, reduce button size to 36 × 36 px and pill gap to 4 px
- [X] T021 [US8] Add responsive CSS for HUD in `forest-portfolio 2/css/style.css`: on viewports ≤ 480 px, reduce nav logo font size and button sizes; ensure no element overflows horizontally
- [X] T022 [US8] Verify `overflow-x: hidden` on `body` and `#portfolio-scroll` in `forest-portfolio 2/css/style.css`; test all section panels with `clamp()` widths on 375 px viewport

**Checkpoint**: Page loads, scrolls, and animates correctly on mobile; no horizontal overflow.

---

## Phase 6: User Story 1 — Cinematic Intro Animation (Priority: P1)

**Goal**: Camera descends from above clouds through fog into forest on every page load.
**Independent Test**: Hard-reload page; camera starts above cloud layer, passes through fog, arrives at forest level (~5 s). Scroll and click during animation — content is interactive.

### Implementation for User Story 1

- [X] T023 [US1] Verify camera initial position in `forest-portfolio 2/js/world.js` is `(0, 130, 40)` looking at `(0, 50, 0)` — confirmed in existing code; adjust cloud layer Y positions (55–95) so camera visibly passes through them during descent
- [X] T024 [US1] Enhance cloud pass-through effect in `forest-portfolio 2/js/world.js`: when `camera.position.y` is between 50 and 90 during intro tween, temporarily increase cloud material `opacity` to 0.95 and set `renderer.setClearColor` to a lighter fog color (`0xe8f0ec`) to simulate entering cloud layer; restore after camera exits below y=50
- [X] T025 [US1] Update `startIntro()` in `forest-portfolio 2/js/world.js` to respect `prefers-reduced-motion`: if `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, skip GSAP tween and immediately set `camera.position.set(0, 3.5, 30)`; call `camera.lookAt(0,1,10)`; set `introDone = true`
- [X] T026 [US1] Ensure `#portfolio-scroll` is fully interactive during intro in `forest-portfolio 2/css/style.css` and `forest-portfolio 2/index.html`: confirm `pointer-events: auto` on `#portfolio-scroll`; `pointer-events: none` on `#three-canvas`; no overlay div blocking scroll during animation

**Checkpoint**: Intro plays on every load; cloud passage visible; page content immediately scrollable.

---

## Phase 7: User Story 3 — Season Selection (Priority: P2)

**Goal**: Visitors switch seasons in real time via a floating pill selector; full scene updates in ≤ 2 s.
**Independent Test**: Click each of 4 season buttons; trees, ground, particles, sky update without reload; transition ≤ 2 s; active button highlighted.

### Implementation for User Story 3

- [X] T027 [US3] Add season selector HTML to `forest-portfolio 2/index.html`: `<div id="season-selector" role="group" aria-label="Select season">` with four `<button data-season="...">` children (🌸 ☀️ 🍁 ❄️) per contracts/window-api.md; place inside `<body>` after `#env-badge-wrap`
- [X] T028 [US3] Add season selector CSS to `forest-portfolio 2/css/style.css`: fixed position bottom-right (above `z-index 100`); pill shape with glass background; `.season-btn` sizing; `.season-btn--active` highlighted with `--accent` color; transition on hover/active states
- [X] T029 [US3] Wire season selector in `forest-portfolio 2/js/ui.js`: on each `.season-btn` click, call `window.seasonManager.setSeason(btn.dataset.season)`; disable all buttons while `seasonManager.isTransitioning`; update `.season-btn--active` class; update `#season-badge` text
- [X] T030 [US3] Implement `SeasonManager.setSeason()` GSAP tween body in `forest-portfolio 2/js/world.js`: tween `scene.fog.color`, `skyUniforms.uTop.value`, `skyUniforms.uBottom.value`, `ambientLight.color`, `sunLight.color`, `ground.material.color`, all tree leaf material colors over 1.5 s `power2.inOut`; update `document.body.className` replacing old season class
- [X] T031 [US3] Add particle season-switch animation in `forest-portfolio 2/js/world.js` as part of `setSeason()`: fade `particlesMat.opacity` to 0 over 0.3 s, swap `particlesMat.color` and `particlesMat.size` to new season values, reset particle positions above camera, fade back to 0.82 over 0.3 s; enable/disable particle system for Summer (opacity: 0)
- [X] T032 [US3] Add grass color tween in `forest-portfolio 2/js/world.js` `setSeason()`: tween `grassMaterial.uniforms.uColor.value` to new season's `grassColor` over 1.5 s (depends on T035 GrassSystem existing)

**Checkpoint**: All 4 seasons switch correctly; transitions ≤ 2 s; selector UI functional.

---

## Phase 8: User Story 2 — Cel-Shaded Grass with Wind Physics (Priority: P2)

**Goal**: Grass blades with GPU wind sway and cel-shading visible on forest floor; ≥ 60 fps desktop / ≥ 30 fps mobile.
**Independent Test**: Observe grass for 60 s; blades sway continuously; 2–3 visible tonal bands (not smooth gradient); DevTools Performance shows ≥ 60 fps desktop.

### Implementation for User Story 2

- [X] T033 [US2] Define grass ShaderMaterial in `forest-portfolio 2/js/world.js`: vertex shader uses `uTime`, `uWindStrength`, `uWindDirection` uniforms + `instanceId` for per-blade phase offset to sway blade tips via `sin`; fragment shader discretizes NdotL into 3 cel-shading bands (0.2 / 0.6 / 1.0) with `uLightDir` uniform; store as `grassMaterial`
- [X] T034 [US2] Create grass blade geometry in `forest-portfolio 2/js/world.js`: `THREE.PlaneGeometry(0.08, 0.6, 1, 4)` (narrow tall quad, 4 segments for wave deformation); UV mapped 0→1 bottom to top so vertex shader can apply wind displacement proportional to UV.y
- [X] T035 [US2] Build `GrassSystem` in `forest-portfolio 2/js/world.js`: create `THREE.InstancedMesh(bladeGeo, grassMaterial, bladeCount)` where `bladeCount` = TIER HIGH: 8 000, MED: 3 000, LOW: 1 000; distribute instances across ground plane XZ (-60 to 60, -120 to 40) using `setMatrixAt()` with random position, Y-rotation, and scale; add mesh to scene; expose as `window.grassSystem`
- [X] T036 [US2] Add outline pass for cel-shading in `forest-portfolio 2/js/world.js`: create a second `THREE.InstancedMesh` sharing the same blade geometry with `side: THREE.BackSide` and a flat black `MeshBasicMaterial`; scale instances slightly larger (1.06×) to produce visible outline silhouette; add to scene; update in sync with grass mesh
- [X] T037 [US2] Update animation loop in `forest-portfolio 2/js/world.js` to tick grass uniforms: set `grassMaterial.uniforms.uTime.value = time`; set `uLightDir` from `sunLight.position` normalized; skip per-frame CPU updates (all motion is shader-side)
- [X] T038 [US2] Integrate grass with `SeasonManager` in `forest-portfolio 2/js/world.js`: in `setSeason()`, tween `grassMaterial.uniforms.uColor.value` to new season's `grassColor` (T032 dependency resolved here); set grass instance visibility to match season `grassDensity` multiplier if needed

**Checkpoint**: Grass renders with visible cel-shading bands; wind animation runs; 60/30 fps targets met.

---

## Phase 9: User Story 4 — Day/Night Cycle & Light/Dark Mode (Priority: P2)

**Goal**: Day/night toggle drives full in-scene transition (sun set, stars, moon, forest illumination) in 3–8 s.
**Independent Test**: Toggle light→dark; sun sets, stars appear, moon rises within 3–8 s. Toggle dark→light; moon sets, sun rises. On load, dark OS pref starts at night with no animation.

### Implementation for User Story 4

- [X] T039 [US4] Add `StarField` to `forest-portfolio 2/js/world.js`: create `THREE.Points` with 2 000 positions distributed on sphere radius 450 (random spherical coordinates); use `THREE.PointsMaterial` with `sizeAttenuation: true`, `size: 0.8`, initial `opacity: 0`; add to scene; in animation loop, drive `starsMat.opacity = Math.max(nightLerp - 0.2, 0) * 1.3`
- [X] T040 [US4] Implement moon arc animation in `forest-portfolio 2/js/world.js` animation loop: compute `moonAngle = time * 0.012 + Math.PI`; set `moonMesh.position.x = Math.cos(moonAngle) * 180`; set `moonMesh.position.y = 60 + Math.sin(moonAngle) * 80`; copy position to `moonLight.position`; `moonMesh.visible = nightLerp > 0.25`
- [X] T041 [US4] Wire system dark-mode preference in `forest-portfolio 2/js/world.js` `doReveal()`: before `startIntro()`, check `window.matchMedia('(prefers-color-scheme: dark)').matches`; if true, set `isNight = true; nightTarget = 1; nightLerp = 1` immediately; skip transition animation; set `document.body.classList.add('night-mode')`; update day/night button icons in `ui.js` via `window.forestScene.isNight`
- [X] T042 [US4] Update `ui.js` day/night button initialization in `forest-portfolio 2/js/ui.js`: after scene ready, read `window.forestScene.isNight` and set initial icon state (sun hidden / moon shown if night); sync `document.body.classList` `night-mode` with button state on each toggle

**Checkpoint**: Stars appear at night; moon arcs; system pref auto-detected; transition is 3–8 s.

---

## Phase 10: User Story 5 — Animated Creek (Priority: P3)

**Goal**: Winding animated creek replaces the lake; creek freezes partially in Winter.
**Independent Test**: Load page — no flat lake visible; winding creek present with flowing animation. Switch to Winter — ice overlay appears at creek edges.

### Implementation for User Story 5

- [X] T043 [US5] Remove existing flat PlaneGeometry water mesh (`water`) from `forest-portfolio 2/js/world.js`: delete construction block (§9) and `waterUniforms.uTime.value = time` update in animation loop
- [X] T044 [US5] Define creek spline in `forest-portfolio 2/js/world.js`: create `THREE.CatmullRomCurve3` with 8 control points (XZ winding path, Y = -2.2) per data-model.md creek path coordinates; sample 80 points from curve for geometry construction
- [X] T045 [US5] Build creek surface mesh in `forest-portfolio 2/js/world.js`: extrude spline sample points into a 3-unit-wide flat planar strip (two triangles per segment, normals up); apply creek `ShaderMaterial` with `uTime`, `uFlowSpeed: 0.4`, `uColor` uniform (season-driven); animate UV.x scroll in vertex shader for flow; add mesh to scene
- [X] T046 [US5] Add Winter ice overlay mesh in `forest-portfolio 2/js/world.js`: create a second slightly-wider (4.5 unit) strip using same spline; apply `THREE.MeshStandardMaterial({ color: 0xd0eeff, transparent: true, opacity: 0.62, roughness: 0.3 })`; `iceOverlay.visible = (SEASON === 'winter')`; update in `setSeason()`: show/hide based on `newSeasonConfig.creekFrozen`
- [X] T047 [US5] Wire creek color into `SeasonManager.setSeason()` in `forest-portfolio 2/js/world.js`: tween `creekMaterial.uniforms.uColor.value` to new season's `creekColor` over 1.5 s; toggle `iceOverlay.visible`

**Checkpoint**: Creek flows visually; lake geometry absent; Winter ice overlay appears/disappears on season switch.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass — rapid season/mode toggle debouncing, mobile polish, footer/name corrections, accessibility.

- [X] T048 [P] Add debounce guard in `forest-portfolio 2/js/ui.js` for day/night button: prevent re-triggering `toggleDayNight()` while `nightLerp` is still transitioning (check `Math.abs(nightLerp - nightTarget) > 0.05` before acting)
- [X] T049 [P] Update footer copyright and name references in `forest-portfolio 2/index.html`: replace `Alex Chen` with `Khaled Nached` in hero, nav logo, footer, and page `<title>`; update footer year to 2025/2026 as appropriate
- [X] T050 [P] Verify `prefers-reduced-motion` coverage in `forest-portfolio 2/js/world.js`: season transitions skip GSAP tween and snap immediately; grass wind amplitude reduces to 0.01 (near-static); check is applied once at `DOMContentLoaded` and stored in a module-level boolean
- [X] T051 [P] Run Lighthouse accessibility audit against the page; fix any contrast failures surfaced by the report; update `forest-portfolio 2/css/style.css` CSS variable values if needed for WCAG AA compliance
- [X] T052 [P] Validate CSP meta tag (T003) does not block Google Fonts, cdnjs Three.js, cdnjs GSAP, or local JS/CSS in `forest-portfolio 2/index.html`; adjust `font-src` and `style-src` directives as needed
- [X] T053 Review `forest-portfolio 2/js/world.js` animation loop for memory leaks: confirm particle position arrays are reused (not reallocated each frame); confirm no new Three.js objects created inside `animate()`; check `IntersectionObserver` is unobserved after panel reveal

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1, T001–T006)**: No dependencies — run in parallel immediately
- **Foundational (Phase 2, T007–T010)**: Depends on Setup — **BLOCKS all user story phases**
- **US6 (Phase 3, T011–T014)**: Depends on Foundational — pure CSS/layout, no scene entities
- **US7 (Phase 4, T015–T018)**: Depends on Foundational — pure JS form, no scene entities
- **US8 (Phase 5, T019–T022)**: Depends on T007 (TIER constant)
- **US1 (Phase 6, T023–T026)**: Depends on Foundational; clouds must exist (already do)
- **US3 (Phase 7, T027–T032)**: Depends on SeasonManager (T009); T032 depends on T035
- **US2 (Phase 8, T033–T038)**: Depends on Foundational; T038 depends on T009
- **US4 (Phase 9, T039–T042)**: Depends on DayNightCycle (T010)
- **US5 (Phase 10, T043–T047)**: Depends on SeasonManager (T009); T047 depends on T009
- **Polish (Phase 11, T048–T053)**: Depends on all user story phases complete

### User Story Dependencies

- **US6, US7, US8** (all P1): Fully independent of each other — can run in parallel after Foundational
- **US1** (P1): Independent of US6/US7/US8
- **US3** (P2): Depends on SeasonManager (T009, Foundational)
- **US2** (P2): Depends on TIER (T007) and SeasonManager (T009) for T038
- **US4** (P2): Depends on DayNightCycle refactor (T010)
- **US5** (P3): Depends on SeasonManager (T009) for creek color tween
- **US3 T032** depends on **US2 T035** (grass material must exist before color tween)

### Within Each User Story

- Models/systems → animation loop wiring → UI wiring
- Each story independently testable at its Checkpoint

### Parallel Opportunities

- All Setup tasks (T001–T006) run in parallel
- US6, US7, US8, US1 can all run in parallel once Foundational is done
- US3 and US2 can run in parallel (coordinate T032/T035 handoff)
- T048–T053 Polish tasks all run in parallel

---

## Parallel Example: Post-Foundational Sprint

```
After T007–T010 complete:

Stream A: US6 (T011→T012→T013→T014)   — CSS/readability
Stream B: US7 (T015→T016→T017→T018)   — Contact form
Stream C: US8 (T019→T020→T021→T022)   — Mobile
Stream D: US1 (T023→T024→T025→T026)   — Intro animation

All streams deliver independently testable results.
Then merge and begin P2 stories.
```

---

## Implementation Strategy

### MVP (P1 stories only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T010)
3. Complete Phase 3: US6 — Text Readability
4. Complete Phase 4: US7 — Contact Form
5. Complete Phase 5: US8 — Mobile Responsiveness
6. Complete Phase 6: US1 — Cinematic Intro
7. **VALIDATE**: All P1 acceptance criteria pass
8. **SHIP MVP** if deadline requires

### Full Delivery (all stories)

Continue from MVP with:

9. Phase 7: US3 — Season Selection (P2)
10. Phase 8: US2 — Cel-Shaded Grass (P2) — coordinate T032/T035 handoff with US3
11. Phase 9: US4 — Day/Night Cycle (P2)
12. Phase 10: US5 — Animated Creek (P3)
13. Phase 11: Polish (T048–T053)

---

## Notes

- `[P]` = parallelizable (different files, no blocking dependency)
- `[USN]` = maps task to User Story N from spec.md
- All source paths are relative to the repository root (`forest-portfolio 2/` is the actual project directory)
- Validate each story against its Independent Test before moving to the next phase
- T032 has a dependency on T035 — coordinate if working US3 and US2 in parallel
- Email address segments in T015 must never appear concatenated as a literal string anywhere in committed source
