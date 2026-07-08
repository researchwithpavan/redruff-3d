# RedRuff 3D Vision Website

A static HTML, CSS, and JavaScript website for RedRuff with a scroll-driven 3D narrative.

## Files

- `index.html` — page structure and story sections
- `styles.css` — responsive visual system, typography, glass UI, micro-interactions
- `app.js` — Three.js 3D world, scroll transitions, physics-inspired motion
- `assets/redruff-logo-transparent.png` — RedRuff logo asset

## Run locally

Because the 3D scene loads a local texture, run it from a local server instead of opening the HTML file directly.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Notes

The site uses Three.js from a CDN. The page includes a graceful fallback if WebGL or the CDN is unavailable.
