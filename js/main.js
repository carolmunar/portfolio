/* ============================================================
   CAROL MUNAR — PORTFOLIO
   main.js
   ============================================================ */


/* ============================================================
   MOUSE PARALLAX — CSS variable approach
   ─────────────────────────────────────────────────────────────
   Instead of setting style.transform directly (which would wipe out the
   CSS float animation), JS now sets two CSS variables: --px and --py.

   The .hero-object transform in style.css reads ALL four variables together:
     translate(--px, --py)  ←  JS controls this (parallax depth)
     translateY(--float-y)  ←  CSS @keyframes controls this (float bob)
     rotate(--float-r)      ←  CSS @keyframes controls this (gentle tilt)

   Neither system can override the other — they just contribute to different
   parts of the same transform chain.

   Smoothness: a lerp (linear interpolation) loop runs at 60fps via
   requestAnimationFrame. Each frame, current position moves 10% closer
   to the target (mouse position). This creates a gentle lag without
   needing a CSS transition (which could interfere with the animation).
   ============================================================ */

/* Pre-cache elements at startup — avoids repeated DOM queries inside the RAF loop */
const parallaxItems = [
    { selector: '.bookshelf',     depth: 15 },
    { selector: '.portrait-frame',depth: 25 },
    { selector: '.monstera',      depth: 10 },
    { selector: '.armchair',      depth: 8  },
    { selector: '.lamp',          depth: 20 },
    { selector: '.pulp-fiction',  depth: 18 },
    { selector: '.camera',        depth: 22 },
    { selector: '.chiva',         depth: 12 },
    /* These elements have no unique class — selected by ID instead */
    { selector: '#book',          depth: 15 },  /* on the bookshelf, same speed */
    { selector: '#book2',         depth: 15 },  /* on the bookshelf, same speed */
    { selector: '#plant',         depth: 15 },  /* vine on the regal, same speed */
    { selector: '#plantsuculent', depth: 15 },  /* on the bookshelf, same speed */
    { selector: '#plantsmall',    depth: 20 },  /* right-side planter, faster */
    { selector: '#lightswitch',   depth: 20 },  /* on the lamp cord — moves with it */
].map(function({ selector, depth }) {
    return {
        el: document.querySelector(selector),
        depth,
        tx: 0, ty: 0,   /* target position (updated on mousemove) */
        cx: 0, cy: 0    /* current position (lerped toward target each frame) */
    };
});

/* Mouse target — updated on every mousemove event */
let mouseNormX = 0;
let mouseNormY = 0;

document.addEventListener('mousemove', function(e) {
    /* On mobile/touch screens there's no real mouse — skip parallax entirely.
       Objects stay locked at their CSS positions instead of drifting. */
    if (window.innerWidth < 768) return;

    /* When head tracking is active, it controls the targets — ignore the mouse */
    if (window.headTrackingActive) return;

    /* Normalise to -1 → +1 range. Center of screen = 0 (no movement). */
    mouseNormX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseNormY = (e.clientY / window.innerHeight - 0.5) * 2;

    parallaxItems.forEach(function(item) {
        item.tx = mouseNormX * item.depth;
        item.ty = mouseNormY * item.depth;
    });
});

/* Lerp loop — runs at 60fps, smoothly chases the mouse target */
function runParallax() {
    parallaxItems.forEach(function(item) {
        if (!item.el) return;

        /* Move 10% of remaining distance each frame → smooth ease-out feel */
        item.cx += (item.tx - item.cx) * 0.1;
        item.cy += (item.ty - item.cy) * 0.1;

        /* Set CSS variables — .hero-object transform reads these automatically */
        item.el.style.setProperty('--px', item.cx + 'px');
        item.el.style.setProperty('--py', item.cy + 'px');
    });

    requestAnimationFrame(runParallax);
}

/* Start the loop immediately */
runParallax();


/* ============================================================
   RESET ON MOUSE LEAVE
   ─────────────────────────────────────────────────────────────
   Set targets back to 0 — the lerp loop will smoothly ease
   all elements back to their resting position.
   ============================================================ */
document.addEventListener('mouseleave', function() {
    parallaxItems.forEach(function(item) {
        item.tx = 0;
        item.ty = 0;
    });
});


/* ============================================================
   GLITCH EFFECT — ABOUT SECTION
   ─────────────────────────────────────────────────────────────
   The CSS glitch uses ::before and ::after pseudo-elements
   to create red and cyan "channel" copies of each paragraph.

   CSS pseudo-elements can't read an element's text on their own,
   but they CAN read HTML attributes using content: attr(data-text).

   So this script copies each paragraph's text into a data-text
   attribute — then the CSS takes it from there.
   ============================================================ */

// For each About paragraph, copy its text into data-text
// so CSS can access it via content: attr(data-text)
document.querySelectorAll('.about-text').forEach(function(el) {
    el.setAttribute('data-text', el.textContent.trim());
});


/* ============================================================
   HOVER SOUND EFFECTS — DESKTOP ONLY
   ─────────────────────────────────────────────────────────────
   Sounds only make sense with a mouse (hover). On touch devices
   there is no hover, so we skip all audio setup entirely.

   window.matchMedia('(hover: none)').matches — returns true when
   the primary input cannot hover (phones, tablets). Returns false
   on desktop with a real mouse. This is more reliable than
   checking screen width because it detects input capability,
   not just screen size.
   ============================================================ */

const isTouchDevice = window.matchMedia('(hover: none)').matches;

if (!isTouchDevice) {

    /* ─────────────────────────────────────────────────────────
       PULP FICTION — play on hover, stop on leave
       ───────────────────────────────────────────────────────── */

    // Load the sound (does NOT play automatically)
    const pulpFictionAudio = new Audio('/sounds/Voicy_This is a tasty burger.mp3');
    pulpFictionAudio.volume = 0.7; // 70% volume — not too loud

    // Find the Pulp Fiction element using the data-element attribute we added
    const pulpFictionEl = document.querySelector('[data-element="pulp-fiction"]');

    // Only set up the listeners if the element actually exists on the page
    // (This is a safety check — if the element is missing, no error will crash the page)
    if (pulpFictionEl) {
        pulpFictionEl.addEventListener('mouseenter', function() {
            pulpFictionAudio.currentTime = 0; // always start from the beginning
            pulpFictionAudio.play();
        });
        pulpFictionEl.addEventListener('mouseleave', function() {
            pulpFictionAudio.pause();
            pulpFictionAudio.currentTime = 0;
        });
    }


    /* ─────────────────────────────────────────────────────────
       CAMERA + CHIVA — same pattern as Pulp Fiction
       ───────────────────────────────────────────────────────── */

    const cameraAudio = new Audio('/sounds/camera.wav');
    cameraAudio.volume = 0.7;

    const chivaAudio = new Audio('/sounds/chiva.mp3');
    chivaAudio.volume = 0.7;


    /* ─────────────────────────────────────────────────────────
       AUDIO UNLOCK — one-time fix for browser autoplay policy
       ─────────────────────────────────────────────────────────
       Browsers block audio.play() unless the user has first made
       an "activation gesture" (click, tap, or key press).
       Hovering (mouseenter) does NOT count on its own.

       Fix: on the first click anywhere, silently play-then-pause
       each file to register them as user-approved. After that,
       play() works from any event including mouseenter.
       { once: true } means this listener fires once then removes itself.
       ───────────────────────────────────────────────────────── */
    document.addEventListener('click', function() {
        [pulpFictionAudio, cameraAudio, chivaAudio].forEach(function(audio) {
            audio.volume = 0;
            audio.play().then(function() {
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 0.7; // restore normal volume after unlock
            }).catch(function() {
                // Silently ignore any errors during unlock
            });
        });
    }, { once: true });


    /* ─────────────────────────────────────────────────────────
       CAMERA hover listeners
       ───────────────────────────────────────────────────────── */
    const cameraEl = document.querySelector('[data-element="camera"]');
    if (cameraEl) {
        cameraEl.addEventListener('mouseenter', function() {
            cameraAudio.currentTime = 0;
            cameraAudio.play();
        });
        cameraEl.addEventListener('mouseleave', function() {
            cameraAudio.pause();
            cameraAudio.currentTime = 0;
        });
    }


    /* ─────────────────────────────────────────────────────────
       CHIVA hover listeners
       ───────────────────────────────────────────────────────── */
    const chivaEl = document.querySelector('[data-element="chiva"]');
    if (chivaEl) {
        chivaEl.addEventListener('mouseenter', function() {
            chivaAudio.currentTime = 0;
            chivaAudio.play();
        });
        chivaEl.addEventListener('mouseleave', function() {
            chivaAudio.pause();
            chivaAudio.currentTime = 0;
        });
    }

} // end !isTouchDevice


/* ============================================================
   PLANTSMALL — EASTER EGG TOOLTIP
   ─────────────────────────────────────────────────────────────
   The tooltip uses position:fixed so it escapes the hero's
   overflow:hidden. But that means when the mouse moves FROM
   the plant div TOWARD the tooltip card, it briefly leaves
   the plant — triggering mouseleave and hiding the tooltip.

   Fix: track whether the mouse is over the plant OR the tooltip.
   A small 150ms timeout before hiding gives the mouse time to
   travel from one to the other without the card disappearing.
   ============================================================ */

const plantsmallEl = document.getElementById('plantsmall');
const plantsmallTooltip = plantsmallEl
    ? plantsmallEl.querySelector('.plantbig-tooltip')
    : null;

if (plantsmallEl && plantsmallTooltip) {

    let isOverPlant   = false;
    let isOverTooltip = false;
    let hideTimer     = null;

    function showPlantTooltip() {
        clearTimeout(hideTimer);
        plantsmallTooltip.classList.add('is-visible');
    }

    function schedulePlantHide() {
        // Wait 300ms — gives the mouse time to travel from the plant to the tooltip card
        hideTimer = setTimeout(function() {
            if (!isOverPlant && !isOverTooltip) {
                plantsmallTooltip.classList.remove('is-visible');
            }
        }, 150);
    }

    // Mouse enters the plant div → show tooltip
    plantsmallEl.addEventListener('mouseenter', function() {
        isOverPlant = true;
        showPlantTooltip();
    });

    // Mouse leaves the plant div → start the 150ms countdown
    plantsmallEl.addEventListener('mouseleave', function() {
        isOverPlant = false;
        schedulePlantHide();
    });

    // Mouse enters the tooltip card → cancel any pending hide
    plantsmallTooltip.addEventListener('mouseenter', function() {
        isOverTooltip = true;
        showPlantTooltip();
    });

    // Mouse leaves the tooltip card → start the 150ms countdown
    plantsmallTooltip.addEventListener('mouseleave', function() {
        isOverTooltip = false;
        schedulePlantHide();
    });
}


/* ── PROJECT PREVIEW (multi-image sets, right-aligned) ──
   When hovering a project row, the matching .preview-set fades in.
   All other sets are hidden. No cursor following — opacity only.
   On mobile (< 768px) we skip everything — CSS also hides the area. */

if (window.innerWidth > 768) {

    /* Map each data-project value to its preview-set element */
    const previewMap = {
        'alphin':  document.getElementById('preview-alphin'),
        'adjust':  document.getElementById('preview-adjust'),
        'agrofy':  document.getElementById('preview-agrofy'),
        'estylar': document.getElementById('preview-estylar')
    };

    document.querySelectorAll('[data-project]').forEach(function(row) {

        /* Only the logo box (coloured square) triggers the preview —
           not the title text. We find the .case-logo inside each row. */
        var logo = row.querySelector('.case-logo');
        if (!logo) return;

        logo.addEventListener('mouseenter', function() {
            /* Hide all sets first, then show the matching one.
               .filter(Boolean) skips any null entries (missing IDs) */
            Object.values(previewMap).filter(Boolean).forEach(function(p) {
                p.classList.remove('visible');
            });
            var preview = previewMap[row.dataset.project];
            if (preview) preview.classList.add('visible');
        });

        logo.addEventListener('mouseleave', function() {
            /* Hide all sets when the mouse leaves the logo */
            Object.values(previewMap).filter(Boolean).forEach(function(p) {
                p.classList.remove('visible');
            });
        });

    });
}


/* ============================================================
   LIGHT SWITCH — DARK MODE TOGGLE
   ─────────────────────────────────────────────────────────────
   Clicking the switch image toggles dark / light mode.
   The switch shows switchOn.webp (light mode) or switchOff.webp (dark mode).
   A click sound plays on every toggle.

   1. localStorage restores the saved preference on every page load.
   2. Each click toggles .dark-mode on <body>.
   3. CSS swaps the switch image and applies dark-mode colours.
   4. The lamp gets a warm glow in dark mode (it's the light source!).
   ============================================================ */

/* Dark mode — desktop only (isTouchDevice already defined above for sounds).
   On mobile the switch is hidden in CSS and this whole block is skipped. */
if (!isTouchDevice) {

    /* Restore saved preference before first paint */
    if (localStorage.getItem('darkMode') === 'on') {
        document.body.classList.add('dark-mode');
    }

    const lightSwitchEl  = document.getElementById('lightswitch');
    const lightSwitchAudio = new Audio('/sounds/light.mp3');
    lightSwitchAudio.volume = 0.6;

    if (lightSwitchEl) {
        lightSwitchEl.addEventListener('click', function() {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDark ? 'on' : 'off');

            /* Play the click sound — reset first so rapid clicks always fire */
            lightSwitchAudio.currentTime = 0;
            lightSwitchAudio.play().catch(function() {
                /* Silently ignore if browser blocks audio before interaction */
            });
        });
    }

} // end !isTouchDevice
