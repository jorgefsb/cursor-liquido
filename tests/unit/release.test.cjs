'use strict';
// Portable release checks. No browser, no network, no absolute paths.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { build, GOLDEN_ENGINE_SHA256, LOAD_ORDER, ENGINE } = require('../../scripts/build.cjs');

const ROOT = path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(ROOT, rel));
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

// Hashes of the user-approved artifacts. Only version metadata may differ.
const APPROVED = {
  html: 'cccb53b6c3bfe93cb0d39e6542de181e8165ae1a886071cb01a29f9f48f3f914',
  adapter: '570bb84eea0856393c106d28a8cc01a18a269ffae31c453d30d88be72372ab2c',
  wrapper: 'e4752f306a54c382f996a21cc7469b6dda570a408583b2d16e1d7f5b3e8c33d0',
  css: '2ab1b38486d80397480ac29827939eee800e275206419c65e8d0ef8d97ad48a1'
};
const approvedWrapper = () => read('src/liquid-cursor.js').toString()
  .replace('/* Cursor líquido 1.0.0. MIT', '/* Cursor líquido 0.1.0. MIT')
  .replace("version: '1.0.0',", "version: '0.1.1-recovery',");

test('golden engine is byte-identical', () => {
  assert.equal(GOLDEN_ENGINE_SHA256, '3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230');
  assert.equal(sha256(read(ENGINE)), GOLDEN_ENGINE_SHA256);
});

test('engine keeps the Pavel Dobryakov MIT attribution and licence file', () => {
  assert.match(read(ENGINE).toString(), /adapted from Pavel Dobryakov \(2017\), MIT/);
  assert.match(read('src/PAVEL-LICENSE.txt').toString(), /Copyright \(c\) 2017 Pavel Dobryakov/);
  assert.match(read('THIRD_PARTY_NOTICES').toString(), /Copyright \(c\) 2017 Pavel Dobryakov/);
});

test('adapter is byte-identical, wrapper and CSS differ only in version metadata', () => {
  assert.equal(sha256(read('src/approved-engine-adapter.js')), APPROVED.adapter);
  assert.equal(sha256(Buffer.from(approvedWrapper())), APPROVED.wrapper);
  const css = read('src/liquid-cursor.css').toString().replace('/* Cursor líquido 1.0.0.', '/* Cursor líquido 0.1.0.');
  assert.equal(sha256(Buffer.from(css)), APPROVED.css);
});

test('approved offline HTML is archived verbatim and contains the same sources', () => {
  const html = read('examples/cursor-liquido.html');
  assert.equal(sha256(html), APPROVED.html);
  const text = html.toString();
  assert(text.includes(read(ENGINE).toString()));
  assert(text.includes(read('src/approved-engine-adapter.js').toString()));
  assert(text.includes(approvedWrapper()));
});

test('src contains only the release sources (retired JS never shipped)', () => {
  assert.deepEqual(fs.readdirSync(path.join(ROOT, 'src')).sort(),
    ['PAVEL-LICENSE.txt', 'approved-engine-adapter.js', 'approved-fluid-v3.1.js', 'liquid-cursor.css', 'liquid-cursor.js']);
});

test('sources and bundle parse as scripts', () => {
  for (const rel of [...LOAD_ORDER, 'dist/cursor-liquido.js', 'scripts/build.cjs']) {
    assert.doesNotThrow(() => new vm.Script(read(rel).toString(), { filename: rel }), rel);
  }
});

test('build is deterministic and dist/ matches a fresh build', () => {
  const a = build(), b = build();
  assert.deepEqual([...a.keys()], [...b.keys()]);
  for (const [rel, buf] of a) {
    assert(buf.equals(b.get(rel)), rel + ' differs between two builds');
    assert(buf.equals(read(rel)), rel + ' is stale, run npm run build');
  }
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.cjs'), '--check'], { stdio: 'pipe' });
});

test('bundle is banner + sources concatenated unmodified in load order', () => {
  const dist = read('dist/cursor-liquido.js');
  const body = Buffer.concat(LOAD_ORDER.map(read));
  assert(dist.subarray(dist.length - body.length).equals(body));
  assert.match(dist.subarray(0, dist.length - body.length).toString(), /^\/\*! Cursor líquido 1\.0\.0 \| MIT/);
  assert.equal(sha256(read('dist/cursor-liquido.css')), sha256(read('src/liquid-cursor.css')));
});

test('manifest lists sha256 of every release file plus the golden engine literal', () => {
  const m = JSON.parse(read('dist/manifest.json'));
  const pkg = JSON.parse(read('package.json'));
  assert.equal(m.version, pkg.version);
  assert.equal(m.golden_engine_sha256, GOLDEN_ENGINE_SHA256);
  assert.deepEqual(m.load_order, LOAD_ORDER);
  for (const rel of ['dist/cursor-liquido.js', 'dist/cursor-liquido.css', 'dist/LICENSE', 'dist/THIRD_PARTY_NOTICES',
    'examples/cursor-liquido.html', 'demo/index.html', ENGINE, 'docs/media/cursor-liquido-restaurado-real.mp4']) {
    assert(m.files[rel], rel + ' missing from manifest');
  }
  for (const [rel, info] of Object.entries(m.files)) {
    const buf = read(rel);
    assert.equal(info.sha256, sha256(buf), rel);
    assert.equal(info.bytes, buf.length, rel);
  }
  assert.equal(m.files[ENGINE].sha256, GOLDEN_ENGINE_SHA256);
});

test('package has no runtime dependencies and pins its dev tools', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies, undefined);
  for (const v of Object.values(pkg.devDependencies)) assert.match(v, /^\d+\.\d+\.\d+$/);
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.packages['node_modules/playwright'].version, pkg.devDependencies.playwright);
});

test('stable release has exactly four intensities (Legendario is only a proposal)', () => {
  const src = read('src/liquid-cursor.js').toString();
  const block = src.slice(src.indexOf('const INTENSITIES'), src.indexOf('const JZ_LEVELS'));
  assert.deepEqual([...block.matchAll(/^\s+(\w+): Object\.freeze/gm)].map(m => m[1]), ['nada', 'poquito', 'mucho', 'hardcore']);
  assert(!/legendario/i.test(src));
});

test('public files carry no private paths, hosts, emails or credentials', () => {
  // Patterns are assembled so this file does not match itself.
  const bad = [
    ['/' + 'home/', 'absolute home path'], ['/' + 'Users/', 'absolute home path'], ['mo' + 'lt', 'host user'],
    ['srv' + '-', 'internal host'], ['tail' + 'scale', 'internal network'], ['.ts' + '.net', 'internal network'],
    ['gbr' + 'ain', 'private brain'], ['Mo' + 'ona', 'fleet note'], ['brandkit' + '.jorge', 'private link'],
    ['_n' + 'px/', 'local cache path'], ['upload' + '_2026', 'private screenshot']
  ];
  const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/;
  const secret = /(api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{8,}/i;
  const skip = new Set(['node_modules', '.git', 'test-output']);
  const walk = rel => fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true }).flatMap(d =>
    skip.has(d.name) ? [] : d.isDirectory() ? walk(path.join(rel, d.name)) : [path.join(rel, d.name)]);
  const text = walk('.').filter(f => !/\.(png|gif|mp4|webm)$/.test(f) && f !== 'package-lock.json');
  assert(text.length > 20);
  const hits = [];
  for (const f of text) {
    const s = read(f).toString();
    for (const [p, why] of bad) if (s.includes(p)) hits.push(f + ': ' + why);
    if (email.test(s)) hits.push(f + ': email ' + s.match(email)[0]);
    if (secret.test(s)) hits.push(f + ': credential-like value');
  }
  assert.deepEqual(hits, []);
});
