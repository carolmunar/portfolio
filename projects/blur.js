/* ─────────────────────────────────────────────────────────
   Progressive Blur Overlay — bottom of viewport
   ─────────────────────────────────────────────────────────
   Recreates the layered blur technique used on sananes.co.

   HOW IT WORKS:
   Imagine 8 semi-transparent sheets stacked on top of each other,
   fixed to the bottom of the screen. Each sheet:
     • Has a blur amount that doubles from the previous (0.5px → 36px)
     • Has a gradient mask so it only blurs one "band" of the overlay
   The result: the top of the overlay is barely blurred, the bottom
   is very blurred — content seems to melt away as you scroll.

   The <div id="scroll-blur"> in the HTML acts as the container.
   This script fills it with the 8 inner blur layers.
──────────────────────────────────────────────────────────── */

(function () {
    var container = document.getElementById('scroll-blur');
    if (!container) return;  /* Safety: do nothing if div is missing */

    /* Each row: [blurAmount, bandStartPercent]
       Blur doubles each step. Band shifts down 12.5% each step.
       The mask makes each div visible only in its 25%-wide band. */
    var layers = [
        [0.5,    0   ],
        [0.5625, 12.5],
        [1.125,  25  ],
        [2.25,   37.5],
        [4.5,    50  ],
        [9,      62.5],
        [18,     75  ],
        [36,     87.5],
    ];

    layers.forEach(function (cfg) {
        var blur  = cfg[0];   /* px blur amount for this layer */
        var start = cfg[1];   /* where this band starts (%) */

        /* Build the mask gradient: transparent → opaque → opaque → transparent
           Each band is 25% wide, and only the opaque part blurs content */
        var mask;
        if (start + 37.5 > 100) {
            /* Last 2 layers: fade in but don't fade back out (no room) */
            mask = 'linear-gradient(' +
                'rgba(0,0,0,0) '   + start         + '%, ' +
                'rgba(0,0,0,1) '   + (start + 12.5)+ '%'   +
            ')';
        } else {
            mask = 'linear-gradient(' +
                'rgba(0,0,0,0) '   + start          + '%, ' +
                'rgba(0,0,0,1) '   + (start + 12.5) + '%, ' +
                'rgba(0,0,0,1) '   + (start + 25)   + '%, ' +
                'rgba(0,0,0,0) '   + (start + 37.5) + '%'   +
            ')';
        }

        var div = document.createElement('div');
        div.style.position            = 'absolute';
        div.style.inset               = '0';  /* top:0 right:0 bottom:0 left:0 */
        div.style.backdropFilter      = 'blur(' + blur + 'px)';
        div.style.webkitBackdropFilter= 'blur(' + blur + 'px)';  /* Safari */
        div.style.webkitMaskImage     = mask;
        div.style.maskImage           = mask;

        container.appendChild(div);
    });
})();
