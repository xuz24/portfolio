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
- `script.js`: photo viewer and footer year.
- `assets/resume.pdf`: replace this with your latest résumé.
- `assets/photos/`: optimized copies of your original photographs.

The portfolio includes the supplied research and engineering experience, followed by selected projects. The résumé PDF is the copy carried over from the previous website; replace it separately when updating the downloadable résumé.

Fonts are loaded from Google Fonts with local sans-serif fallbacks. Everything else is served locally. All main content is readable without JavaScript. The gallery viewer supports Tab, Escape, and left/right arrow keys and restores focus on close. Reduced-motion preferences are respected.

The fixed Canvas background follows three stages: a glowing sphere behind About Me, a dim floating field behind Experience, and distinct shapes that morph directly between Projects. Transitions use actual section positions so they follow responsive content heights. The sphere assembles from the outer edges on load, shifts blue shades with particle speed, and responds only to pointer movement. Reduced-motion preferences show still particles; hidden tabs pause the animation. Projects retain native scrolling and subtle entrance motion. No JavaScript is required to read experience or project content or follow links.
