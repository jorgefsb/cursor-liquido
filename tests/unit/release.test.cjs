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
  .replace('/* Cursor líquido 1.0.1. MIT', '/* Cursor líquido 0.1.0. MIT')
  .replace("version: '1.0.1',", "version: '0.1.1-recovery',");

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
  const css = read('src/liquid-cursor.css').toString().replace('/* Cursor líquido 1.0.1.', '/* Cursor líquido 0.1.0.');
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
    ['PAVEL-LICENSE.txt', 'approved-engine-adapter.js', 'approved-fluid-v3.1.js', 'liquid-cursor.css', 'liquid-cursor.js', 'quality-input-guard.js']);
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
  assert.deepEqual(LOAD_ORDER, ['src/approved-fluid-v3.1.js', 'src/approved-engine-adapter.js', 'src/quality-input-guard.js', 'src/liquid-cursor.js']);
  const dist = read('dist/cursor-liquido.js');
  const body = Buffer.concat(LOAD_ORDER.map(read));
  assert(dist.subarray(dist.length - body.length).equals(body));
  assert.match(dist.subarray(0, dist.length - body.length).toString(), /^\/\*! Cursor líquido 1\.0\.1 \| MIT/);
  assert.equal(sha256(read('dist/cursor-liquido.css')), sha256(read('src/liquid-cursor.css')));
});

test('manifest lists sha256 of every release file plus the golden engine literal', () => {
  const m = JSON.parse(read('dist/manifest.json'));
  const pkg = JSON.parse(read('package.json'));
  assert.equal(m.version, pkg.version);
  assert.equal(m.golden_engine_sha256, GOLDEN_ENGINE_SHA256);
  assert.equal(m.golden_adapter_sha256, APPROVED.adapter);
  assert.equal(m.release_status, 'stable');
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

test('autonomous candidate embeds exact bundle and CSS without external assets', () => {
  const html = read('dist/cursor-liquido-standalone.html').toString();
  assert(html.includes(read('dist/cursor-liquido.js').toString()));
  assert(html.includes(read('dist/cursor-liquido.css').toString()));
  assert(html.includes(read('LICENSE').toString()), 'standalone must carry its full MIT notice');
  assert(html.includes(read('src/PAVEL-LICENSE.txt').toString()), 'standalone must carry the full upstream MIT notice');
  assert(!/<script[^>]+src=/.test(html));
  assert(!/<link[^>]+href="(?!data:)/.test(html));
});

test('package has no runtime dependencies and pins its dev tools', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies, undefined);
  for (const v of Object.values(pkg.devDependencies)) assert.match(v, /^\d+\.\d+\.\d+$/);
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(lock.packages['node_modules/playwright'].version, pkg.devDependencies.playwright);
});

test('candidate has exactly four intensities (Legendario is only a proposal)', () => {
  const src = read('src/liquid-cursor.js').toString();
  const block = src.slice(src.indexOf('const INTENSITIES'), src.indexOf('const JZ_LEVELS'));
  assert.deepEqual([...block.matchAll(/^\s+(\w+): Object\.freeze/gm)].map(m => m[1]), ['nada', 'poquito', 'mucho', 'hardcore']);
  assert(!/legendario/i.test(src));
});

// Patterns and fixtures are assembled so this file does not match itself.
const PUBLIC_BRAND_HOST = ['brandkit', 'jorgesuarez', 'com', 'mx'].join('.');
const PRIVATE_LINK = 'brandkit' + '.jorge';
function privacyFindings(s) {
  const bad = [
    ['/' + 'home/', 'absolute home path'], ['/' + 'Users/', 'absolute home path'], ['mo' + 'lt', 'host user'],
    ['srv' + '-', 'internal host'], ['tail' + 'scale', 'internal network'], ['.ts' + '.net', 'internal network'],
    ['gbr' + 'ain', 'private brain'], ['Mo' + 'ona', 'fleet note'],
    ['_n' + 'px/', 'local cache path'], ['upload' + '_2026', 'private screenshot']
  ];
  const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/;
  const secret = /(api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]{8,}/i;
  const hits = bad.filter(([p]) => s.includes(p)).map(([, why]) => why);
  // Exempt only the hostname span in a parsed, exact HTTPS authority.
  // Never remove the URL: its path/query and all neighboring text stay scanned.
  const allowed = [];
  for (const m of s.matchAll(/[a-z][a-z\d+.-]*:\/\/[^\s<>"'`()\[\]{}]+/gi)) {
    try {
      const u = new URL(m[0]);
      const prefix = 'https://' + PUBLIC_BRAND_HOST;
      if (u.protocol === 'https:' && u.hostname === PUBLIC_BRAND_HOST &&
          !u.username && !u.password && !u.port && m[0].startsWith(prefix) &&
          (m[0].length === prefix.length || '/?#'.includes(m[0][prefix.length]))) {
        allowed.push([m.index + 'https://'.length, m.index + prefix.length]);
      }
    } catch { /* Malformed URLs receive no exemption. */ }
  }
  let pos = s.indexOf(PRIVATE_LINK);
  while (pos !== -1) {
    if (!allowed.some(([start, end]) => pos >= start && pos + PRIVATE_LINK.length <= end)) {
      hits.push('private link');
      break;
    }
    pos = s.indexOf(PRIVATE_LINK, pos + PRIVATE_LINK.length);
  }
  if (email.test(s)) hits.push('email ' + s.match(email)[0]);
  if (secret.test(s)) hits.push('credential-like value');
  return hits;
}

test('privacy scanner accepts only the official public HTTPS hostname', () => {
  const url = 'https://' + PUBLIC_BRAND_HOST;
  for (const s of [url, url + '/', '[' + 'brand](' + url + '/guide)',
    '<a href="' + url + '/guide?q=public#assets">brand</a>']) {
    assert.deepEqual(privacyFindings(s), [], s);
  }
});

test('privacy scanner rejects hostname and authority mutations', () => {
  const url = 'https://' + PUBLIC_BRAND_HOST;
  for (const s of [PUBLIC_BRAND_HOST, 'http://' + PUBLIC_BRAND_HOST,
    '//' + PUBLIC_BRAND_HOST, url + '.evil', url + '-evil', url + ':444/',
    url + ':443/', url + './', 'https://user@' + PUBLIC_BRAND_HOST,
    'https://user:pass@' + PUBLIC_BRAND_HOST, url + '@example.org',
    'https://example.org/' + PUBLIC_BRAND_HOST,
    'https://' + PRIVATE_LINK + '.internal', 'https://%' + PUBLIC_BRAND_HOST]) {
    assert(privacyFindings(s).includes('private link'), s);
  }
});

test('public link never hides adjacent or embedded private data', () => {
  const url = 'https://' + PUBLIC_BRAND_HOST;
  const fixtures = [
    ['/' + 'home/person', 'absolute home path'], ['/' + 'Users/person', 'absolute home path'],
    ['mo' + 'lt', 'host user'], ['srv' + '-private', 'internal host'],
    ['tail' + 'scale', 'internal network'], ['node.ts' + '.net', 'internal network'],
    ['gbr' + 'ain', 'private brain'], ['Mo' + 'ona', 'fleet note'],
    [PRIVATE_LINK + '.internal', 'private link'], ['_n' + 'px/cache', 'local cache path'],
    ['upload' + '_2026', 'private screenshot'], ['person' + '@example.org', 'email '],
    ['api_' + 'key="abcdefghijk"', 'credential-like value'],
    ['pass' + 'word="abcdefghijk"', 'credential-like value'],
    ['to' + 'ken="abcdefghijk"', 'credential-like value'],
    ['sec' + 'ret="abcdefghijk"', 'credential-like value']
  ];
  for (const [value, why] of fixtures) {
    for (const s of [url + ' ' + value, value + ' ' + url, url + '/' + value,
      url + '?value=' + value, url + '#' + value]) {
      assert(privacyFindings(s).some(hit => hit.startsWith(why)), why);
    }
  }
  assert(privacyFindings(url + ' ' + url + '.evil').includes('private link'));
});

test('public files carry no private paths, hosts, emails or credentials', () => {
  const skip = new Set(['node_modules', '.git', 'test-output']);
  const walk = rel => fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true }).flatMap(d =>
    skip.has(d.name) ? [] : d.isDirectory() ? walk(path.join(rel, d.name)) : [path.join(rel, d.name)]);
  const text = walk('.').filter(f => !/\.(png|gif|mp4|webm)$/.test(f) && f !== 'package-lock.json');
  assert(text.length > 20);
  const hits = [];
  for (const f of text) {
    const s = read(f).toString();
    hits.push(...privacyFindings(s).map(why => f + ': ' + why));
  }
  assert.deepEqual(hits, []);
});
