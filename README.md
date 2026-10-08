# sprslepr.com: static site for GitHub Pages

## Structure
- `index.html`: homepage (featured guide + the index)
- `guides/index.html`: all guides grouped by topic
- `guides/_template.html`: copy this for every new guide
- `about.html`, `404.html`
- `assets/css/site.css` · `assets/fonts/` · `assets/img/`
- `CNAME` (sprslepr.com) · `.nojekyll`

## Publish
1. Create a GitHub repo (e.g. `sprslepr.com`) and upload **the contents of this folder** to the root of the repo.
2. Repo → Settings → Pages → Source: **Deploy from a branch** → `main` / `(root)` → Save.
3. Custom domain: `sprslepr.com` (already in CNAME) → tick **Enforce HTTPS** once it's available.
4. At your domain registrar, add DNS records:
   - `A` records for `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - `CNAME` for `www` → `YOUR-GITHUB-USERNAME.github.io`
   DNS can take up to 24h.

## Add a guide
1. Copy `guides/_template.html` → `guides/your-slug.html` and fill every [BRACKET].
2. Add a row to the top of the index in `index.html` and under the right topic in `guides/index.html`.
3. Optional: point the homepage hero at it.

## To do
- Replace `assets/img/favicon.png` and `og-banner.png` if you want different ones.
- Check the Savannah font license allows web use.
