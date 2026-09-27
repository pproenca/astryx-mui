// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native package, package-owned comparisons, and current Git revision. @output Standalone native gallery in dist/gallery. @position Product documentation build; no migration-harness dependency. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const repo = path.resolve(packageRoot, '../..');
const dist = path.join(packageRoot, 'dist');
const gallery = path.join(dist, 'gallery');
const required = ['index.js', 'tokens.css'];
for (const name of required) await fs.access(path.join(dist, name));

await fs.rm(gallery, {recursive: true, force: true});
await fs.mkdir(path.join(gallery, 'dist'), {recursive: true});
await fs.mkdir(path.join(gallery, 'fixtures'), {recursive: true});
await fs.copyFile(
  path.join(packageRoot, 'gallery/index.html'),
  path.join(gallery, 'index.html'),
);
await fs.copyFile(
  path.join(packageRoot, 'fixtures/foundation.html'),
  path.join(gallery, 'fixtures/foundation.html'),
);
for (const name of ['icons.html', 'icons.css'])
  await fs.copyFile(
    path.join(packageRoot, 'fixtures', name),
    path.join(gallery, 'fixtures', name),
  );
await build({
  entryPoints: [path.join(packageRoot, 'fixtures/icons.tsx')],
  outfile: path.join(gallery, 'fixtures/icons.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['chrome123', 'firefox120', 'safari17.5'],
});
await fs.cp(
  path.join(packageRoot, 'fixtures/fonts'),
  path.join(gallery, 'fixtures/fonts'),
  {recursive: true},
);
const fontCache = process.env.M3_ICON_FONT_CACHE;
const fontNames = ['Outlined', 'Rounded', 'Sharp'];
const fontPins = {
  Outlined: 'c5c96fcb27145d17a04cb2fa68d33921ca4258c6bb2cf6fac8b1bce401595e57',
  Rounded: '0865c62d7fda358cd4cdb77792b758afa66fae2c4159fa3fb04a2c1d05700e9e',
  Sharp: '2349783253d47d2d1b92ab63dd4284988f05e73459aa9c8f6e9a78ed360101c9',
};
let fontConfig = "document.documentElement.dataset.fontAvailable = 'false';\n";
if (fontCache) {
  await fs.mkdir(path.join(gallery, 'fixtures/fonts'), {recursive: true});
  for (const name of fontNames) {
    const bytes = await fs.readFile(
      path.join(fontCache, `MaterialSymbols${name}.woff2`),
    );
    if (createHash('sha256').update(bytes).digest('hex') !== fontPins[name])
      throw new Error(`Pinned Material Symbols ${name} font differs`);
    await fs.writeFile(
      path.join(gallery, 'fixtures/fonts', `MaterialSymbols${name}.woff2`),
      bytes,
    );
  }
  fontConfig =
    `document.documentElement.dataset.fontAvailable = 'true';\n` +
    fontNames
      .map(name => {
        const family = `Material Symbols ${name}`;
        const url = `./fonts/MaterialSymbols${name}.woff2`;
        return `document.fonts.add(new FontFace('${family}', 'url(${url})', {weight:'100 700'}));`;
      })
      .join('\n') +
    '\n';
}
await fs.writeFile(path.join(gallery, 'fixtures/font-config.js'), fontConfig);
await fs.cp(
  path.join(packageRoot, 'gallery/evidence'),
  path.join(gallery, 'evidence'),
  {recursive: true},
);
for (const entry of await fs.readdir(dist, {withFileTypes: true})) {
  if (
    entry.name === 'gallery' ||
    !entry.isFile() ||
    !/\.(?:js|json|css)$/.test(entry.name)
  )
    continue;
  await fs.copyFile(
    path.join(dist, entry.name),
    path.join(gallery, 'dist', entry.name),
  );
}
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repo,
  encoding: 'utf8',
}).trim();
const dirty = Boolean(
  execFileSync('git', ['status', '--porcelain'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim(),
);
await fs.writeFile(
  path.join(gallery, 'revision.json'),
  `${JSON.stringify({revision, dirty})}\n`,
);
console.log(
  `Built native foundation gallery at ${revision}${dirty ? ' (working tree changed)' : ''}`,
);
