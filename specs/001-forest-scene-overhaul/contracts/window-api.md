# Window API Contracts

**Branch**: `001-forest-scene-overhaul` | **Date**: 2026-04-18

This portfolio is a static frontend with no HTTP API. The "contracts" are the public
JavaScript interfaces exposed on `window` by each module, consumed by `ui.js` and any
future scripts.

---

## `window.forestScene`

Core scene controller. Exposed by `js/world.js`.

```js
window.forestScene = {
    // Toggle between day and night mode.
    // Ignored if a transition is already in progress.
    toggleDayNight(): void,

    // Enable or disable rain overlay.
    // v: true = fade rain in; false = fade rain out.
    setRain(v: boolean): void,

    // Read-only: current night state.
    get isNight(): boolean,

    // Read-only: true once the cinematic intro GSAP tween completes.
    get introDone(): boolean,
}
```

---

## `window.seasonManager`

Season state controller. Exposed by `js/world.js` (or extracted `js/seasons.js`).

```js
window.seasonManager = {
    // Switch the active season. No-op if already active or mid-transition.
    // name: 'spring' | 'summer' | 'fall' | 'winter'
    setSeason(name: string): void,

    // Register a callback fired after each season transition completes.
    onSeasonChange(cb: (newSeason: string) => void): void,

    // Read-only: current season name.
    get currentSeason(): string,

    // Read-only: true during a 1.5 s season tween.
    get isTransitioning(): boolean,
}
```

---

## `window.grassSystem`

Grass performance controller. Exposed by `js/world.js`.

```js
window.grassSystem = {
    // Read-only: resolved performance tier.
    get tier(): 'HIGH' | 'MED' | 'LOW',

    // Update wind parameters (called by ui.js if a wind control is added later).
    setWind(strength: number, dirX: number, dirZ: number): void,
}
```

---

## Season Selector UI Contract

The season selector is a `<div id="season-selector">` injected into `<body>` by `js/ui.js`
(or declared in `index.html`), positioned fixed bottom-right.

```html
<div id="season-selector" role="group" aria-label="Select season">
  <button data-season="spring" aria-label="Spring" class="season-btn">🌸</button>
  <button data-season="summer" aria-label="Summer" class="season-btn">☀️</button>
  <button data-season="fall"   aria-label="Fall"   class="season-btn">🍁</button>
  <button data-season="winter" aria-label="Winter" class="season-btn">❄️</button>
</div>
```

`ui.js` attaches `click` listeners to each `.season-btn` and calls
`window.seasonManager.setSeason(btn.dataset.season)`. The active button receives class
`season-btn--active`. Disabled (dimmed) while `seasonManager.isTransitioning === true`.

---

## Contact Form Submission Contract

The contact form (`#contact-form`) is handled entirely by `js/ui.js`.
No network request is made. The submission pipeline:

```
submit event
  → honeypot check    (abort if _hp filled)
  → time gate check   (abort if < 3 s since page load)
  → rate limit check  (abort if < 10 s since last submit)
  → field validation  (show inline errors if fail)
  → input sanitize    (createTextNode escaping)
  → email assembly    (runtime string concat inside closure)
  → window.location.href = mailto: URI
  → show success banner (6 s auto-hide)
```

**Inputs**:
- `#form-name` (text): name, min 2 chars
- `#form-email` (email): valid email pattern
- `#form-message` (textarea): min 15 chars
- `[name="_hp"]` (hidden): must be empty

**Outputs**:
- Opens native mail client via `mailto:` URI
- Shows `#form-success` banner on success
- Shows inline `<span class="field-error">` on validation failure
- No network traffic, no external service call

---

## CSS Class Contracts

These classes are toggled by JavaScript and consumed by CSS rules. Do not rename
without updating both sides.

| Class | Applied to | Set by | Meaning |
|-------|------------|--------|---------|
| `season-spring` | `<body>` | `SeasonManager.setSeason()` | Spring CSS variables active |
| `season-summer` | `<body>` | `SeasonManager.setSeason()` | Summer CSS variables active |
| `season-fall` | `<body>` | `SeasonManager.setSeason()` | Fall CSS variables active |
| `season-winter` | `<body>` | `SeasonManager.setSeason()` | Winter CSS variables active |
| `night-mode` | `<body>` | `DayNightCycle.toggleDayNight()` | Dark mode active |
| `no-webgl` | `<body>` | `world.js` init | WebGL unavailable, show CSS fallback |
| `season-btn--active` | `.season-btn` | `ui.js` | Highlights selected season button |
| `is-error` | `input`, `textarea` | `ui.js` | Red border on invalid field |
| `hidden` | various | `ui.js` | Display:none utility |
| `visible` | `.glass-panel` | IntersectionObserver | Panel scroll-reveal animation |
