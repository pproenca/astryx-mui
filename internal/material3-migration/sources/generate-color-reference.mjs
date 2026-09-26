// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose color/palette tokens and the kit's Shadow gap value. @output Deterministic 49-role source swatches and a role-order manifest. @position Disposable foundation reference fixture generator. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {dependency} from '../runtime.mjs';
import {hash} from '../workbook.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = async file => JSON.parse(await fs.readFile(path.join(here, file)));
const compose = await read('compose-inventory.json');
const figma = await read('figma-kit-inventory.json');
const policy = await read('../policy.json');
if (
  compose.commit !== policy.androidxCommit ||
  figma.source.localExportSha256 !== policy.figmaSha256
)
  throw new Error('Color reference source pins differ from policy');

const values = name => {
  const file = compose.tokens.find(item => item.name === name);
  if (!file) throw new Error(`Missing pinned Compose token file: ${name}`);
  return file.values;
};
const palette = new Map(
  values('PaletteTokens').map(({name, expression}) => {
    const match = expression.match(
      /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
    );
    if (!match) throw new Error(`Unresolved palette expression: ${name}`);
    return [name, match.slice(1).map(Number)];
  }),
);
const kitShadow = figma.variables.find(
  item => item.collection === 'M3' && item.name === 'Schemes/Shadow',
);
if (!kitShadow || kitShadow.light !== '#000000' || kitShadow.dark !== '#000000')
  throw new Error('The kit Shadow gap changed');
const roleName = name =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const roles = [
  ...values('ColorLightTokens').map(({name}) => roleName(name)),
  'shadow',
].sort();
if (roles.length !== 49 || new Set(roles).size !== 49)
  throw new Error('Expected 48 Compose roles and one kit Shadow role');

function scheme(mode) {
  const expressions = new Map(
    values(`Color${mode}Tokens`).map(({name, expression}) => [name, expression]),
  );
  function resolve(name) {
    const expression = expressions.get(name);
    if (!expression) throw new Error(`Missing ${mode} role: ${name}`);
    return expression.startsWith('PaletteTokens.')
      ? palette.get(expression.slice('PaletteTokens.'.length))
      : resolve(expression);
  }
  const resolved = new Map(
    [...expressions.keys()].map(name => [roleName(name), resolve(name)]),
  );
  resolved.set('shadow', [0, 0, 0]);
  if (roles.some(role => !resolved.has(role)))
    throw new Error(`The ${mode} role membership differs from Light`);
  return resolved;
}

const module = await dependency('pngjs');
const PNG = module.PNG || module.default.PNG;
const tilePx = 32;
const columns = 7;
const width = columns * tilePx;
const height = Math.ceil(roles.length / columns) * tilePx;
const out = path.join(here, 'color-reference');
const files = {};
for (const mode of ['Light', 'Dark']) {
  const resolved = scheme(mode);
  const png = new PNG({width, height});
  for (const [index, role] of roles.entries()) {
    const [red, green, blue] = resolved.get(role);
    const left = (index % columns) * tilePx;
    const top = Math.floor(index / columns) * tilePx;
    for (let y = top; y < top + tilePx; y++)
      for (let x = left; x < left + tilePx; x++) {
        const offset = (y * width + x) * 4;
        png.data[offset] = red;
        png.data[offset + 1] = green;
        png.data[offset + 2] = blue;
        png.data[offset + 3] = 255;
      }
  }
  const file = `color-${mode.toLowerCase()}.png`;
  const bytes = PNG.sync.write(png);
  files[mode.toLowerCase()] = {
    file,
    sha256: hash(bytes),
  };
  if (process.argv.includes('--check')) {
    if (hash(await fs.readFile(path.join(out, file))) !== hash(bytes))
      throw new Error(`Source reference changed: ${file}`);
  } else {
    await fs.mkdir(out, {recursive: true});
    await fs.writeFile(path.join(out, file), bytes);
  }
}
const manifest = {
  schemaVersion: 1,
  composeCommit: compose.commit,
  figmaSha256: figma.source.localExportSha256,
  shadowNode: kitShadow.node_id,
  tilePx,
  columns,
  width,
  height,
  roles,
  files,
};
const manifestFile = path.join(out, 'manifest.json');
const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if ((await fs.readFile(manifestFile, 'utf8')) !== manifestBytes)
    throw new Error('Color reference manifest changed');
} else await fs.writeFile(manifestFile, manifestBytes);
console.log(JSON.stringify({roles: roles.length, width, height, files}));
