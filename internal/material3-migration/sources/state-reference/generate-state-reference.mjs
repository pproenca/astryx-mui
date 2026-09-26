// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose state/ripple/Button source, kit state-layer variables and licensed Roboto. @output Light/dark static state-layer references with source provenance. @position Disposable foundation interaction-state reference generator. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = path.dirname(here);
const repo = path.resolve(sources, '../../..');
const read = async file => JSON.parse(await fs.readFile(file));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const compose = await read(path.join(sources, 'compose-inventory.json'));
const figma = await read(path.join(sources, 'figma-kit-inventory.json'));
const web = await read(
  path.join(repo, 'packages/themes/material3/src/material3MotionSource.json'),
);
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
if (
  compose.commit !== policy.androidxCommit ||
  figma.source.localExportSha256 !== policy.figmaSha256 ||
  web.sourceCommit !== policy.materialWebCommit
)
  throw new Error('State reference source pins differ from policy');
const androidx = process.env.M3_ANDROIDX;
if (!androidx)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
if (
  execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim() !== policy.androidxCommit ||
  execFileSync('git', ['-C', androidx, 'status', '--porcelain'], {
    encoding: 'utf8',
  }).trim()
)
  throw new Error('AndroidX checkout differs from the pinned clean revision');
const sourceFiles = {};
for (const name of ['Ripple', 'Surface', 'Button']) {
  const item = compose.families.find(file => file.name === name);
  if (!item) throw new Error(`Missing Compose ${name} source inventory`);
  if (sha256(await fs.readFile(path.join(androidx, item.path))) !== item.sha256)
    throw new Error(`Pinned Compose ${name} source differs`);
  sourceFiles[name] = {path: item.path, sha256: item.sha256};
}
const token = name => {
  const file = compose.tokens.find(item => item.name === name);
  if (!file) throw new Error(`Missing Compose ${name} tokens`);
  return new Map(
    file.values.map(({name: key, expression}) => [key, expression]),
  );
};
const state = token('StateTokens');
const opacity = Object.fromEntries(
  ['Hover', 'Focus', 'Pressed', 'Dragged'].map(name => {
    const expression = state.get(`${name}StateLayerOpacity`);
    if (!/^0\.\d+f$/.test(expression || ''))
      throw new Error(`Unresolved Compose ${name} state opacity`);
    return [name.toLowerCase(), Number(expression.slice(0, -1))];
  }),
);
if (
  opacity.hover !== 0.08 ||
  opacity.focus !== 0.1 ||
  opacity.pressed !== 0.1 ||
  opacity.dragged !== 0.16 ||
  web.stateLayerOpacity['focus-state-layer-opacity'] !== 0.12 ||
  web.stateLayerOpacity['pressed-state-layer-opacity'] !== 0.12
)
  throw new Error('Pinned Compose/Web state opacity disagreement changed');
const filled = token('FilledButtonTokens');
const small = token('ButtonSmallTokens');
for (const [name, expression] of [
  ['ContainerColor', 'ColorSchemeKeyTokens.Primary'],
  ['LabelTextColor', 'ColorSchemeKeyTokens.OnPrimary'],
  ['DisabledContainerColor', 'ColorSchemeKeyTokens.OnSurface'],
  ['DisabledLabelTextColor', 'ColorSchemeKeyTokens.OnSurfaceVariant'],
])
  if (filled.get(name) !== expression)
    throw new Error(`Filled Button ${name} source binding changed`);
if (
  filled.get('DisabledContainerOpacity') !== '0.1f' ||
  filled.get('DisabledLabelTextOpacity') !== '0.38f' ||
  small.get('ContainerShapeRound') !== 'ShapeKeyTokens.CornerFull' ||
  small.get('ContainerHeight') !== '40.0.dp'
)
  throw new Error('Filled Button disabled or geometry source changed');

const palette = token('PaletteTokens');
const rgb = expression => {
  const match = expression?.match(
    /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
  );
  if (!match)
    throw new Error(`Unresolved Compose palette color: ${expression}`);
  return match.slice(1).map(Number);
};
const color = (mode, name) => {
  const scheme = token(`Color${mode}Tokens`);
  function resolve(role) {
    const expression = scheme.get(role);
    if (!expression) throw new Error(`Missing Compose ${mode} color: ${role}`);
    return expression.startsWith('PaletteTokens.')
      ? rgb(palette.get(expression.slice('PaletteTokens.'.length)))
      : resolve(expression);
  }
  return resolve(name);
};
const hex = channels =>
  `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`;
const composite = (base, layer, alpha) =>
  base.map((channel, index) =>
    Math.round(channel * (1 - alpha) + layer[index] * alpha),
  );
const robotoPath = path.join(
  repo,
  'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf',
);
const roboto = await fs.readFile(robotoPath);
const robotoSha256 = sha256(roboto);
if (
  robotoSha256 !==
  'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134'
)
  throw new Error('Pinned licensed Roboto fixture changed');
const fontUrl = `data:font/ttf;base64,${roboto.toString('base64')}`;

const files = {};
const cases = {};
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const mode of ['Light', 'Dark']) {
    const surface = color(mode, 'Surface');
    const backdrop = color(mode, 'SurfaceContainerLowest');
    const onSurface = color(mode, 'OnSurface');
    const onSurfaceVariant = color(mode, 'OnSurfaceVariant');
    const primary = color(mode, 'Primary');
    const onPrimary = color(mode, 'OnPrimary');
    const theme = {
      surface: hex(surface),
      backdrop: hex(backdrop),
      onSurface: hex(onSurface),
      onSurfaceVariant: hex(onSurfaceVariant),
      primary: hex(primary),
      onPrimary: hex(onPrimary),
    };
    const kitBindings = {};
    for (const [label, role] of [
      ['On Primary', 'onPrimary'],
      ['On Surface', 'onSurface'],
    ]) {
      for (const [alphaLabel, alpha] of [
        ['08', 0.08],
        ['10', 0.1],
        ['16', 0.16],
      ]) {
        const name = `State Layers/${label}/Opacity-${alphaLabel}`;
        const item = figma.variables.find(variable => variable.name === name);
        if (
          !item ||
          item[mode.toLowerCase()] !== `${theme[role].toUpperCase()} / ${alpha}`
        )
          throw new Error(`Kit ${mode} ${name} differs from Compose role`);
        kitBindings[name] = item.node_id;
      }
    }
    const generic = [
      {name: 'Rest', alpha: 0},
      ...['hover', 'focus', 'pressed', 'dragged'].map(name => ({
        name,
        alpha: opacity[name],
      })),
    ].map(item => ({
      ...item,
      fill: hex(composite(surface, onSurface, item.alpha)),
    }));
    const button = [
      {name: 'Rest', alpha: 0, fill: hex(primary), label: hex(onPrimary)},
      ...['hover', 'focus', 'pressed'].map(name => ({
        name,
        alpha: opacity[name],
        fill: hex(composite(primary, onPrimary, opacity[name])),
        label: hex(onPrimary),
      })),
      {
        name: 'Disabled',
        alpha: null,
        fill: hex(composite(surface, onSurface, 0.1)),
        label: hex(
          composite(composite(surface, onSurface, 0.1), onSurfaceVariant, 0.38),
        ),
      },
    ];
    const cards = generic
      .map(
        item =>
          `<figure><div class="generic" style="background:${item.fill}"></div><figcaption>${item.name} · ${item.alpha.toFixed(2)}<br>${item.fill}</figcaption></figure>`,
      )
      .join('');
    const buttons = button
      .map(
        item =>
          `<figure><div class="button" style="background:${item.fill};color:${item.label}">Button</div><figcaption>${item.name}${item.alpha === null ? '' : ` · ${item.alpha.toFixed(2)}`}<br>${item.fill}</figcaption></figure>`,
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
      *{box-sizing:border-box}html,body{margin:0;padding:0}body{width:1180px;height:560px;background:${theme.backdrop};color:${theme.onSurface};font:16px/24px SourceRoboto,sans-serif}
      main{padding:28px 36px}h1{font-size:24px;line-height:32px;margin:0 0 8px}h2{font-size:17px;line-height:24px;margin:0 0 12px}p{margin:0 0 20px;font-size:13px;line-height:20px}
      section{margin-bottom:30px}.row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}figure{margin:0;text-align:center}.generic{width:160px;height:96px;margin:0 auto;border-radius:16px}.button{width:160px;height:40px;margin:28px auto;display:flex;align-items:center;justify-content:center;border-radius:9999px;font-size:14px;font-weight:500}figcaption{font-size:12px;line-height:18px;margin-top:8px}.note{font-size:13px;line-height:20px;max-width:1000px}
    </style></head><body><main><h1>Compose state layers · ${mode}</h1><p>Static source-value browser rendition · interactive ripple and focus acceptance remain separate</p><section><h2>OnSurface layer over Surface</h2><div class="row">${cards}</div></section><section><h2>Filled Button · Primary with OnPrimary layer</h2><div class="row">${buttons}</div></section><div class="note">Disabled uses OnSurface container at 10% and OnSurfaceVariant label at 38%. Focused browser controls also need a visible focus indicator. Pressed feedback animates in the source; this sheet shows only its static layer color.</div></main></body></html>`;
    const page = await browser.newPage({
      viewport: {width: 1180, height: 560},
      deviceScaleFactor: 1,
    });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    files[`state-${mode.toLowerCase()}.png`] = await page.screenshot();
    cases[mode.toLowerCase()] = {theme, generic, button, kitBindings};
    await page.close();
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    figmaSha256: policy.figmaSha256,
    webCommit: policy.materialWebCommit,
    sourceFiles,
    stateOpacity: opacity,
    disabled: {containerOpacity: 0.1, labelOpacity: 0.38},
    cases,
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    dpr: 1,
    viewport: {width: 1180, height: 560},
    font: {file: path.relative(repo, robotoPath), sha256: robotoSha256},
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
      throw new Error(`State source fixture differs: ${name}`);
  } else {
    await fs.writeFile(file, bytes);
  }
}
console.log(
  JSON.stringify({
    mode: check ? 'checked' : 'written',
    files: Object.keys(files),
  }),
);
