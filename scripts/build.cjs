#!/usr/bin/env node
// Reproducible build. Concatenates the sources in load order, without
// minifying or rewriting them, and writes dist/ plus a sha256 manifest.
// `node scripts/build.cjs --check` rebuilds in memory and fails if dist/
// differs from the committed files.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const GOLDEN_ENGINE_SHA256 = '3d478cc836969c216812c7e479724e0e204bbb76a26df24c2414568883021230';
const ENGINE = 'src/approved-fluid-v3.1.js';
const LOAD_ORDER = [ENGINE, 'src/approved-engine-adapter.js', 'src/liquid-cursor.js'];
const CSS = 'src/liquid-cursor.css';
const COPIES = { 'LICENSE': 'dist/LICENSE', 'THIRD_PARTY_NOTICES': 'dist/THIRD_PARTY_NOTICES', 'src/PAVEL-LICENSE.txt': 'dist/PAVEL-LICENSE.txt' };
const PAYLOAD_DIRS = ['src', 'demo', 'examples', 'docs/media'];

const read = rel => fs.readFileSync(path.join(ROOT, rel));
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

function build() {
  const pkg = JSON.parse(read('package.json'));
  const engine = read(ENGINE);
  if (sha256(engine) !== GOLDEN_ENGINE_SHA256) {
    throw new Error(ENGINE + ' sha256 ' + sha256(engine) + ' does not match the golden engine ' + GOLDEN_ENGINE_SHA256);
  }
  const banner = Buffer.from([
    '/*! Cursor líquido ' + pkg.version + ' | MIT (c) 2026 Jorge Suárez | see LICENSE and THIRD_PARTY_NOTICES',
    ' * Fluid display normal/shading adapted from WebGL Fluid Simulation, (c) 2017 Pavel Dobryakov, MIT.',
    ' * Bundle of, in load order, unmodified: ' + LOAD_ORDER.join(', ') + '.',
    ' * golden_engine_sha256 ' + GOLDEN_ENGINE_SHA256,
    ' */',
    ''
  ].join('\n'));
  const out = new Map();
  out.set('dist/cursor-liquido.js', Buffer.concat([banner, ...LOAD_ORDER.map(read)]));
  out.set('dist/cursor-liquido.css', read(CSS));
  for (const [from, to] of Object.entries(COPIES)) out.set(to, read(from));

  const files = {};
  const list = rel => {
    const abs = path.join(ROOT, rel);
    if (fs.statSync(abs).isDirectory()) return fs.readdirSync(abs).sort().flatMap(n => list(rel + '/' + n));
    return [rel];
  };
  const payload = ['LICENSE', 'THIRD_PARTY_NOTICES', ...PAYLOAD_DIRS.flatMap(list)];
  for (const rel of [...out.keys(), ...payload].sort()) {
    const buf = out.get(rel) || read(rel);
    files[rel] = { sha256: sha256(buf), bytes: buf.length };
  }
  const manifest = {
    name: pkg.name,
    version: pkg.version,
    license: pkg.license,
    golden_engine_sha256: GOLDEN_ENGINE_SHA256,
    engine: ENGINE,
    load_order: LOAD_ORDER,
    files
  };
  out.set('dist/manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
  return out;
}

function main() {
  const out = build();
  if (process.argv.includes('--check')) {
    const stale = [...out].filter(([rel, buf]) => {
      const abs = path.join(ROOT, rel);
      return !fs.existsSync(abs) || !fs.readFileSync(abs).equals(buf);
    }).map(([rel]) => rel);
    if (stale.length) {
      console.error('dist/ is stale, run npm run build: ' + stale.join(', '));
      process.exit(1);
    }
    console.log('dist/ matches a fresh build (' + out.size + ' files)');
    return;
  }
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  for (const [rel, buf] of out) fs.writeFileSync(path.join(ROOT, rel), buf);
  console.log('built ' + [...out.keys()].join(', '));
}

module.exports = { build, GOLDEN_ENGINE_SHA256, LOAD_ORDER, ENGINE };
if (require.main === module) main();
