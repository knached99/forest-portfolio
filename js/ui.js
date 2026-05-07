/**
 * ui.js — Portfolio UI interactions
 * Handles: Day/Night toggle, Audio, Contact Form, Smooth scroll, Nav
 */
(function () {
    'use strict';

    /* ── Day / Night Toggle ─────────────────────────────── */
    const dayNightBtn = document.getElementById('day-night-btn');
    if (dayNightBtn) {
        const dayIcon   = dayNightBtn.querySelector('.day-icon');
        const nightIcon = dayNightBtn.querySelector('.night-icon');

        /* T042: Initialize button state from current scene state */
        function syncDayNightBtn() {
            if (!window.forestScene) return;
            const night = window.forestScene.isNight;
            dayIcon   && dayIcon.classList.toggle('hidden', night);
            nightIcon && nightIcon.classList.toggle('hidden', !night);
            dayNightBtn.setAttribute('title', night ? 'Switch to Day' : 'Switch to Night');
        }

        dayNightBtn.addEventListener('click', () => {
            if (window.forestScene) {
                window.forestScene.toggleDayNight();
                syncDayNightBtn();
                updateAmbientAudio(); // Update audio based on new time of day
            }
        });

        /* Sync once scene is ready (world.js fires this after init) */
        window.addEventListener('forestSceneReady', syncDayNightBtn, { once: true });
        /* Fallback: sync after short delay in case event already fired */
        setTimeout(syncDayNightBtn, 600);
    }

    /* ── Audio Toggle (MP3-based) ───────────────────────── */
const audioBtn = document.getElementById('audio-btn');
const soundOnIcon = audioBtn && audioBtn.querySelector('.sound-on-icon');
const soundOffIcon = audioBtn && audioBtn.querySelector('.sound-off-icon');

let audioOn = false;

const savedAudio = localStorage.getItem('audioOn');
if (savedAudio !== null) {
    audioOn = JSON.parse(savedAudio);

    // sync icons immediately
    if (audioOn) {
        soundOnIcon?.classList.remove('hidden');
        soundOffIcon?.classList.add('hidden');
    } else {
        soundOnIcon?.classList.add('hidden');
        soundOffIcon?.classList.remove('hidden');
    }
}

// Wait for audio manager to be available, then start audio if needed
if (audioOn) {
    const tryStartAudio = () => {
        if (window.audioManager && window.seasonManager && window.forestScene) {
            // Trigger seasonal audio to play
            audioManager.updateSeasonalAudio(
                window.seasonManager.currentSeason,
                window.forestScene.isNight
            );
        } else {
            setTimeout(tryStartAudio, 100);
        }
    };

    tryStartAudio();
}

// Get current season
function getSeason() {
    if (window.seasonManager?.currentSeason) {
        return window.seasonManager.currentSeason;
    }

    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'fall';
    return 'winter';
}

// Update audio based on season + day/night (now delegates to audioManager)
function updateAmbientAudio() {
    if (!audioOn || !window.audioManager) return;

    const season = window.seasonManager?.currentSeason || getSeason();
    const isNight = window.forestScene?.isNight || false;
    
    window.audioManager.updateSeasonalAudio(season, isNight);
}

// Button click
if (audioBtn) {
    audioBtn.addEventListener('click', () => {
        audioOn = !audioOn;

        // 💾 SAVE STATE
        localStorage.setItem('audioOn', JSON.stringify(audioOn));

        if (audioOn) {
            // Start audio through manager
            if (window.audioManager) {
                const season = window.seasonManager?.currentSeason || getSeason();
                const isNight = window.forestScene?.isNight || false;
                window.audioManager.toggleAudio(true);
                window.audioManager.updateSeasonalAudio(season, isNight);
            }
            soundOnIcon?.classList.remove('hidden');
            soundOffIcon?.classList.add('hidden');
        } else {
            // Stop audio through manager
            if (window.audioManager) {
                window.audioManager.toggleAudio(false);
            }
            soundOnIcon?.classList.add('hidden');
            soundOffIcon?.classList.remove('hidden');
        }

        audioBtn.setAttribute(
            'title',
            audioOn ? 'Mute Forest Sounds' : 'Unmute Forest Sounds'
        );
    });
}

// Sync when scene loads
window.addEventListener('forestSceneReady', () => {
    // ensure correct season audio is ready
    if (audioOn && window.audioManager) {
        const season = window.seasonManager?.currentSeason || getSeason();
        const isNight = window.forestScene?.isNight || false;
        window.audioManager.updateSeasonalAudio(season, isNight);
    }
});



    /* ── Smooth Scroll for Anchor Links ─────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ── Nav Opacity on Scroll ───────────────────────────── */
    const mainNav = document.getElementById('main-nav');
    let lastY     = 0;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (mainNav) {
            mainNav.style.transform = y > 100 && y > lastY
                ? 'translateY(-4px)'
                : 'translateY(0)';
        }
        lastY = y;
    }, { passive: true });

    // get stored season from localStorage and apply it on load 
    function getStoredSeason() 
    {
        const raw = localStorage.getItem('selectedSeason');
        if (!raw) return null; 

        try {
            const data = JSON.parse(raw);

            if (Date.now() > data.expires) {
                localStorage.removeItem('selectedSeason');
                return null;
            }

            return data.season;
        }
        catch (e) {
            localStorage.removeItem('selectedSeason');
            return null;
        }
    }
    /* ── T029: Season Selector ───────────────────────────── */
    const seasonBtns = document.querySelectorAll('.season-btn');
    if (seasonBtns.length) {
        function updateSeasonActive(name) {
            seasonBtns.forEach(btn => {
                btn.classList.toggle('season-btn--active', btn.dataset.season === name);
            });
        }

      seasonBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const s = btn.dataset.season;

            if (window.seasonManager && !window.seasonManager.isTransitioning) {
                window.seasonManager.setSeason(s);
                updateSeasonActive(s);

                // 🔥 ADD THIS LINE (instant audio fix)
                updateAmbientAudio();

                localStorage.setItem('selectedSeason', JSON.stringify({
                    season: s,
                    expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
                }));
            }
        });
    });
            

        /* Listen for external season changes (e.g., from world.js) */
        if (window.seasonManager) {
            window.seasonManager.onSeasonChange(name => updateSeasonActive(name));
            updateSeasonActive(window.seasonManager.currentSeason);
        }

        /* Retry once scene is ready */
        window.addEventListener('forestSceneReady', () => {
    if (!window.seasonManager) return;

    // 1. RESTORE SEASON FIRST (authoritative source)
    const savedSeason = getStoredSeason();
    const season = savedSeason || window.seasonManager.currentSeason;

    window.seasonManager.setSeason(season);
    updateSeasonActive(season);

    // 2. ENSURE AUDIO IS RESTORED STATEFULLY
    const savedAudio = localStorage.getItem('audioOn');
    audioOn = savedAudio ? JSON.parse(savedAudio) : false;

    // sync icons
    if (audioOn) {
        soundOnIcon?.classList.remove('hidden');
        soundOffIcon?.classList.add('hidden');
    } else {
        soundOnIcon?.classList.add('hidden');
        soundOffIcon?.classList.remove('hidden');
    }

    // 3. BIND ONCE
    if (!window.__seasonAudioBound) {
        window.__seasonAudioBound = true;

        window.seasonManager.onSeasonChange((name) => {
            updateSeasonActive(name);
            updateAmbientAudio();
        });
    }

    // 4. 🔥 ONLY START AUDIO AFTER EVERYTHING IS READY
    if (audioOn) {
        updateAmbientAudio();
    }
}, { once: true });
    }

    /* ── Contact Form ────────────────────────────────────── */
    const form       = document.getElementById('contact-form');
    const submitBtn  = document.getElementById('submit-btn');
    const successEl  = document.getElementById('form-success');

    const fields = {
        name:    { el: document.getElementById('form-name'),    err: document.getElementById('err-name') },
        email:   { el: document.getElementById('form-email'),   err: document.getElementById('err-email') },
        message: { el: document.getElementById('form-message'), err: document.getElementById('err-message') }
    };

    const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    /* T016: Record form-open timestamp for time gate */
    const _ft = Date.now();

    let lastSubmit = 0;   // Rate-limit timestamp

    function sanitize(str) {
        const tmp = document.createElement('div');
        tmp.appendChild(document.createTextNode(str));
        return tmp.innerHTML;
    }

    function setError(key, msg) {
        const f = fields[key];
        if (!f) return;
        f.el.classList.toggle('is-error', !!msg);
        f.err.textContent = msg || '';
    }

    function clearErrors() {
        Object.keys(fields).forEach(k => setError(k, ''));
    }

    function validateForm(data) {
        let ok = true;

        if (!data.name || data.name.length < 2) {
            setError('name', 'Please enter your full name.');
            ok = false;
        }

        if (!data.email || !EMAIL_RE.test(data.email)) {
            setError('email', 'Please enter a valid email address.');
            ok = false;
        }

        if (!data.message || data.message.trim().length < 15) {
            setError('message', 'Your message must be at least 15 characters.');
            ok = false;
        }

        return ok;
    }

    if (form) {
        // Real-time validation on blur
        Object.keys(fields).forEach(key => {
            const f = fields[key];
            if (f.el) {
                f.el.addEventListener('blur', () => {
                    const v = f.el.value.trim();
                    if (key === 'name'    && v.length < 2)          setError('name',    'Name is too short.');
                    else if (key === 'email' && !EMAIL_RE.test(v))  setError('email',   'Enter a valid email.');
                    else if (key === 'message' && v.length < 15)    setError('message', 'Message too short (15 chars min).');
                    else setError(key, '');
                });
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            /* T017: Honeypot check — bots fill hidden fields */
            const hp = form.querySelector('[name="_hp"]');
            if (hp && hp.value) return;

            /* T016: Time-on-form gate — reject submissions under 3 seconds */
            if (Date.now() - _ft < 3000) {
                setError('message', 'Please take a moment to compose your message.');
                return;
            }

            /* T017: Rate limit — 10 seconds between submissions */
            const now = Date.now();
            if (now - lastSubmit < 10000) {
                setError('message', 'Please wait a moment before sending again.');
                return;
            }

            clearErrors();

            const data = {
                name:    fields.name.el.value.trim(),
                email:   fields.email.el.value.trim(),
                message: fields.message.el.value.trim()
            };

            if (!validateForm(data)) return;

            lastSubmit = now;
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-label').classList.add('hidden');
            submitBtn.querySelector('.btn-sending').classList.remove('hidden');

            /* T015: Obfuscated destination — assembled at runtime, never in source as a string */
            const _d = ['khalednached', '11', '@', 'gmail', '.com'];
            const dest = _d.join('');

            const safeName    = sanitize(data.name);
            const safeMessage = sanitize(data.message);

            const subject = encodeURIComponent('Portfolio Contact from ' + safeName);
            const body    = encodeURIComponent(
                'Name: ' + safeName + '\nEmail: ' + data.email + '\n\nMessage:\n' + safeMessage
            );
            const mailtoHref = 'mailto:' + dest + '?subject=' + subject + '&body=' + body;

            /* T018: Open mailto then check if mail client responded */
            setTimeout(() => {
                const opened = window.open(mailtoHref, '_self');

                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-label').classList.remove('hidden');
                submitBtn.querySelector('.btn-sending').classList.add('hidden');

                successEl.classList.remove('hidden');
                form.reset();
                setTimeout(() => successEl.classList.add('hidden'), 6000);

                /* T018: Fallback — if no mail client, show readable address after 1500ms */
                setTimeout(() => {
                    const fallback = document.getElementById('form-fallback');
                    const fallbackEmail = document.getElementById('fallback-email');
                    if (fallback && fallbackEmail) {
                        /* Only reveal if the page is still visible (didn't navigate to mail app) */
                        if (!document.hidden) {
                            fallbackEmail.textContent = dest;
                            fallback.classList.remove('hidden');
                        }
                    }
                }, 1500);
            }, 800);
        });
    }

    /* ── Project card hover particle burst (optional) ───── */
    document.querySelectorAll('.project-row').forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.transition = 'padding-left 0.3s ease, background 0.3s';
        });
    });

    /* ── Scroll progress indicator in nav ───────────────── */
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 2px;
        background: var(--accent);
        z-index: 9999;
        pointer-events: none;
        transition: width 0.1s linear;
        width: 0%;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const total    = document.body.scrollHeight - window.innerHeight;
        progressBar.style.width = (scrolled / Math.max(total, 1) * 100) + '%';
    }, { passive: true });

    /* ── Project card click ripple ───────────────────────── */
    document.querySelectorAll('.project-row').forEach(row => {
        row.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            const rect   = this.getBoundingClientRect();
            ripple.style.cssText = `
                position:absolute;
                border-radius:50%;
                pointer-events:none;
                width:4px; height:4px;
                background: var(--accent);
                opacity: 0.6;
                left: ${e.clientX - rect.left}px;
                top:  ${e.clientY - rect.top}px;
                transform: scale(0);
                transition: transform 0.5s ease, opacity 0.5s ease;
            `;
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            requestAnimationFrame(() => {
                ripple.style.transform = 'scale(80)';
                ripple.style.opacity   = '0';
                creekUniforms.uTime.value = performance.now() / 1000;
            });
            setTimeout(() => ripple.remove(), 600);
        });
    });

}());