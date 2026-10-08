import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { parse } from 'yaml';

const topics = { ios: 'iOS', swift: 'Swift' };
const themes = ['night', 'paper', 'moonlight', 'xcode', 'dawn', 'terminal', 'ink', 'lights-out'];
const series = {
  'midnight-snacks': { first: 'Midnight', last: 'Snacks', description: 'Small bites of code. Copy, paste, ship.', action: 'Read the snack' },
  'night-shift': { first: 'Night', last: 'Shift', description: 'Hands-on how-tos for your devices.', action: 'Read the how-to' },
  'night-terrors': { first: 'Night', last: 'Terrors', description: "Bugs I've found, how to trigger them, and the workaround.", action: 'Read the fix' }
};
const readingTime = post => post.read_time || Math.max(1, Math.ceil(post.body.split(/\s+/).length / 200));
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

export function readPost(source, filename) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: missing post metadata`);
  const post = { ...parse(match[1]), body: match[2] };
  // Incomplete drafts stay out of the site.
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
  post.series ||= 'midnight-snacks';
  if (!series[post.series]) throw new Error(`${filename}: unknown series`);
  if (post.read_time !== undefined && (!Number.isInteger(post.read_time) || post.read_time < 1)) throw new Error(`${filename}: reading time must be a positive number`);
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
      const [language = 'text', ...filename] = lang?.split(/\s+/) || [];
      return `<div class="sps-codeblock" data-theme="${post.code_theme}"><div class="sps-codehead"><span>${escape(language.toUpperCase())}${filename.length ? ` · ${escape(filename.join(' '))}` : ''}</span><button class="sps-copy" type="button" aria-label="Copy ${escape(language)} code">Copy</button></div><pre class="sps-code" data-theme="${post.code_theme}"><code class="language-${escape(language)}">${escape(text)}</code></pre></div>\n`;
    }
  }});
  const body = markdown.parse(post.body);
  const values = {
    TITLE: escape(post.title), TITLE_DISPLAY: escape(post.title).replace(/([^ ]+)$/, '<span class="sps-orange">$1</span>'), SUMMARY: escape(post.summary), TOPIC: topics[post.topic],
    SERIES_ID: post.series, DATE: escape(post.date),
    READ_TIME: readingTime(post),
    BODY: body,
    TOC: headings.length ? `<aside class="sps-side sps-toc"><div class="sps-card"><div class="sps-label">IN THIS SLEEPER</div><ol>${headings.join('')}</ol></div></aside>` : '',
    COLUMNS: headings.length ? '' : 'style="grid-template-columns:minmax(0,760px)"'
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => values[key]);
}

export function renderSleepers(posts, template) {
  const featured = posts.find(post => post.featured) || posts[0];
  let feature = '';
  if (featured) {
    const group = series[featured.series];
    const title = featured.title.split(' ');
    const accent = title.pop();
    const preview = featured.preview_code || new Marked().lexer(featured.body).find(token => token.type === 'code')?.text;
    const date = new Date(`${featured.date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    feature = `<section class="sps-sleeper-feature${preview ? '' : ' sps-sleeper-feature--text'}" aria-labelledby="featured-title">
      <div class="sps-sleeper-feature-copy">
        <div class="sps-feature-tags"><span class="sps-tag">FEATURED</span><span class="sps-feature-category">${group.first} ${group.last} · ${escape(featured.category || topics[featured.topic])}</span></div>
        <h2 class="sps-display" id="featured-title">${escape(title.join(' '))} <span class="sps-orange">${escape(accent)}</span></h2>
        <p>${escape(featured.summary)}</p>
        <div class="sps-feature-actions"><a class="sps-pill sps-pill--orange" href="${featured.slug}.html">${group.action} →</a><span>${readingTime(featured)} MIN READ · ${escape(date)}</span></div>
      </div>
      ${preview ? `<div class="sps-feature-code"><div class="sps-feature-code-bar"><span>SWIFT · ${escape(featured.code_filename || 'SNIPPET.SWIFT')}</span><span class="sps-code-dots" aria-hidden="true"><i></i><i></i><i></i></span></div><pre class="sps-code" data-theme="night"><code class="language-swift">${escape(preview.split('\n').slice(0, 12).join('\n'))}</code></pre></div>` : ''}
    </section>`;
  }
  const sections = Object.entries(series).map(([key, group]) => {
    const entries = posts.filter(post => post.series === key);
    if (!entries.length) return '';
    const categories = [...new Set(entries.map(post => post.category || topics[post.topic]))];
    let number = 0;
    const rows = categories.map(category => {
      const matches = entries.filter(post => (post.category || topics[post.topic]) === category);
      return `<div class="sps-sleeper-category">${escape(category)} · ${matches.length}</div><ol class="sps-sleeper-rows">${matches.map(post => {
        const title = `<a href="${post.slug}.html">${escape(post.title)}</a>`;
        return `<li><span class="sps-sleeper-number">${String(++number).padStart(2, '0')}</span>${title}<span class="sps-sleeper-time">${readingTime(post)} MIN</span></li>`;
      }).join('')}</ol>`;
    }).join('');
    return `<section class="sps-sleeper-series" id="${key}"><div class="sps-sleeper-series-heading"><div><h2 class="sps-display">${group.first} <span class="sps-orange">${group.last}</span></h2><p>${group.description}</p></div><span class="sps-sleeper-count">${entries.length} ${entries.length === 1 ? 'POST' : 'POSTS'}</span></div>${rows}</section>`;
  }).join('');
  return template.replace('<!-- sleepers:feature -->', feature).replace('<!-- sleepers:series -->', sections);
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
  const index = await readFile(path.join(root, 'guides/index.html'), 'utf8');
  await writeFile(path.join(output, 'guides/index.html'), renderSleepers(posts, index));
  for (const post of posts) await writeFile(path.join(output, 'guides', `${post.slug}.html`), renderPost(post, template));
  if (posts.length) {
    let homepage = await readFile(path.join(output, 'index.html'), 'utf8');
    homepage = homepage.replace('COMING SOON', 'LATEST SLEEPER').replace('New sleepers are on the way.',
      `<a href="guides/${posts[0].slug}.html">${escape(posts[0].title)} →</a>`);
    await writeFile(path.join(output, 'index.html'), homepage);
  }
  console.log(`Built ${posts.length} post(s). Drafts excluded.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await build();
