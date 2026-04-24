# Data Model: Immersive Forest Scene Overhaul

**Branch**: `001-forest-scene-overhaul` | **Phase**: 1 | **Date**: 2026-04-18

All entities are JavaScript runtime objects (no persistent storage). The scene is a
single-page static frontend — data lives exclusively in memory for the duration of a
browser session.

---

## Entities

### SeasonConfig (value object)

Defines the visual palette for one season. Immutable after construction.

| Field | Type | Description |
|-------|------|-------------|
| `fogColor` | `number` (hex) | Three.js fog + clear color |
| `fogDensity` | `number` | FogExp2 density |
| `skyTop` | `number` (hex) | Sky dome top gradient color |
| `skyBottom` | `number` (hex) | Sky dome bottom gradient color |
| `groundColor` | `number` (hex) | Ground plane material color |
| `leafColors` | `number[]` | Array of hex colors for tree canopy materials |
| `trunkColor` | `number` (hex) | Tree trunk material color |
| `sunColor` | `number` (hex) | Directional sun light color |
| `ambientColor` | `number` (hex) | Ambient light color |
| `ambientInt` | `number` | Ambient light intensity |
| `sunInt` | `number` | Sun directional light intensity |
| `hemiSky` | `number` (hex) | Hemisphere light sky color |
| `hemiGround` | `number` (hex) | Hemisphere light ground color |
| `particleColor` | `number` (hex) | Seasonal particle color (petals/leaves/snow) |
| `particleSize` | `number` | Seasonal particle point size |
| `grassColor` | `number` (hex) | Grass blade base color |
| `grassDensity` | `number` | Multiplier applied to per-tier blade count |
| `badge` | `string` | Display label (e.g., `'🌸 Spring'`) |
| `creekColor` | `number` (hex) | Creek water surface color |
| `creekFrozen` | `boolean` | Whether ice overlay is visible (Winter only) |
| `accentCss` | `string` | CSS hex for `--accent` variable |

**States**: Spring | Summer | Fall | Winter

**Transitions**: Any season → any other season (no ordering constraint). Transition
is animated over 1.5 s via GSAP tween interpolating all color/intensity fields.

---

### SeasonManager (singleton module)

Holds current active season and manages transitions.

| Field | Type | Description |
|-------|------|-------------|
| `currentSeason` | `string` | One of `'spring'|'summer'|'fall'|'winter'` |
| `isTransitioning` | `boolean` | True during a 1.5 s season tween |
| `listeners` | `Function[]` | Callbacks notified after transition completes |

**Methods**:

| Method | Signature | Side effects |
|--------|-----------|-------------|
| `setSeason` | `(name: string) => void` | Starts GSAP tween across all scene subsystems; updates CSS body class; fires listeners |
| `onSeasonChange` | `(cb: Function) => void` | Registers a listener |

**Validation rules**:
- `setSeason` is a no-op if `isTransitioning === true` or `name === currentSeason`.
- Valid values: `'spring'`, `'summer'`, `'fall'`, `'winter'`.

---

### DayNightCycle (singleton module)

Controls sun/moon positions, sky colors, star visibility, and ambient illumination.

| Field | Type | Description |
|-------|------|-------------|
| `nightLerp` | `number` [0–1] | Current blend: 0 = full day, 1 = full night |
| `nightTarget` | `number` [0–1] | Target blend (0 or 1) |
| `isNight` | `boolean` | Whether dark mode is active |
| `LERP_SPEED` | `number` | Per-frame lerp factor (controls 3–8 s transition) |

**State transitions**:

```
DAY ──[toggleDayNight()]──► TRANSITIONING_TO_NIGHT ──[nightLerp→1]──► NIGHT
NIGHT ──[toggleDayNight()]──► TRANSITIONING_TO_DAY ──[nightLerp→0]──► DAY
```

On page load: if `prefers-color-scheme: dark` is detected, `nightTarget = 1` and
`nightLerp` is set to `1` immediately (no transition animation on first render).

**Driven outputs** (updated every animation frame):
- `sunLight.intensity`, `moonLight.intensity`
- `ambientLight.color`, `ambientLight.intensity`
- `skyUniforms.uTop`, `skyUniforms.uBottom`
- `scene.fog.color`, `renderer.setClearColor`
- `sunMesh.visible`, `moonMesh.visible`, `moonMesh.position`
- `starField.material.opacity`
- `fireflies.material.opacity`
- `renderer.toneMappingExposure`

---

### GrassSystem (singleton module)

Manages the InstancedMesh grass field with cel-shading.

| Field | Type | Description |
|-------|------|-------------|
| `mesh` | `THREE.InstancedMesh` | Single draw-call grass batch |
| `bladeCount` | `number` | Active blade count for current performance tier |
| `tier` | `'HIGH'|'MED'|'LOW'` | Performance tier detected at startup |
| `windStrength` | `number` | Current wind uniform value [0–1] |
| `windDirection` | `THREE.Vector2` | Normalized 2D wind direction |
| `color` | `THREE.Color` | Current blade color (season-driven) |

**Shader uniforms** (ShaderMaterial):

| Uniform | Type | Description |
|---------|------|-------------|
| `uTime` | `float` | Scene time accumulator |
| `uWindStrength` | `float` | Wind sway amplitude |
| `uWindDirection` | `vec2` | Wind direction in XZ plane |
| `uColor` | `vec3` | Blade tint color |
| `uLightDir` | `vec3` | Main light direction (for cel-shading) |

**Cel-shading bands** (fragment shader):

| Dot product range | Output shade |
|-------------------|-------------|
| > 0.7 | Bright (1.0) |
| 0.3 – 0.7 | Mid (0.6) |
| < 0.3 | Shadow (0.2) |

Outlines: second render pass with backface-inflated normals, black material.

**Performance tier detection** (evaluated once at `DOMContentLoaded`):

| Condition | Tier |
|-----------|------|
| `hardwareConcurrency ≥ 4` AND `devicePixelRatio < 2` | HIGH |
| `hardwareConcurrency ≥ 2` AND `devicePixelRatio < 3` | MED |
| Otherwise | LOW |

---

### Creek (singleton module)

Replaces the lake PlaneGeometry with a winding animated creek.

| Field | Type | Description |
|-------|------|-------------|
| `mesh` | `THREE.Mesh` | Creek surface mesh (CatmullRom path → planar strip) |
| `iceMesh` | `THREE.Mesh` | Winter ice overlay (visible only in Winter) |
| `uniforms.uTime` | `float` | Time accumulator for UV scroll |
| `uniforms.uFlowSpeed` | `float` | UV scroll speed |
| `uniforms.uColor` | `vec3` | Water surface color (season-driven) |
| `uniforms.uFrozen` | `float` | [0–1] Ice blend weight (1 = Winter) |

**Creek path** (Catmull-Rom control points, world-space XZ):

```
[(-12, -30), (-8, -10), (-15, 10), (-10, 30),
 (-5, 50), (-12, 70), (-8, 90), (-14, 110)]
```

Extruded to a ≈3-unit-wide planar strip lying on the ground at `y = -2.2`.

**State transitions**: Creek color and `uFrozen` tween when `SeasonManager.setSeason()`
is called. Ice mesh `visible` matches `SeasonConfig.creekFrozen`.

---

### ParticleEmitter (singleton module)

Manages seasonal particle systems (petals, leaves, snow).

| Field | Type | Description |
|-------|------|-------------|
| `geometry` | `THREE.BufferGeometry` | Float32 position buffer (PART_COUNT × 3) |
| `material` | `THREE.PointsMaterial` | Color + size + opacity |
| `velocities` | `Object[]` | Per-particle `{vx, vy, vz, wb, ws}` |
| `PART_COUNT` | `number` | Tier-scaled count (LOW: 200, MED: 400, HIGH: 700) |

**Particle count by tier and season**:

| Tier | Spring (petals) | Fall (leaves) | Winter (snow) | Summer |
|------|-----------------|---------------|----------------|--------|
| HIGH | 700 | 700 | 900 | 0 |
| MED | 350 | 350 | 450 | 0 |
| LOW | 150 | 150 | 200 | 0 |

Summer has no particle effects.

**On season change**: Existing particles fade out (0.3 s opacity tween), positions
are reset above camera, new color and size applied, particles fade back in (0.3 s).

---

### StarField (singleton module)

| Field | Type | Description |
|-------|------|-------------|
| `points` | `THREE.Points` | 2 000 stars distributed on sphere (radius 450) |
| `material.opacity` | `number` | Driven by `nightLerp` (`max(nightLerp - 0.2, 0) * 1.2`) |
| `phases` | `Float32Array` | Per-star phase offset for twinkle shader |

---

### ContactForm (UI module)

| Field | Type | Description |
|-------|------|-------------|
| `formLoadTime` | `number` | `Date.now()` captured at DOMContentLoaded |
| `lastSubmit` | `number` | Timestamp of last successful submission |
| `isSubmitting` | `boolean` | True during 800 ms mailto construction delay |

**Fields** (HTML form):

| Name | Type | Validation |
|------|------|-----------|
| `name` | `text` | Required, ≥ 2 characters |
| `email` | `email` | Required, RFC 5321 pattern |
| `message` | `textarea` | Required, ≥ 15 characters |
| `_hp` | `text` (hidden) | Honeypot: MUST be empty |

**Guards applied in order**:
1. Honeypot: if `_hp.value !== ''` → silent abort.
2. Time gate: if `Date.now() - formLoadTime < 3000` → silent abort.
3. Rate limit: if `Date.now() - lastSubmit < 10000` → inline error.
4. Field validation: name, email, message rules above.
5. Sanitize: `document.createTextNode()` escaping before mailto construction.
6. Email assembly: runtime string concatenation inside submit handler closure.

**State transitions**:
```
IDLE ──[submit]──► VALIDATING ──[fail]──► IDLE (errors shown)
                               ──[pass]──► SUBMITTING ──► mailto: opened ──► SUCCESS ──► IDLE
```

---

### PerformanceTier (global constant, set once at startup)

| Value | Criteria |
|-------|---------|
| `'HIGH'` | `hardwareConcurrency ≥ 4` AND `devicePixelRatio < 2` |
| `'MED'` | `hardwareConcurrency ≥ 2` AND `devicePixelRatio < 3` |
| `'LOW'` | All other cases |

Consumed by: `GrassSystem`, `ParticleEmitter`, shadow map size, renderer pixel ratio.

---

## Entity Relationships

```
SeasonManager
  ├─► SeasonConfig (reads palette for current season)
  ├─► GrassSystem.color          (tweens on change)
  ├─► ParticleEmitter            (fades out/in on change)
  ├─► Creek.uniforms.uColor      (tweens on change)
  ├─► Creek.iceMesh.visible      (set on change)
  └─► CSS body class             (set immediately)

DayNightCycle
  ├─► sunLight / moonLight       (intensity driven by nightLerp)
  ├─► ambientLight               (color + intensity lerped)
  ├─► skyUniforms                (lerped every frame)
  ├─► StarField.material.opacity (driven by nightLerp)
  └─► fireflies.material.opacity (driven by nightLerp)

GrassSystem
  └─► PerformanceTier            (blade count set once at startup)

ParticleEmitter
  └─► PerformanceTier            (particle count set once at startup)

ContactForm (independent — no scene dependencies)
```
