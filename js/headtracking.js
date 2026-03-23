/* ============================================================
   HEAD TRACKING PARALLAX — headtracking.js
   ─────────────────────────────────────────────────────────────
   Uses MediaPipe Face Landmarker (loaded from CDN on first click)
   to move the hero objects using your head position — the same
   way the mouse does, but hands-free.

   Flow:
   1. A small "Try head tracking" button appears in the hero.
   2. User clicks it → MediaPipe loads (~2MB, one time only).
   3. Browser asks for camera permission.
   4. Face is detected each frame; nose position → parallax target.
   5. Click again → stops, releases the camera, returns to mouse.

   This script depends on `parallaxItems` declared in main.js.
   Both are plain <script> tags (not ES modules) so they share
   the global scope — headtracking.js can read parallaxItems directly.
   ============================================================ */

(function () {

    /* ── Desktop only ──────────────────────────────────────────
       Touch devices have no real hover, so head tracking would
       fight with the tap-based interactions. Skip it entirely.   */
    if (window.matchMedia('(hover: none)').matches) return;

    /* ── State ─────────────────────────────────────────────── */
    let isTracking            = false;
    let landmarker            = null;   /* MediaPipe FaceLandmarker instance  */
    let videoEl               = null;   /* hidden <video> fed to MediaPipe    */
    let stream                = null;   /* webcam MediaStream                 */
    let rafId                 = null;   /* requestAnimationFrame handle       */
    let lastDetectTime        = 0;      /* timestamp of last detection run    */
    const DETECT_INTERVAL_MS  = 33;     /* ~30fps — plenty for smooth parallax */


    /* ── Button ────────────────────────────────────────────────
       Inserted as a real DOM element inside .hero so it sits
       in the flow of the page and can be positioned via CSS.   */
    const btn = document.createElement('button');
    btn.id          = 'head-tracking-btn';
    btn.textContent = 'Try head tracking';
    btn.setAttribute('aria-label', 'Activate head-tracking parallax effect');
    document.querySelector('.hero').appendChild(btn);


    /* ── Load MediaPipe ─────────────────────────────────────────
       Dynamic import() fetches the ESM bundle from jsDelivr CDN.
       Only runs once — subsequent clicks reuse the same instance.
       The WASM runtime is served from the same CDN path.        */
    async function loadLandmarker() {
        const { FaceLandmarker, FilesetResolver } = await import(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/vision_bundle.mjs'
        );

        const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        /* Create the landmarker in VIDEO mode for real-time detection */
        landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath:
                    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU'   /* GPU acceleration when the browser supports it */
            },
            runningMode: 'VIDEO',
            numFaces: 1           /* we only care about Carol's face */
        });
    }


    /* ── Start tracking ─────────────────────────────────────── */
    async function startTracking() {
        btn.textContent = 'Loading…';
        btn.disabled    = true;

        /* Load MediaPipe the very first time (cached after that) */
        if (!landmarker) {
            try {
                await loadLandmarker();
            } catch (err) {
                showError('Model failed to load');
                return;
            }
        }

        /* Ask the browser for the front-facing camera */
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false
            });
        } catch (err) {
            showError('Camera access denied');
            return;
        }

        /* Create a tiny hidden video element to feed frames to MediaPipe.
           It must be in the DOM and playing for detectForVideo() to work. */
        videoEl = document.createElement('video');
        videoEl.srcObject = stream;
        videoEl.setAttribute('playsinline', ''); /* required on iOS Safari */
        videoEl.style.cssText =
            'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:0;left:0;';
        document.body.appendChild(videoEl);
        await videoEl.play();

        /* Signal main.js to stop updating parallax from mousemove */
        isTracking                = true;
        window.headTrackingActive = true;

        btn.textContent = '● Stop tracking';
        btn.classList.add('is-active');
        btn.disabled    = false;

        detectLoop();
    }


    /* ── Detection loop ─────────────────────────────────────────
       requestAnimationFrame keeps the loop tied to the display
       refresh rate. We throttle the actual MediaPipe call to
       ~30fps — smoother than needed, lighter than 60fps.

       How face → parallax works:
         MediaPipe returns landmark[1] = nose tip, normalised 0→1.
         (0,0) = top-left corner of the video frame.
         We remap to -1→+1 centered at (0.5, 0.5).
         We also mirror X because webcams show a mirrored image —
         turning your head right should move things right, not left.
         Then we write into item.tx / item.ty — the same targets
         that mousemove normally writes. The lerp loop in main.js
         smoothly animates toward those targets every frame.       */
    function detectLoop() {
        if (!isTracking) return;

        rafId = requestAnimationFrame(function (now) {
            detectLoop(); /* keep the loop alive — schedule next frame first */

            /* Throttle: skip detection if less than 33ms have passed */
            if (now - lastDetectTime < DETECT_INTERVAL_MS) return;
            lastDetectTime = now;

            const result = landmarker.detectForVideo(videoEl, now);

            if (result.faceLandmarks && result.faceLandmarks.length > 0) {
                /* Nose tip: reliable, stable landmark that moves with head rotation */
                const nose = result.faceLandmarks[0][1];

                /* Remap and mirror X so the effect feels natural */
                const normX = (0.5 - nose.x) * 2; /* -1 = face left  → +1 = face right */
                const normY = (nose.y - 0.5) * 2; /* -1 = face up    → +1 = face down  */

                /* Update the same targets main.js uses for mouse parallax */
                parallaxItems.forEach(function (item) {
                    item.tx = normX * item.depth;
                    item.ty = normY * item.depth;
                });
            }
            /* No face detected → targets stay at their last value.
               The lerp loop holds that position until the face returns. */
        });
    }


    /* ── Stop tracking ──────────────────────────────────────── */
    function stopTracking() {
        isTracking                = false;
        window.headTrackingActive = false;

        if (rafId)   cancelAnimationFrame(rafId);
        if (stream)  stream.getTracks().forEach(function (t) { t.stop(); });
        if (videoEl) { videoEl.remove(); videoEl = null; }

        /* Ease all elements back to center */
        parallaxItems.forEach(function (item) { item.tx = 0; item.ty = 0; });

        btn.textContent = 'Try head tracking';
        btn.classList.remove('is-active');
    }


    /* ── Error helper ───────────────────────────────────────── */
    function showError(msg) {
        btn.textContent = msg;
        btn.disabled    = false;
        setTimeout(function () { btn.textContent = 'Try head tracking'; }, 2500);
    }


    /* ── Toggle on click ────────────────────────────────────── */
    btn.addEventListener('click', function () {
        if (isTracking) {
            stopTracking();
        } else {
            startTracking();
        }
    });

})();
