# 🌲 Forest Portfolio

A cinematic, immersive 3D developer portfolio built with Three.js, featuring a real-time forest environment that responds to your actual season, day/night cycles, and scroll-based exploration.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Cinematic Intro** | Camera descends through clouds into a lush NE-US forest |
| **Seasonal System** | Auto-detects your current season — Spring 🌸 / Summer ☀️ / Fall 🍁 / Winter ❄️ |
| **Day / Night Toggle** | Smooth animated transition: warm sun → cool moonlight + fireflies |
| **Scroll-Based Camera** | Camera glides deeper into the forest as you scroll through sections |
| **Particle Systems** | Season-adaptive: petals / leaves / snow + fireflies at night |
| **Water Shader** | Custom GLSL animated water with caustics |
| **Web Audio** | Procedural ambient forest sounds (wind + leaves) via Web Audio API |
| **Contact Form** | Validated, honeypot-protected, rate-limited — mailto fallback |
| **Skill Bars** | Animate in on scroll via IntersectionObserver |
| **Performance** | Instanced trees, typed arrays, capped pixel ratio |

---

## 🚀 Running Locally

You need a local HTTP server (so Three.js can load ES modules / avoid CORS).

### Option 1 — VS Code Live Server (easiest)
1. Install the **Live Server** extension in VS Code
2. Open the `forest-portfolio` folder in VS Code
3. Right-click `index.html` → **Open with Live Server**

### Option 2 — Node.js `serve`
```bash
npm install -g serve
cd forest-portfolio
serve .
```
Then open [http://localhost:3000](http://localhost:3000)

### Option 3 — Python (built-in)
```bash
cd forest-portfolio
python3 -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080)

---

## 📁 Project Structure

```
forest-portfolio/
├── index.html          ← Main page
├── css/
│   └── style.css       ← All styles (vars, layout, panels, form, responsive)
├── js/
│   ├── world.js        ← Three.js scene (forest, lighting, particles, shaders)
│   └── ui.js           ← UI interactions (toggle, form, audio, scroll)
├── assets/
│   └── audio/          ← (placeholder) drop .mp3 ambience files here
└── README.md
```

---

## 🎨 Customisation

### Change Portfolio Content
Edit `index.html` — look for the clearly labelled sections:
- `<!-- HERO -->` — Name & tagline
- `<!-- ABOUT -->` — Bio + stats
- `<!-- PROJECTS -->` — Work cards
- `<!-- SKILLS -->` — Skill bars (`data-w="95"` = 95%)
- `<!-- CONTACT -->` — Update the `mailto:` address in `ui.js`

### Change Your Name / Email
In `js/ui.js` update:
```js
const mailtoHref = `mailto:YOUR@EMAIL.COM?subject=...`
```

### Add EmailJS (Optional — no backend)
1. Sign up at [emailjs.com](https://emailjs.com)
2. In `js/ui.js`, replace the `window.location.href = mailtoHref` block with:
```js
emailjs.send('SERVICE_ID', 'TEMPLATE_ID', {
    from_name: safeName,
    reply_to:  data.email,
    message:   safeMessage
});
```

### Add Real Audio Files
Drop MP3 files into `assets/audio/` and in `js/ui.js` after `createForestSound()`:
```js
const audio = new Audio('assets/audio/forest-day.mp3');
audio.loop = true;
audio.volume = 0.3;
audio.play();
```

---

## 🌐 Deployment

This is a **pure static site** — deploy anywhere:
- **Netlify**: Drag & drop the folder
- **Vercel**: `vercel --prod`
- **GitHub Pages**: Push to `gh-pages` branch

---

## ⚙️ Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Mobile Chrome/Safari | ✅ Good (particles reduced via pixel ratio cap) |

> Three.js r128 requires WebGL 1.0 — supported by 98%+ of devices.

---

## 🙏 Credits & Libraries

- [Three.js r128](https://threejs.org) — 3D rendering
- [GSAP 3](https://greensock.com/gsap/) — Cinematic animations
- [TailwindCSS](https://tailwindcss.com) — Utility classes
- [Playfair Display + Cormorant Garamond](https://fonts.google.com) — Typography
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — Procedural forest ambience
