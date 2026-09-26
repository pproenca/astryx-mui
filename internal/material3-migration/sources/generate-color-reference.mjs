// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose color/palette tokens, Expressive light overrides and the kit's Shadow gap value. @output Deterministic 49-role source swatches and a role-order manifest. @position Disposable foundation reference fixture generator. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {dependency} from '../runtime.mjs';
import {hash} from '../workbook.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = async file => JSON.parse(await fs.readFile(path.join(here, file)));
const compose = await read('compose-inventory.json');
const figma = await read('figma-kit-inventory.json');
const expressive = await read('compose-expressive-color.json');
const policy = await read('../policy.json');
if (
  compose.commit !== policy.androidxCommit ||
  expressive.commit !== policy.androidxCommit ||
  figma.source.localExportSha256 !== policy.figmaSha256
)
  throw new Error('Color reference source pins differ from policy');
const expressiveSource = compose.families.find(
  item => item.path === expressive.source,
);
if (expressiveSource?.sha256 !== expressive.sourceSha256)
  throw new Error(
    'Expressive color source differs from pinned Compose inventory',
  );

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
const kitModes = figma.collections
  .find(item => item.name === 'M3')
  .modes.split(', ');
if (kitModes.length !== 32) throw new Error('The kit color modes changed');
const kitRoles = new Map(
  figma.variables
    .filter(
      item => item.collection === 'M3' && item.name.startsWith('Schemes/'),
    )
    .map(item => [
      item.name.slice('Schemes/'.length).toLowerCase().replace(/\s+/g, '-'),
      new Map(
        item.all_values.split('; ').map(entry => {
          const separator = entry.indexOf(': ');
          return [entry.slice(0, separator), entry.slice(separator + 2)];
        }),
      ),
    ]),
);
if (
  kitRoles.size !== 49 ||
  [...kitRoles.values()].some(values => values.size !== 32)
)
  throw new Error('The kit role and mode membership changed');
const roles = [
  ...values('ColorLightTokens').map(({name}) => roleName(name)),
  'shadow',
].sort();
if (roles.length !== 49 || new Set(roles).size !== 49)
  throw new Error('Expected 48 Compose roles and one kit Shadow role');

function scheme(mode) {
  const expressions = new Map(
    values(`Color${mode}Tokens`).map(({name, expression}) => [
      name,
      expression,
    ]),
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
const variants = [
  ['light', scheme('Light')],
  ['dark', scheme('Dark')],
];
const expressiveLight = scheme('Light');
for (const [name, expression] of Object.entries(expressive.overrides)) {
  if (
    !expression.startsWith('PaletteTokens.') ||
    !expressiveLight.has(roleName(name))
  )
    throw new Error(`Unresolved Expressive light role: ${name}`);
  const value = palette.get(expression.slice('PaletteTokens.'.length));
  if (!value) throw new Error(`Unresolved Expressive palette: ${expression}`);
  expressiveLight.set(roleName(name), value);
}
variants.push(['expressiveLight', expressiveLight]);
for (const mode of kitModes) {
  const resolved = new Map(
    roles.map(role => {
      const value = kitRoles.get(role)?.get(mode);
      if (!/^#[0-9a-f]{6}$/i.test(value || ''))
        throw new Error(`Missing kit value for ${mode}: ${role}`);
      return [
        role,
        [1, 3, 5].map(offset => parseInt(value.slice(offset, offset + 2), 16)),
      ];
    }),
  );
  variants.push([
    `kit-${mode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    resolved,
  ]);
}
for (const [variant, resolved] of variants) {
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
  const file = `color-${variant.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}.png`;
  const bytes = PNG.sync.write(png);
  files[variant] = {
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
  schemaVersion: 3,
  composeCommit: compose.commit,
  expressiveSource: expressive.source,
  expressiveSourceSha256: expressive.sourceSha256,
  figmaSha256: figma.source.localExportSha256,
  shadowNode: kitShadow.node_id,
  kitModes,
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
