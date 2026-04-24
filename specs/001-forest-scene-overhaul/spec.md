# Feature Specification: Immersive Forest Scene Overhaul

**Feature Branch**: `001-forest-scene-overhaul`
**Created**: 2026-04-18
**Status**: Draft
**Input**: User description: "Cinematic intro animation, cel-shaded grass with physics, season selection, day/night cycle, animated creek, mobile responsiveness, secure contact form, and readable text."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cinematic Intro Animation (Priority: P1)

A first-time visitor lands on the portfolio page and is greeted by a cinematic fly-through: the
camera begins above the clouds, passes through them, and swoops down into the forest canopy,
orienting the viewer into the scene before content appears.

**Why this priority**: This is the first impression of the entire portfolio. It establishes the
visual identity and must work correctly before any other scene element matters.

**Independent Test**: Open the page in an incognito browser. Verify the camera animates from
above clouds → through clouds → into the forest and completes without freezing. No page content
(text, nav, sections) should move or be obscured during playback.

**Acceptance Scenarios**:

1. **Given** the page has just loaded with no prior state, **When** the DOM is ready,
   **Then** the intro animation begins automatically, starting above the cloud layer.
2. **Given** the intro animation is playing, **When** the camera passes through the cloud layer,
   **Then** a cloud-particle or fog effect is visible and the transition feels smooth, not abrupt.
3. **Given** the intro animation is playing, **When** the user attempts to scroll or click,
   **Then** all page content and navigation are immediately interactive; the animation
   continues playing in the background scene layer and does not block any UI element.
4. **Given** a returning visitor or reduced-motion preference is set, **When** the page loads,
   **Then** the intro animation is either skipped or presented in a reduced form, landing
   directly on the forest view.

---

### User Story 2 - Cel-Shaded Grass with Wind Physics (Priority: P2)

Visitors see a stylized grass layer across the forest floor that reacts to a simulated wind,
producing a Breath-of-the-Wild / Genshin Impact aesthetic — flat shading with bold outlines
and fluid, physics-driven sway.

**Why this priority**: This is a core visual differentiator of the portfolio scene. Must be
performant because it runs continuously throughout the session.

**Independent Test**: Load the page and observe the grass area for 60 seconds. Grass blades
must sway continuously. On a mid-range mobile device the frame rate must remain at or above
30 fps. Cel-shading (cartoon-like flat shading with outlines) must be clearly visible.

**Acceptance Scenarios**:

1. **Given** the forest scene is rendered, **When** the scene is idle, **Then** grass blades
   animate with a continuous, looping wind-sway motion using cel-shaded (flat-shaded with
   outlines) rendering.
2. **Given** a large number of grass sprites are on screen, **When** the page is viewed on a
   mobile device, **Then** frame rate does not drop below 30 fps (performance budget applies).
3. **Given** the page is in any season, **When** the season changes, **Then** the grass color
   and density update to match the selected season without reloading the page.

---

### User Story 3 - Season Selection (Priority: P2)

Visitors can switch between four seasons — Spring, Summer, Fall, and Winter — causing the
entire forest scene (trees, ground, sky, particles) to update in real time.

**Why this priority**: Equal priority to grass because seasons govern the entire visual palette
of the scene; this is a key interactive feature of the portfolio.

**Independent Test**: Use the season selector UI. Switch to each of the four seasons and verify
the visual changes described below appear without a page reload. Switching must complete in
under 2 seconds.

**Acceptance Scenarios**:

1. **Given** Spring is selected, **When** the scene updates, **Then** trees display cherry
   blossoms and light-green foliage, and petal-particle animations float downward.
2. **Given** Summer is selected, **When** the scene updates, **Then** trees display darker,
   richer green foliage and no particle effects are present.
3. **Given** Fall is selected, **When** the scene updates, **Then** trees display autumn
   foliage (orange, red, yellow), and leaf-particle animations fall continuously.
4. **Given** Winter is selected, **When** the scene updates, **Then** snow accumulates on
   the ground, snowflake particles fall continuously, and tree foliage is visually covered
   with snow.
5. **Given** any season is active, **When** the user switches to another season, **Then**
   the transition is animated (cross-fade or morph) and takes no longer than 2 seconds.

---

### User Story 4 - Day/Night Cycle & Light/Dark Mode (Priority: P2)

The portfolio's light/dark mode toggle drives an in-scene day/night cycle. Light mode shows
the sun in the sky illuminating the forest. Dark mode triggers a sunset, followed by a
star-field and moonrise that illuminates the scene. Switching back from dark to light mode
triggers a sunrise.

**Why this priority**: Core aesthetic feature. The transitions define the "living world" feel
of the portfolio.

**Independent Test**: Toggle light mode → dark mode. Verify: sun moves toward horizon, sky
darkens, stars appear, moon rises. Toggle dark → light. Verify: moon sets, sky brightens, sun
rises. Each full transition must complete in 3–8 seconds.

**Acceptance Scenarios**:

1. **Given** the page is in light mode, **When** the scene is rendered, **Then** a sun is
   visible in the sky and the forest is illuminated with warm daylight.
2. **Given** the user switches from light to dark mode, **When** the transition begins,
   **Then** the sun sets below the horizon, the sky transitions to night, stars appear
   progressively, and the moon rises — all within 3–8 seconds.
3. **Given** the page is in dark mode, **When** the moon is visible, **Then** the forest
   is lit with cool moonlight, visibly different from daytime illumination.
4. **Given** the user switches from dark to light mode, **When** the transition begins,
   **Then** the moon sets, the sky brightens, and the sun rises — all within 3–8 seconds.
5. **Given** a system-preference for dark/light mode is detected on load, **When** the page
   first renders, **Then** the scene starts in the matching mode without playing the
   transition animation.

---

### User Story 5 - Animated Creek (Priority: P3)

The existing water element (lake texture) is replaced with a winding creek that flows through
the forest floor. The creek animates continuously to suggest flowing water.

**Why this priority**: Addresses a known visual inconsistency (lake looks out of place).

**Independent Test**: Load the page and confirm: (a) the lake texture is absent, (b) a creek
is visible winding through the forest, (c) the creek surface animates (e.g., scrolling
texture, ripples, or caustic shimmers).

**Acceptance Scenarios**:

1. **Given** the forest scene is loaded, **When** the viewer looks at the ground level,
   **Then** a creek with a winding path is visible and the lake texture is not present.
2. **Given** the creek is visible, **When** the scene is idle, **Then** the creek surface
   shows continuous flowing animation (moving highlights, ripples, or scrolling texture).
3. **Given** a season is selected, **When** Winter is active, **Then** the creek partially
   freezes (e.g., ice overlay at edges) while retaining some visible flow in the center.

---

### User Story 6 - Content Readability & UI Non-Interference (Priority: P1)

All page text, navigation, and interactive elements remain fully readable and usable at all
times, regardless of which scene, season, animation, or mode is active.

**Why this priority**: Accessibility and usability are non-negotiable. Content must never be
obscured by the background scene.

**Independent Test**: With each season and each mode (light/dark) active, verify that all
heading text, body text, navigation links, and form fields pass WCAG AA contrast ratio (4.5:1
for normal text, 3:1 for large text) against their backgrounds.

**Acceptance Scenarios**:

1. **Given** any season or mode is active, **When** a user reads page content, **Then** all
   text elements meet WCAG AA contrast requirements and are not obscured by scene elements.
2. **Given** the intro animation is playing, **When** the camera is moving, **Then** no
   text or interactive UI element is rendered on top of the moving camera path in a way
   that makes it unreadable.
3. **Given** the scene is rendering grass, particles, or creek animations, **When** content
   sections are in view, **Then** the 3D/canvas layer is visually separated (e.g., by
   overlay, blur, or opaque card) so text contrast is not degraded.

---

### User Story 7 - Secure Contact Form (Priority: P1)

Site visitors can submit a contact message. The form handles data securely: no credentials
are exposed client-side, submissions are validated, and no user data leaks to third parties.

**Why this priority**: Security is non-negotiable per the project constitution.

**Independent Test**: Submit the form with valid data; verify delivery. Inspect browser
DevTools (Network, Console, Sources) to confirm: no API keys or secrets visible, no data
sent to unexpected third-party endpoints. Test with invalid/malicious input to verify
sanitization.

**Acceptance Scenarios**:

1. **Given** a visitor fills in the contact form with valid name, email, and message,
   **When** they submit, **Then** they receive a success confirmation and the message is
   delivered to the site owner.
2. **Given** a visitor submits an empty or malformed field, **When** the form is submitted,
   **Then** clear, inline validation errors appear and no submission is sent.
3. **Given** the page source and network traffic are inspected, **When** the contact form
   is used, **Then** no API keys, credentials, or secrets are visible in client-side code
   or request payloads, and the destination email address is obfuscated so automated
   harvesters cannot extract it directly from source.
4. **Given** a malicious actor submits script-injection or XSS payloads in form fields,
   **When** the form processes the input, **Then** the input is sanitized and does not
   execute or persist harmful content.
5. **Given** a bot attempts to submit the contact form, **When** a honeypot hidden field
   is filled or the form is submitted in under 3 seconds of page load, **Then** the
   mailto: action is suppressed and no message is sent.

---

### User Story 8 - Mobile Responsiveness (Priority: P1)

Every visual element — intro animation, grass, seasons, day/night cycle, creek, and all page
content — performs correctly and looks intentional on mobile devices (phones and tablets).

**Why this priority**: A portfolio viewed on mobile with broken animations would undermine
the entire purpose.

**Independent Test**: Load the page on a physical or emulated mobile device (375 px width,
iOS Safari and Android Chrome). All content must be reachable, all animations must run at
acceptable frame rates, and no horizontal scroll must be introduced.

**Acceptance Scenarios**:

1. **Given** the page is viewed on a mobile device (≥ 375 px width), **When** the scene
   renders, **Then** grass density, particle count, and shadow quality auto-scale to
   maintain ≥ 30 fps.
2. **Given** the page is viewed on a mobile device, **When** the user scrolls or interacts,
   **Then** no horizontal overflow or broken layout is present.
3. **Given** the page is viewed on a tablet or desktop, **When** the scene renders,
   **Then** higher-fidelity settings (more grass, particles, shadows) are used automatically.

---

### Edge Cases

- What happens when the user has `prefers-reduced-motion` set? → Intro animation is skipped or
  minimal; grass sway is reduced to near-static; season transitions are instant or crossfade only.
- What happens on a very low-powered device (e.g., very old Android)? → Graceful degradation:
  3D/canvas elements fall back to a static scene image or CSS-only background.
- What happens when JavaScript fails or the WebGL context is lost? → Page content remains
  readable; background falls back to a flat color or CSS gradient.
- What happens when the user rapidly toggles seasons or light/dark mode? → Transitions are
  debounced or queued; no visual corruption or memory leak occurs.
- What happens if the visitor's local mail client is not configured? → The form displays
  a clear message informing the visitor that no mail client was found and provides the
  owner's email address as an accessible plain-text fallback.
- What if a bot fills the honeypot field or submits the form too quickly? → The client-side
  guard suppresses the mailto: action silently; the user sees a success message but no
  email is constructed or sent.

## Clarifications

### Session 2026-04-18

- Q: What is the contact form delivery mechanism, and how is it kept secure without a backend? → A: Frontend-only `mailto:` form using the browser's native mail protocol (no backend, no third-party service). Destination email is obfuscated in source. Anti-spam via honeypot hidden field and ≥3 s time-on-form gate.
- Q: Should the cinematic intro animation be skipped for returning visitors? → A: No — the full intro plays on every page load without exception.
- Q: Where is the season selector placed in the UI? → A: Fixed floating control (pill or icon group) anchored to a viewport corner, always accessible regardless of scroll position.
- Q: What is the desktop frame rate target for scene animations? → A: 60 fps.
- Q: Is user interaction blocked during the cinematic intro animation? → A: No — content and navigation are immediately interactive; the intro plays behind already-visible page content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The scene MUST play the full cinematic intro animation on every page load
  (including return visits), starting above the clouds and ending at forest level.
- **FR-002**: The intro animation MUST respect the `prefers-reduced-motion` media query by
  skipping or minimizing motion.
- **FR-003**: The forest floor MUST render cel-shaded grass sprites with continuous,
  physics-based wind-sway animation.
- **FR-004**: Grass rendering MUST maintain a minimum of 60 fps on desktop and 30 fps on
  mid-range mobile devices by adapting sprite count and detail level to device capability.
- **FR-005**: The interface MUST provide a season selector with four options: Spring,
  Summer, Fall, Winter.
- **FR-006**: Each season MUST update tree foliage color, particle effects, and ground
  appearance in real time without a page reload.
- **FR-007**: The light/dark mode toggle MUST drive a corresponding in-scene day/night
  transition (sun position, sky color, star-field, moon appearance).
- **FR-008**: Day/night transitions MUST complete in 3–8 seconds and MUST NOT be
  instantaneous or excessively slow.
- **FR-009**: The existing lake/water texture MUST be removed and replaced with an
  animated, winding creek.
- **FR-010**: All text, navigation, and interactive elements MUST remain fully readable
  (WCAG AA contrast) regardless of active season, mode, or animation state.
- **FR-011**: The 3D/canvas scene layer MUST NOT overlay or obstruct interactive UI
  elements or readable text content at any time, including during the intro animation.
  Page content and navigation MUST be fully interactive from the moment the page loads.
- **FR-012**: The contact form MUST validate all fields client-side before submission.
- **FR-013**: The contact form MUST be implemented as a frontend-only `mailto:` form with
  no backend server, serverless function, or third-party submission service. It MUST use
  the browser's native mail protocol to open the visitor's local mail client. The
  destination email address MUST be obfuscated in source code (e.g., JavaScript-assembled
  at runtime) so automated harvesters cannot extract it from page source or markup.
- **FR-013a**: The contact form MUST include a hidden honeypot field and a minimum
  time-on-form gate (≥ 3 seconds) to suppress automated bot submissions without any
  server-side component.
- **FR-014**: The contact form MUST sanitize all user input against injection and XSS
  attacks before constructing the mailto: payload.
- **FR-015**: All scene features MUST be mobile-responsive and degrade gracefully on
  low-powered or small-screen devices.
- **FR-016**: If WebGL is unavailable, the page MUST fall back to a readable static or
  CSS-only background and remain fully functional.

### Key Entities

- **Scene**: The 3D/canvas background rendering layer; manages camera, lighting, terrain.
- **GrassSystem**: Collection of grass sprites with per-blade physics simulation and
  cel-shading applied.
- **Season**: Value object with four states (Spring, Summer, Fall, Winter); governs colors,
  particle emitters, and foliage configuration.
- **DayNightCycle**: Controls sun/moon position, sky gradient, star-field visibility, and
  ambient lighting intensity.
- **Creek**: Animated water mesh replacing the lake; has flow direction, width, and
  seasonal freeze states.
- **ContactForm**: Secure frontend-only form; fields: name, email, message, hidden
  honeypot; uses native `mailto:` protocol to open visitor's mail client; includes
  client-side validation, input sanitization, honeypot guard, and time-on-form gate.
- **ParticleEmitter**: Reusable system for petals (Spring), falling leaves (Fall), and
  snowflakes (Winter).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The cinematic intro animation completes on every page load without visual
  errors, measured across Chrome, Safari, Firefox, and mobile equivalents.
- **SC-002**: Scene animations maintain ≥ 60 fps on desktop and ≥ 30 fps on representative
  mid-range mobile hardware (as measured by browser performance tooling).
- **SC-003**: Season switching completes its visual transition in ≤ 2 seconds on
  desktop and ≤ 3 seconds on mobile.
- **SC-004**: Day/night transitions complete in 3–8 seconds, verified by stopwatch
  across all four season states.
- **SC-005**: All text elements pass WCAG AA contrast ratio (4.5:1 normal, 3:1 large)
  in all season × mode combinations, verified by automated accessibility tooling.
- **SC-006**: No API keys, credentials, or the destination email address in plain text
  are discoverable in browser DevTools (Sources, Network, Console) for the contact form
  flow; bot-submission guards (honeypot + time gate) are verified by automated test.
- **SC-007**: The page layout produces no horizontal scroll and all content is reachable
  on a 375 px wide viewport.
- **SC-008**: The page remains fully usable (content readable, navigation functional,
  contact form operable) when WebGL is disabled or the canvas fails to initialize.

## Assumptions

- The portfolio is a single-page or minimal-page web application; the scene occupies a
  fixed background layer behind scrollable content sections.
- The existing codebase already has a light/dark mode toggle; the day/night cycle will
  hook into that existing toggle rather than introducing a separate control.
- "Cel-shading" refers to toon/flat shading with visible outlines, as seen in Breath of
  the Wild and Genshin Impact — achieved via shader or post-processing, not by artist-drawn
  sprites per frame.
- The contact form is entirely frontend-only, using the browser's native `mailto:`
  protocol. No backend, serverless function, or third-party submission service is used.
  Anti-spam is handled purely client-side via a honeypot field and a time-on-form gate.
- "Mobile-responsive" targets a minimum viewport width of 375 px (iPhone SE) and up.
- The season selector is a fixed floating control (pill or icon group) anchored to a
  viewport corner, remaining visible and accessible at all scroll positions without
  occupying navigation bar space.
- The full cinematic intro plays on every page load. No session tracking or skip logic
  is implemented. Users with `prefers-reduced-motion` receive a reduced-motion variant
  (per FR-002) but the intro is never skipped entirely.
