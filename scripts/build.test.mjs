import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, cp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build, readPost, renderPost } from './build.mjs';

const source = `---
title: A greeting & a nap
summary: A tiny Swift example.
topic: ios
status: published
date: 2026-10-08
code_theme: dawn
---
## Try it

![A sleepy developer](/assets/img/posts/sleeper.png)

\`\`\`swift
let message = "Hey, Sleeper!"
if 1 < 2 { print(message) }
\`\`\`

## Try it
`;

test('Markdown produces styled Swift, images, escaped metadata, and unique anchors', async () => {
  const template = await readFile('templates/post.html', 'utf8');
  const output = renderPost(readPost(source, 'greeting.md'), template);
  assert.match(output, /A greeting &amp; a nap/);
  assert.match(output, /class="sps-code" data-theme="dawn"/);
  assert.match(output, /class="language-swift"/);
  assert.match(output, /1 &lt; 2/);
  assert.match(output, /src="\/assets\/img\/posts\/sleeper.png"/);
  assert.match(output, /id="try-it"/);
  assert.match(output, /id="try-it-2"/);
  assert.match(output, /href="#try-it-2"/);
  assert.doesNotMatch(output, /\{\{[A-Z_]+\}\}/);
});

test('only valid, explicitly published posts are accepted', () => {
  assert.equal(readPost('---\nstatus: draft\n---\n', 'draft.md'), null);
  assert.equal(readPost(source.replace('status: published', 'status: draft'), 'greeting.md'), null);
  assert.throws(() => readPost(source.replace('2026-10-08', '2026-02-30'), 'greeting.md'), /valid.*date/);
  assert.throws(() => readPost(source.replace('topic: ios', 'topic: unknown'), 'greeting.md'), /topic/);
  assert.throws(() => readPost(source, 'sample-ios-post.md'), /reserved/);
});

test('build publishes the right topic and homepage, excluding drafts and sample pages', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'sprslepr-build-'));
  try {
    for (const filename of ['index.html', 'about.html', '404.html', 'CNAME', '.nojekyll', 'templates', 'guides/index.html']) {
      await mkdir(path.dirname(path.join(root, filename)), { recursive: true });
      await cp(filename, path.join(root, filename), { recursive: true });
    }
    await mkdir(path.join(root, 'assets'));
    await mkdir(path.join(root, 'content/posts'), { recursive: true });
    await writeFile(path.join(root, 'content/posts/greeting.md'), source);
    await writeFile(path.join(root, 'content/posts/draft.md'), source.replace('status: published', 'status: draft'));
    await writeFile(path.join(root, 'guides/sample-ios-post.html'), 'LOCAL SAMPLE');
    await build(root);
    assert.deepEqual((await readdir(path.join(root, '_site/guides'))).sort(), ['greeting.html', 'index.html']);
    const listing = await readFile(path.join(root, '_site/guides/index.html'), 'utf8');
    assert.match(listing, /href="greeting.html"/);
    assert.doesNotMatch(listing, /No iOS sleepers yet/);
    assert.match(listing, /No Swift sleepers yet/);
    const home = await readFile(path.join(root, '_site/index.html'), 'utf8');
    assert.match(home, /LATEST SLEEPER/);
    assert.match(home, /guides\/greeting.html/);
    assert.ok(!(await readdir(path.join(root, '_site'))).includes('content'));
    await rm(path.join(root, 'content/posts/greeting.md'));
    await build(root);
    assert.deepEqual(await readdir(path.join(root, '_site/guides')), ['index.html']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
