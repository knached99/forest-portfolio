# Quickstart: Immersive Forest Scene Overhaul

**Branch**: `001-forest-scene-overhaul` | **Date**: 2026-04-18

---

## Prerequisites

- A modern browser: Chrome 110+, Firefox 115+, Safari 16+
- No build system required — this is a static HTML/JS/CSS project
- Optional: any local HTTP server (to avoid CORS issues with some browsers loading
  `file://` — though this project has no fetch calls)

---

## Running the project

### Quickest method (any OS)

Open `forest-portfolio 2/index.html` directly in a browser. All dependencies are
loaded from CDN. The scene renders immediately.

### With a local server (recommended for testing SRI hashes and CSP headers)

```bash
# Python 3
cd "forest-portfolio 2"
python -m http.server 8080
# Then open http://localhost:8080
```

```bash
# Node.js (npx)
cd "forest-portfolio 2"
npx serve .
# Then open the printed URL
```

---

## File structure

```
forest-portfolio 2/          ← Open index.html from here
├── index.html               ← Single-page app entry point
├── css/
│   └── style.css            ← All custom styles + CSS variables
└── js/
    ├── world.js             ← Three.js scene: sky, trees, ground, lighting,
    │                           camera intro, day/night, SeasonManager,
    │                           GrassSystem, Creek, StarField, ParticleEmitter
    └── ui.js                ← DOM interactions: season selector, day/night
                                button, contact form, audio, scroll effects
```

---

## Key interactions to verify

### Cinematic intro
- Reload the page. A loading bar appears, then the camera descends from above
  the clouds through fog into the forest. Should complete in ~5 seconds.
- Verify: page content (nav, hero text) is readable and interactive immediately —
  do not wait for intro to finish before scrolling.

### Season selector
- A floating pill in the bottom-right corner shows 🌸 ☀️ 🍁 ❄️.
- Click each icon. Trees, ground, particles, and sky should update within 1.5 s.
- Active season button is highlighted.

### Day / Night toggle
- Click the sun/moon button in the top-right control strip.
- Observe: sun sets, sky darkens, stars appear, moon rises (3–8 seconds).
- Click again: moon sets, sky brightens, sun rises.
- On page load: if OS is in dark mode, scene should start at night with no
  transition animation.

### Creek
- Scroll to the forest floor view. A winding creek (not a flat lake) should be
  visible, with animated flowing surface.
- Switch to Winter: ice overlay appears at creek edges.

### Grass
- Grass blades should be visible on the forest floor, swaying in wind.
- Open browser DevTools → Performance tab. Record 5 seconds. On desktop the
  frame rate should stay at or near 60 fps. On mobile emulation, ≥ 30 fps.
- Cel-shading: grass should display 2–3 distinct shading bands (not smooth
  gradient), matching a toon/cartoon aesthetic.

### Contact form
- Scroll to the Contact section. Fill in name, email, message. Submit.
- Your local mail client should open with the message pre-filled.
- Inspect DevTools → Sources: confirm no email address appears as a plain string
  in source code or markup.
- Test honeypot: open DevTools console, run
  `document.querySelector('[name="_hp"]').value = 'bot'` then submit —
  form should silently do nothing.
- Test time gate: reload page, submit immediately within 3 seconds — should
  silently suppress.

### Text readability
- With every season active and both day/night modes, confirm all text in nav,
  hero, about, projects, skills, and contact sections is clearly readable with
  no blending into the background.
- Run Lighthouse → Accessibility to verify contrast ratios.

### Mobile responsiveness
- Open DevTools → Device toolbar. Set to 375 × 667 (iPhone SE).
- Reload. Verify: no horizontal scroll, grass density is reduced, all content
  is reachable, season selector is accessible above iOS home bar.

### WebGL fallback
- In Chrome: open `chrome://flags`, disable WebGL, reload.
- Verify: canvas hidden, page shows a CSS gradient background, all content
  is readable and the contact form works.

### Reduced motion
- In OS settings, enable "Reduce Motion" (macOS) or "Remove animations"
  (Windows).
- Reload. Verify: intro animation is minimal (camera lands quickly or instantly),
  grass sway is reduced, season transitions are instant crossfades.

---

## SRI hash generation (Constitution IV task)

After finalizing CDN versions, generate SRI hashes:

```bash
# Example for Three.js r128 (run against the exact CDN URL):
curl -s https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

Add the resulting hash to the `<script integrity="sha384-...">` attribute in
`index.html`. Repeat for GSAP and Tailwind (or replace Tailwind CDN with a
committed build output file).

---

## Known issues to resolve during implementation

| Issue | Resolution |
|-------|-----------|
| Season is auto-detected at load, not manually switchable | Implement `SeasonManager` |
| Water is flat PlaneGeometry (lake) | Replace with `Creek` TubeGeometry + shader |
| No grass sprites | Add `GrassSystem` InstancedMesh |
| No star field | Add `StarField` Points |
| Email is placeholder `hello@alexchen.dev` | Obfuscate real address in closure |
| CDN scripts lack SRI hashes | Add `integrity` attributes |
| Hero text may blend with bright sky | Add text-shadow / hero backdrop |
| No system dark-mode auto-detection | Add `matchMedia` check on load |
