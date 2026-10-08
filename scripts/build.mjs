import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { parse } from 'yaml';

const topics = { ios: 'iOS', swift: 'Swift' };
const themes = ['night', 'paper', 'moonlight', 'xcode', 'dawn', 'terminal', 'ink', 'lights-out'];
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

export function readPost(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: missing post metadata`);
  const post = { ...parse(match[1]), body: match[2] };
  // Incomplete drafts are allowed; only explicitly published posts go live.
  if (post.status !== 'published') return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(filename)) throw new Error(`${filename}: use a lowercase filename with hyphens`);
  for (const field of ['title', 'summary', 'date', 'body']) {
    if (typeof post[field] !== 'string' || !post[field].trim()) throw new Error(`${filename}: ${field} is required`);
  }
  if (!topics[post.topic]) throw new Error(`${filename}: topic must be ios or swift`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date) || Number.isNaN(Date.parse(post.date)) || new Date(post.date).toISOString().slice(0, 10) !== post.date) {
    throw new Error(`${filename}: use a valid YYYY-MM-DD date`);
  }
  post.code_theme ||= 'night';
  if (!themes.includes(post.code_theme)) throw new Error(`${filename}: unknown code theme`);
  post.slug = filename.slice(0, -3);
  if (['index', '_template', 'sample-ios-post'].includes(post.slug)) throw new Error(`${filename}: reserved filename`);
  return post;
}

export function renderPost(post, template) {
  const headings = [];
  const ids = new Set();
  const markdown = new Marked({ renderer: {
    heading({ tokens, depth }) {
      const title = this.parser.parseInline(tokens);
      const base = slug(title.replace(/<[^>]*>/g, ''));
      let id = base;
      for (let count = 2; ids.has(id); count++) id = `${base}-${count}`;
      ids.add(id);
      if (depth <= 2) headings.push(`<li><a href="#${id}">${title}</a></li>`);
      const level = Math.max(2, depth);
      return `<h${level} id="${id}">${title}</h${level}>\n`;
    },
    code({ text, lang }) {
      const language = lang?.split(/\s+/)[0] || 'text';
      return `<pre class="sps-code" data-theme="${post.code_theme}"><code class="language-${escape(language)}">${escape(text)}</code></pre>\n`;
    }
  }});
  const body = markdown.parse(post.body);
  const values = {
    TITLE: escape(post.title), SUMMARY: escape(post.summary), TOPIC: topics[post.topic],
    TOPIC_ID: post.topic, DATE: escape(post.date),
    READ_TIME: Math.max(1, Math.ceil(post.body.split(/\s+/).length / 200)),
    BODY: body,
    TOC: headings.length ? `<aside class="sps-side sps-toc"><div class="sps-card"><div class="sps-label">IN THIS SLEEPER</div><ol>${headings.join('')}</ol></div></aside>` : '',
    COLUMNS: headings.length ? '' : 'style="grid-template-columns:minmax(0,760px)"'
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => values[key]);
}

export async function build(root = process.cwd()) {
  const output = path.join(root, '_site');
  const posts = [];
  for (const filename of await readdir(path.join(root, 'content/posts'))) {
    if (!filename.endsWith('.md')) continue;
    const post = readPost(await readFile(path.join(root, 'content/posts', filename), 'utf8'), filename);
    if (post) posts.push(post);
  }
  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  const template = await readFile(path.join(root, 'templates/post.html'), 'utf8');
  // Copy only public files. Drafts, editor configuration, and local samples stay out.
  await rm(output, { recursive: true, force: true });
  await mkdir(path.join(output, 'guides'), { recursive: true });
  for (const filename of ['index.html', 'about.html', '404.html', 'CNAME', '.nojekyll', 'assets']) {
    await cp(path.join(root, filename), path.join(output, filename), { recursive: true });
  }
  let index = await readFile(path.join(root, 'guides/index.html'), 'utf8');
  for (const [topic, label] of Object.entries(topics)) {
    const cards = posts.filter(post => post.topic === topic).map(post => `<a class="sps-card" href="${post.slug}.html">
      <div class="sps-label">${label} · ${escape(post.date)}</div>
      <h3 class="sps-display" style="font-size:36px">${escape(post.title)} <span class="sps-orange">→</span></h3>
      <p style="margin:0">${escape(post.summary)}</p>
    </a>`).join('\n');
    if (cards) index = index.replace(new RegExp(`<!-- posts:${topic} -->[\\s\\S]*?<!-- /posts:${topic} -->`), `<div class="sps-post-list">${cards}</div>`);
  }
  await writeFile(path.join(output, 'guides/index.html'), index);
  for (const post of posts) await writeFile(path.join(output, 'guides', `${post.slug}.html`), renderPost(post, template));
  if (posts.length) {
    let homepage = await readFile(path.join(output, 'index.html'), 'utf8');
    homepage = homepage.replace('COMING SOON', 'LATEST SLEEPER').replace('New sleepers are on the way.',
      `<a href="guides/${posts[0].slug}.html">${escape(posts[0].title)} →</a>`);
    await writeFile(path.join(output, 'index.html'), homepage);
  }
  console.log(`Built ${posts.length} published post(s). Drafts excluded.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
