# sprslepr.com: static site for GitHub Pages

## Structure
- `index.html`: homepage (featured guide + the index)
- `guides/index.html`: all guides grouped by topic
- `guides/_template.html`: copy this for every new guide
- `about.html`, `404.html`
- `assets/css/site.css` · `assets/fonts/` · `assets/img/`
- `assets/img/mascot/tech/`: 25 original transparent tech poses saved for future SPRSLEPR branding. Reuse these assets for future guides and pages; only two appear in the current guide empty states.
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

## Swift code blocks
The guide template includes locally hosted PrismJS 1.30.0 (MIT licensed) with Swift highlighting. Paste escaped code into:

```html
<div class="sps-code-label">SWIFT</div>
<pre class="sps-code"><code class="language-swift">let name = "Super Sleeper"</code></pre>
```

Escape `&` as `&amp;` and `<` as `&lt;` in HTML code blocks. Highlighting happens automatically, using the site's dark purple background and orange, lavender, mint, and gold accents.

## Saved code themes
Reference screenshots are in `docs/design/code-snippets/`. The guide template loads `assets/css/code-themes.css` with eight optional palettes: `night`, `paper`, `moonlight`, `xcode`, `dawn`, `terminal` (3AM Terminal), `ink`, and `lights-out`.

Choose a theme per snippet; omit `data-theme` to keep the current default:

```html
<pre class="sps-code" data-theme="dawn"><code class="language-swift">let name = "Super Sleeper"</code></pre>
```

These are reusable color palettes. The screenshots also preserve ideas for future copy buttons, filename bars, line numbers, and highlighted lines.

## To do
- Replace `assets/img/favicon.png` and `og-banner.png` if you want different ones.
- Check the Savannah font license allows web use.
