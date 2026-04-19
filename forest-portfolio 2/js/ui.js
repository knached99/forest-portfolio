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

        dayNightBtn.addEventListener('click', () => {
            if (window.forestScene) {
                window.forestScene.toggleDayNight();
                const night = window.forestScene.isNight;
                dayIcon.classList.toggle('hidden', night);
                nightIcon.classList.toggle('hidden', !night);
                dayNightBtn.setAttribute('title', night ? 'Switch to Day' : 'Switch to Night');
            }
        });
    }

    /* ── Audio Toggle (Web Audio) ───────────────────────── */
    const audioBtn      = document.getElementById('audio-btn');
    const soundOnIcon   = audioBtn && audioBtn.querySelector('.sound-on-icon');
    const soundOffIcon  = audioBtn && audioBtn.querySelector('.sound-off-icon');

    let audioCtx  = null;
    let gainNode  = null;
    let audioOn   = false;
    let ambientNodes = [];

    function createForestSound() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioCtx.createGain();
            gainNode.gain.value = 0;
            gainNode.connect(audioCtx.destination);

            // Layer 1: Wind (low-frequency filtered noise)
            createNoiseLayer(0.5, 180, 0.08);
            // Layer 2: Leaves (higher pitch filtered noise)
            createNoiseLayer(3.5, 1200, 0.04);
            // Layer 3: Gentle rumble
            createToneLayer(55, 0.03);
            createToneLayer(110, 0.015);

            // Fade in
            gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 3);
        } catch (e) {
            console.warn('Web Audio not supported:', e);
        }
    }

    function createNoiseLayer(playbackRate, filterFreq, gainAmt) {
        const bufLen  = audioCtx.sampleRate * 3;
        const buf     = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
        const data    = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

        const src    = audioCtx.createBufferSource();
        src.buffer   = buf;
        src.loop     = true;
        src.playbackRate.value = playbackRate;

        const filter = audioCtx.createBiquadFilter();
        filter.type  = 'bandpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 0.8;

        const gain   = audioCtx.createGain();
        gain.gain.value = gainAmt;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(gainNode);
        src.start();
        ambientNodes.push(src, filter, gain);
    }

    function createToneLayer(freq, amp) {
        const osc = audioCtx.createOscillator();
        osc.type  = 'sine';
        osc.frequency.value = freq;
        const g   = audioCtx.createGain();
        g.gain.value = amp;
        osc.connect(g);
        g.connect(gainNode);
        osc.start();
        ambientNodes.push(osc, g);
    }

    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            audioOn = !audioOn;
            if (audioOn) {
                createForestSound();
                if (gainNode) {
                    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 1.5);
                }
                soundOnIcon  && soundOnIcon.classList.remove('hidden');
                soundOffIcon && soundOffIcon.classList.add('hidden');
            } else {
                if (gainNode) {
                    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
                }
                soundOnIcon  && soundOnIcon.classList.add('hidden');
                soundOffIcon && soundOffIcon.classList.remove('hidden');
            }
            audioBtn.setAttribute('title', audioOn ? 'Mute Forest Sounds' : 'Unmute Forest Sounds');
        });
    }

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

            /* Rate limit: 10 seconds between submissions */
            const now = Date.now();
            if (now - lastSubmit < 10000) {
                setError('message', 'Please wait a moment before sending again.');
                return;
            }

            /* Honeypot check */
            const hp = form.querySelector('[name="_hp"]');
            if (hp && hp.value) return; // Bot detected

            clearErrors();

            const data = {
                name:    fields.name.el.value.trim(),
                email:   fields.email.el.value.trim(),
                message: fields.message.el.value.trim()
            };

            if (!validateForm(data)) return;

            /* Submit */
            lastSubmit = now;
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-label').classList.add('hidden');
            submitBtn.querySelector('.btn-sending').classList.remove('hidden');

            /* Sanitize */
            const safeName    = sanitize(data.name);
            const safeMessage = sanitize(data.message);

            // Build mailto (no backend needed)
            const subject = encodeURIComponent(`Portfolio Contact from ${safeName}`);
            const body    = encodeURIComponent(
                `Name: ${safeName}\nEmail: ${data.email}\n\nMessage:\n${safeMessage}`
            );
            const mailtoHref = `mailto:hello@alexchen.dev?subject=${subject}&body=${body}`;

            setTimeout(() => {
                window.location.href = mailtoHref;

                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-label').classList.remove('hidden');
                submitBtn.querySelector('.btn-sending').classList.add('hidden');

                // Show success
                successEl.classList.remove('hidden');
                form.reset();

                setTimeout(() => successEl.classList.add('hidden'), 6000);
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
            });
            setTimeout(() => ripple.remove(), 600);
        });
    });

}());
