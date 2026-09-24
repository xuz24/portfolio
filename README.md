# Zijie Xu — Portfolio

A responsive, static portfolio and photography journal. Plain HTML, CSS, and JavaScript; no framework, package installation, or build step.

## Preview locally

From this directory:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. You can also open `index.html` directly.

## Deploy

**GitHub Pages:** Push these files to a repository. In the repository's Settings → Pages, select “Deploy from a branch,” your branch, and `/ (root)`. Save. Relative asset links support both user sites and repository subpaths. `.nojekyll` bypasses Jekyll processing.

**Vercel:** Import the repository, choose the “Other” framework preset, leave the build command empty, and set the output directory to `.`. No environment variables or backend are required.

## Make it yours

- `index.html`: centered introduction, social links, and sequential projects.
- `gallery.html`: photo collections and accessible photo viewer.
- `style.css`: dark navy and pale blue palette, typography, and responsive layouts.
- `motion.js`: a perspective-projected grain sphere, movement-driven pointer repulsion, and scroll motion.
- `gallery.css`: photography page styling.
- `script.js`: typing animation, shared image viewer, and footer year.
- `lightbox.css`: shared gallery and project screenshot viewer styles.
- `gallery-map.js`: interactive travel map with locally hosted Natural Earth outlines.
- `assets/resume.pdf`: replace this with your latest résumé.
- `assets/photos/`: full-resolution photographs.
- `assets/previews/`: responsive WebP thumbnails; originals load when the image viewer opens.
- `section-nav.js`: section navigation and active entry tracking.

The portfolio includes the supplied research and engineering experience, followed by selected projects. The résumé PDF is the copy carried over from the previous website; replace it separately when updating the downloadable résumé.

Fonts are loaded from Google Fonts with local sans-serif fallbacks. Everything else is served locally. All main content is readable without JavaScript. The gallery viewer supports Tab, Escape, and left/right arrow keys and restores focus on close. Reduced-motion preferences are respected.

The landing page’s glowing particle sphere gathers from across the viewport, responds to pointer movement, and disperses with its mesh into a dim floating background as you reach About Me. Experience and Projects retain that background. Native scroll snapping keeps sections aligned. Wheel, touch, keyboard, and anchor navigation are browser-managed without custom scroll interception. Mobile layouts place images below the text. Project screenshots and gallery photos open in a keyboard-accessible dialog, while screenshot links still open the original image without JavaScript.

The travel map includes 11 visited cities and world, North America, and East Asia views. Its land outlines come from public-domain Natural Earth data and are stored in `assets/world-land.svg`; no map API or key is needed. City selectors live in `gallery.html`. Existing photo collections are linked only where available.

The opening animation skips invisible grains and redundant setup. Hidden tabs pause rendering and typing; reduced-motion preferences show still particles and static introduction text. All portfolio text, project links, images, and contact details remain available without JavaScript.

Responsive previews reduce the largest preview set from 23.6 MB of originals to 1.35 MB. Regenerate them after replacing images with `python3 scripts/optimize-images.py` (requires macOS `sips` and `cwebp`). Generated files are committed; deployment requires no image tools or build step. The renderer shares trigonometric calculations, skips offscreen drawing, and lowers ambient animation frequency. Navigation and scroll effects avoid redundant DOM writes.
