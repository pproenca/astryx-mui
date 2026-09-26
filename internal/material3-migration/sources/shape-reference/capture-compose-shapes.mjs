// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned AndroidX MaterialShapes and graphics-shapes source, kit inventory, local Kotlin compiler and Chrome. @output Reproducible 35-shape source contact sheet, ClamShell capture and provenance manifest. @position Disposable foundation geometry reference generator. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = path.dirname(here);
const read = async file => JSON.parse(await fs.readFile(file));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(path.resolve(sources, '../policy.json'));
const compose = await read(path.join(sources, 'compose-inventory.json'));
const figma = await read(path.join(sources, 'figma-kit-inventory.json'));
const androidx = process.env.M3_ANDROIDX;
if (!androidx)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
const revision = execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
if (
  revision !== policy.androidxCommit ||
  compose.commit !== revision ||
  figma.source.localExportSha256 !== policy.figmaSha256 ||
  execFileSync('git', ['-C', androidx, 'status', '--porcelain'], {
    encoding: 'utf8',
  }).trim()
)
  throw new Error('Shape reference source pins or AndroidX checkout differ');

const materialRelative =
  'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MaterialShapes.kt';
const material = path.join(androidx, materialRelative);
const materialSha256 = sha256(await fs.readFile(material));
if (
  compose.families.find(item => item.path === materialRelative)?.sha256 !==
  materialSha256
)
  throw new Error('MaterialShapes.kt differs from pinned Compose inventory');
const graphicsRelative =
  'graphics/graphics-shapes/src/commonMain/kotlin/androidx/graphics/shapes';
const graphicsDirectory = path.join(androidx, graphicsRelative);
const roundedPolygonSha256 = sha256(
  await fs.readFile(path.join(graphicsDirectory, 'RoundedPolygon.kt')),
);
if (
  roundedPolygonSha256 !==
  '15be176fde87c926d259be8eb22aa80209430fa373fabc510fef33185203f48f'
)
  throw new Error('RoundedPolygon.kt differs from pinned graphics-shapes');

const cache =
  process.env.M3_GRADLE_CACHE ||
  path.join(os.homedir(), '.gradle/caches/modules-2/files-2.1');
async function jar(group, name, version) {
  const directory = path.join(cache, group, name, version);
  for (const entry of await fs.readdir(directory)) {
    const file = path.join(directory, entry, `${name}-${version}.jar`);
    try {
      await fs.access(file);
      return file;
    } catch {}
  }
  throw new Error(
    `Missing local Kotlin compiler dependency: ${name}@${version}`,
  );
}
const modules = [
  ['org.jetbrains.kotlin', 'kotlin-compiler-embeddable', '2.4.20'],
  ['org.jetbrains.kotlin', 'kotlin-build-tools-api', '2.4.20'],
  ['org.jetbrains.kotlin', 'kotlin-stdlib', '2.4.20'],
  ['org.jetbrains.kotlin', 'kotlin-script-runtime', '2.4.20'],
  ['org.jetbrains.kotlin', 'kotlin-reflect', '1.6.10'],
  ['org.jetbrains.kotlin', 'kotlin-daemon-embeddable', '2.4.20'],
  ['org.jetbrains.kotlinx', 'kotlinx-coroutines-core-jvm', '1.8.0'],
  ['org.jetbrains', 'annotations', '23.0.0'],
];
const jars = await Promise.all(modules.map(item => jar(...item)));
const graphics = (await fs.readdir(graphicsDirectory))
  .filter(name => name.endsWith('.kt') && name !== 'Format.kt')
  .map(name => path.join(graphicsDirectory, name))
  .sort();
const support = (await fs.readdir(path.join(here, 'probe')))
  .filter(name => name.endsWith('.kt'))
  .map(name => path.join(here, 'probe', name))
  .sort();
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-compose-shapes-'),
);
const output = path.join(temporary, 'classes');
await fs.mkdir(output);
let trace;
try {
  execFileSync(
    'java',
    [
      '--enable-native-access=ALL-UNNAMED',
      '-cp',
      jars.join(path.delimiter),
      'org.jetbrains.kotlin.cli.jvm.K2JVMCompiler',
      '-no-stdlib',
      '-no-reflect',
      '-classpath',
      [jars[2], jars[7]].join(path.delimiter),
      '-d',
      output,
      ...graphics,
      material,
      ...support,
    ],
    {stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 5_000_000},
  );
  trace = execFileSync(
    'java',
    [
      '-cp',
      [output, jars[2]].join(path.delimiter),
      'androidx.compose.material3.ProbeKt',
    ],
    {encoding: 'utf8', maxBuffer: 5_000_000},
  );
} finally {
  await fs.rm(temporary, {recursive: true, force: true});
}

const shapes = trace
  .trim()
  .split('\n')
  .map(line => {
    const separator = line.indexOf('|');
    if (separator < 1) throw new Error('Unrecognized shape probe output');
    const cubics = line
      .slice(separator + 1)
      .split(';')
      .map(cubic => cubic.split(',').map(Number));
    if (
      !cubics.length ||
      cubics.some(
        cubic => cubic.length !== 8 || cubic.some(n => !Number.isFinite(n)),
      )
    )
      throw new Error('Unresolved pinned Compose shape cubic');
    return {compose: line.slice(0, separator), cubics};
  });
if (
  shapes.length !== 35 ||
  new Set(shapes.map(item => item.compose)).size !== 35
)
  throw new Error('Expected 35 distinct pinned Compose shapes');
const kitSet = figma.componentSets.find(item => item.name === 'Shape Set');
if (!kitSet || kitSet.variants !== 35)
  throw new Error('Expected the frozen 35-variant kit Shape Set');
const kitNames = kitSet.values.slice('Shape: '.length).split(', ');
const exceptions = {
  ClamShell: 'Hexagon',
  Cookie4Sided: '4-sided cookie',
  Cookie6Sided: '6-sided cookie',
  Cookie7Sided: '7-sided cookie',
  Cookie9Sided: '9-sided cookie',
  Cookie12Sided: '12-sided cookie',
  Clover4Leaf: '4-leaf clover',
  Clover8Leaf: '8-leaf clover',
};
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const mappings = shapes.map(({compose: name}) => {
  const kit =
    exceptions[name] ||
    kitNames.find(item => normalize(item) === normalize(name));
  if (!kit) throw new Error(`No kit variant for Compose ${name}`);
  return {compose: name, kitVariant: kit};
});
if (
  new Set(mappings.map(item => item.kitVariant)).size !== 35 ||
  kitNames.some(name => !mappings.some(item => item.kitVariant === name))
)
  throw new Error('Compose/kit shape variant membership differs');

const token = name =>
  compose.tokens.find(item => item.name === name)?.values || [];
const primary = token('ColorLightTokens').find(item => item.name === 'Primary');
const palette = token('PaletteTokens').find(
  item => item.name === primary?.expression.slice('PaletteTokens.'.length),
);
const rgb = palette?.expression.match(
  /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
);
const fill = rgb
  ? `#${rgb
      .slice(1)
      .map(n => Number(n).toString(16).padStart(2, '0'))
      .join('')}`
  : null;
if (fill !== '#6750a4') throw new Error('Pinned shape sample fill changed');
const pathData = cubics => {
  const parts = ['M', cubics[0][0], cubics[0][1]];
  for (const cubic of cubics) parts.push('C', ...cubic.slice(2));
  parts.push('Z');
  return parts.join(' ');
};
const size = 170;
const cell = 220;
const tiles = shapes.map((shape, index) => {
  const x = (index % 7) * cell + (cell - size) / 2;
  const y = Math.floor(index / 7) * cell + 15;
  return `<path d="${pathData(shape.cubics)}" transform="translate(${x} ${y}) scale(${size})" fill="${fill.toUpperCase()}"/><text x="${x + size / 2}" y="${y + size + 24}" text-anchor="middle" font-family="Arial" font-size="14" fill="#202124">${shape.compose}</text>`;
});
const attribution =
  '<!-- Derived from pinned MaterialShapes, Copyright 2024 The Android Open Source Project; Apache-2.0, see ../LICENSE.androidx. -->';
const montage = `<svg width="1540" height="1100" viewBox="0 0 1540 1100" xmlns="http://www.w3.org/2000/svg">${attribution}<rect width="1540" height="1100" fill="#fff"/>${tiles.join('')}</svg>`;
const clam = shapes.find(item => item.compose === 'ClamShell');
const px = value => +(value * 380).toFixed(5);
const clamParts = ['M', px(clam.cubics[0][0]), px(clam.cubics[0][1])];
for (const cubic of clam.cubics) clamParts.push('C', ...cubic.slice(2).map(px));
clamParts.push('Z');
const clamSvg = `<svg width="380" height="380" viewBox="0 0 380 380" xmlns="http://www.w3.org/2000/svg">\n<!-- Derived from MaterialShapes.ClamShell, Copyright 2024 The Android Open Source Project; Apache-2.0, see ../LICENSE.androidx. -->\n<path d="${clamParts.join(' ')}" fill="${fill.toUpperCase()}"/></svg>\n`;

const browser = await chromium.launch({channel: 'chrome', headless: true});
const files = {};
try {
  for (const [name, svg, width, height, transparent] of [
    ['compose-expressive-shapes', montage, 1540, 1100, false],
    ['compose-clam-shell', clamSvg, 380, 380, true],
  ]) {
    const page = await browser.newPage({
      viewport: {width, height},
      deviceScaleFactor: 1,
    });
    await page.setContent(svg);
    const png = await page.locator('svg').screenshot({
      omitBackground: transparent,
    });
    files[`${name}.svg`] = Buffer.from(svg);
    files[`${name}.png`] = png;
    await page.close();
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: revision,
    figmaSha256: policy.figmaSha256,
    kitShapeSetNodeId: kitSet.node_id,
    materialShapesSha256: materialSha256,
    roundedPolygonSha256,
    compiler: 'Kotlin 2.4.20',
    browser: `Chrome ${browser.version()}`,
    dpr: 1,
    fill,
    labels: 'Arial index aids only; not part of geometry comparison',
    mappings,
    files: Object.fromEntries(
      Object.entries(files).map(([name, bytes]) => [name, sha256(bytes)]),
    ),
  };
  files['manifest.json'] = Buffer.from(
    JSON.stringify(manifest, null, 2) + '\n',
  );
} finally {
  await browser.close();
}
const check = process.argv.includes('--check');
for (const [name, bytes] of Object.entries(files)) {
  const file = path.join(here, name);
  if (check) {
    if (!(await fs.readFile(file)).equals(bytes))
      throw new Error(`Shape source fixture differs: ${name}`);
  } else {
    await fs.writeFile(file, bytes);
  }
}
console.log(
  JSON.stringify({
    mode: check ? 'checked' : 'written',
    shapeCount: shapes.length,
    files: Object.keys(files),
  }),
);
