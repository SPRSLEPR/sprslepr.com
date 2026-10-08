# SPRSLEPR

## Write and publish a post

1. Open [Pages CMS](https://app.pagescms.org), sign in with GitHub, and install its GitHub App for **SPRSLEPR/sprslepr.com**.
2. Open this repository on the `main` branch and choose **Posts → Add**.
3. Enter the title, short description, topic, series (Midnight Snacks, Night Shift, or Night Terrors), and post date.
4. Write in **Post content**. Use the image button to upload images. Add a code block and choose `swift` as its language; Source mode also accepts fenced Markdown.
5. Choose a code style. Leave **Status** as **Draft** while writing.
6. Set **Status** to **Published** and save when ready. GitHub builds the post, adds it under its series, updates the homepage's latest-post link, and publishes the site automatically.

To unpublish a post, change its status back to Draft and save. The filename determines its URL, so avoid renaming it after publication. The post date controls sorting, not scheduled publication.

Drafts are excluded from the published website. This is a public GitHub repository, so their source files are still visible on GitHub. The local sample page is excluded from both Git and the deployment.

## Swift code

In the editor's Source mode:

````markdown
```swift
let name = "Super Sleeper"
print(name)
```
````

Code highlighting is automatic. A code block can optionally include a filename, such as `swift NavigationTitle.swift`, to display it above the snippet. Each block has a Copy button. Styles: **Night**, **Paper**, **Moonlight**, **Xcode-ish**, **Dawn**, **3AM Terminal**, **Ink**, and **Lights Out**.

For an individual snippet in an HTML page:

```html
<pre class="sps-code" data-theme="dawn"><code class="language-swift">let name = "Super Sleeper"</code></pre>
```

Theme names: `night`, `paper`, `moonlight`, `xcode`, `dawn`, `terminal`, `ink`, `lights-out`. Reference screenshots are saved locally in `docs/design/code-snippets/` and excluded from Git.

## Development

- `npm ci`: install the Markdown and YAML parsers.
- `npm test`: check rendering, drafts, topic lists, and publishing exclusions.
- `npm run build`: generate the public site in `_site/`.
- `python3 -m http.server 8080 --directory _site`: preview at http://localhost:8080.

Post source lives in `content/posts/`; `.pages.yml` defines the editor. `templates/post.html` controls the post layout. `scripts/build.mjs` builds it. `.github/workflows/publish.yml` publishes to GitHub Pages on each push to `main`.

The builder copies only public HTML and assets. Source content, local samples, and editor configuration are excluded. Existing `index.html`, `about.html`, and `404.html` remain editable HTML. `guides/index.html` contains insertion points for the featured post and automatically generated series lists. Empty series show an empty state. The newest post is featured unless a post has **Feature this post** enabled.

Swift highlighting uses locally hosted PrismJS 1.30.0 (MIT licensed). The original mascot poses are in `assets/img/mascot/tech/`. Reuse those images for future posts.
