# Creative Czar — Agency Website

A vibrant, bold marketing-agency website built with **GSAP** (scroll animations, hero timeline, counters) and **Three.js** (mouse-reactive WebGL particle field). Static site, no build step — deploys straight to GitHub Pages on the custom domain **creativeczar.tech**.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Markup & content |
| `styles.css` | Styling, layout, responsive rules |
| `main.js` | Three.js particle field + GSAP interactions (ES module) |
| `CNAME` | Custom domain for GitHub Pages |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Run locally
No tooling needed — it's plain HTML/CSS/JS using CDN libraries. Any static server works:

```bash
# Python
python3 -m http.server 8000
# then open http://localhost:8000
```

> Open via a server (not `file://`) so the ES-module import map for Three.js resolves.

## Deploy to GitHub Pages

1. Create a new **public** repo on GitHub (e.g. `creativeczar-site`).
2. Push these files:
   ```bash
   git add -A
   git commit -m "Launch Creative Czar site"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<REPO>.git
   git push -u origin main
   ```
3. On GitHub → repo **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)** → Save
4. Still in **Settings → Pages → Custom domain**, enter `creativeczar.tech` and save (the included `CNAME` file already sets this).
5. Tick **Enforce HTTPS** once the certificate is issued (can take ~10–60 min).

## DNS on Namecheap

In Namecheap → Domain List → **Manage** → **Advanced DNS**, set:

| Type | Host | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<YOUR_USERNAME>.github.io.` |

Remove any default Namecheap "URL Redirect" / parking records on `@` and `www` first. DNS can take 30 min–24 h to propagate.

## Customize
- **Colors**: edit the CSS variables at the top of `styles.css` (`--pink`, `--violet`, `--cyan`, …).
- **Particle look**: `COUNT`, `palette`, and the shader sizes in `main.js`.
- **Content**: all copy lives in `index.html`.
- **Contact email**: search `hello@creativeczar.tech` in `index.html`.
