// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose Button/TextField geometry, kit component inventory and licensed Roboto. @output Light/dark spacing source diagrams and manifest. @position Disposable foundation geometry reference generator. */
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
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
if (
  compose.commit !== policy.androidxCommit ||
  figma.source.localExportSha256 !== policy.figmaSha256
)
  throw new Error('Spacing reference source pins differ from policy');
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

const base =
  'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/';
const pinnedFiles = {
  'Button.kt':
    '9095ad12e5b26a20bf0cdc53ba01f54b7c8ca41ba4ece933d578ef28a2d97240',
  'TextFieldDefaults.kt':
    '862b2e5705f879402c62c6dc30844ff2e40b0dcbcf56b868c0f84bffe3d32a41',
  'TextField.kt': compose.families.find(item => item.name === 'TextField')
    ?.sha256,
  'internal/TextFieldImpl.kt':
    '6490160723b2e07790cbcae86db014b494aa45b4f5f13402ebfc5597d94b2253',
  'ComposeMaterial3Flags.kt':
    '4218cb959d0bfc617dd512ba89a223ed30546b1383011fd4dd0ba6c4adb12d40',
  'PrecisionPointer.kt':
    '9c6d2e2327996c9e4b6bee1333a593923d2bc5856ffc48836a81ad2ca792fa19',
  'tokens/ButtonSmallTokens.kt':
    'b69bac18f0d6cb6682e8b84f551105cd0d2d485170ff7b47334c78440977976a',
  'tokens/BaselineButtonTokens.kt':
    'd05d10a4ccde921fbec2f151c5e333d1ceb947a626dc3021ac1c302873fb447f',
};
const kotlin = {};
for (const [name, expected] of Object.entries(pinnedFiles)) {
  const bytes = await fs.readFile(path.join(androidx, base, name));
  if (!expected || sha256(bytes) !== expected)
    throw new Error(`Pinned Compose ${name} source differs`);
  kotlin[name] = bytes.toString();
}
const requireSource = (file, pattern) => {
  if (!pattern.test(kotlin[file]))
    throw new Error(`Unresolved Compose geometry in ${file}: ${pattern}`);
};
requireSource(
  'Button.kt',
  /contentPadding: PaddingValues = ButtonDefaults\.ContentPadding/,
);
requireSource(
  'Button.kt',
  /contentPadding: PaddingValues = ButtonDefaults\.contentPaddingFor\(ButtonDefaults\.MinHeight\)/,
);
requireSource('Button.kt', /public val MinWidth: Dp = 58\.dp/);
requireSource(
  'Button.kt',
  /if \(shouldUsePrecisionPointerComponentSizing\.value\) \{\s*36\.dp\s*\} else \{\s*ButtonSmallTokens\.ContainerHeight/,
);
requireSource(
  'Button.kt',
  /if \(shouldUsePrecisionPointerComponentSizing\.value\) 8\.dp else 10\.dp/,
);
requireSource(
  'Button.kt',
  /if \(shouldUsePrecisionPointerComponentSizing\.value\) 12\.dp else SmallStartPadding/,
);
requireSource('TextFieldDefaults.kt', /public val MinHeight: Dp = 56\.dp/);
requireSource('TextFieldDefaults.kt', /public val MinWidth: Dp = 280\.dp/);
requireSource(
  'TextField.kt',
  /internal val TextFieldWithLabelVerticalPadding\s*get\(\) = 8\.dp/,
);
requireSource(
  'internal/TextFieldImpl.kt',
  /internal val TextFieldPadding\s*get\(\) = 16\.dp/,
);
requireSource(
  'ComposeMaterial3Flags.kt',
  /isPrecisionPointerComponentSizingEnabled: Boolean = false/,
);
requireSource(
  'PrecisionPointer.kt',
  /shouldUsePrecisionPointerComponentSizing: MutableState<Boolean> = mutableStateOf\(false\)/,
);
const token = name => {
  const file = compose.tokens.find(item => item.name === name);
  if (!file) throw new Error(`Missing Compose ${name} tokens`);
  return new Map(
    file.values.map(({name: key, expression}) => [key, expression]),
  );
};
const small = token('ButtonSmallTokens');
const baseline = token('BaselineButtonTokens');
const outlined = token('OutlinedTextFieldTokens');
for (const [actual, expected] of [
  [small.get('ContainerHeight'), '40.0.dp'],
  [small.get('LeadingSpace'), '16.0.dp'],
  [small.get('TrailingSpace'), '16.0.dp'],
  [small.get('IconLabelSpace'), '8.0.dp'],
  [small.get('IconSize'), '20.0.dp'],
  [baseline.get('LeadingSpace'), '24.0.dp'],
  [baseline.get('TrailingSpace'), '24.0.dp'],
  [outlined.get('ContainerHeight'), '56.0.dp'],
])
  if (actual !== expected)
    throw new Error(`Compose geometry token changed: ${actual}`);
const kitNodes = {
  Button: '57994:2227',
  'Text field': '52798:24373',
};
for (const [name, nodeId] of Object.entries(kitNodes))
  if (
    !figma.componentSets.some(
      item => item.name === name && item.node_id === nodeId,
    )
  )
    throw new Error(`Frozen kit component set changed: ${name}`);
const geometry = {
  baselineButton: {minWidth: 58, height: 40, inline: 24, block: 8, icon: 18},
  expressiveSmallButton: {
    minWidth: 58,
    height: 40,
    inline: 16,
    block: 10,
    icon: 20,
    iconLabelGap: 8,
  },
  textField: {
    minWidth: 280,
    minHeight: 56,
    inline: 16,
    withLabelBlock: 8,
    withoutLabelBlock: 16,
  },
  precisionPointerOptIn: {
    enabledByDefault: false,
    smallButtonHeight: 36,
    block: 8,
    iconSide: 12,
  },
};
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

const files = {};
const cases = {};
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  for (const mode of ['Light', 'Dark']) {
    const theme = Object.fromEntries(
      [
        'Surface',
        'SurfaceContainerLow',
        'Primary',
        'OnPrimary',
        'OnSurface',
        'OnSurfaceVariant',
        'Outline',
      ].map(name => [
        name.charAt(0).toLowerCase() + name.slice(1),
        hex(color(mode, name)),
      ]),
    );
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
      *{box-sizing:border-box}html,body{margin:0}body{width:1180px;height:640px;background:${theme.surface};color:${theme.onSurface};font:15px/22px SourceRoboto,sans-serif}
      main{padding:28px 38px}h1{font-size:24px;line-height:32px;margin:0 0 4px}h2{font-size:17px;line-height:24px;margin:24px 0 12px}p{font-size:13px;margin:0;color:${theme.onSurfaceVariant}}
      .row{display:flex;gap:24px}.card{width:520px;background:${theme.surfaceContainerLow};border-radius:18px;padding:18px 20px;height:195px}.title{font-size:15px;font-weight:600;margin-bottom:12px}.spec{font-size:12px;color:${theme.onSurfaceVariant};margin-top:10px}.button{min-width:58px;height:40px;border-radius:100px;background:${theme.primary};color:${theme.onPrimary};display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:500}.measure{display:flex;align-items:center;gap:12px}.ruler{background:${theme.outline};height:2px;margin-top:14px;position:relative}.ruler:before,.ruler:after{content:'';position:absolute;top:-5px;width:2px;height:12px;background:${theme.outline}}.ruler:after{right:0}.dim{font-size:12px;white-space:nowrap;color:${theme.onSurfaceVariant}}
      .field{width:280px;height:56px;border:1px solid ${theme.outline};border-radius:4px;position:relative;display:flex;align-items:center;padding:0 16px;font-size:14px}.filled{background:${theme.surfaceContainerLow};border:none;border-bottom:1px solid ${theme.onSurfaceVariant}}.label{position:absolute;top:7px;left:16px;font-size:11px;color:${theme.onSurfaceVariant}}.withlabel{padding-top:14px}.pads{display:flex;gap:8px;margin-top:12px}.pill{background:${theme.surface};border:1px solid ${theme.outline};border-radius:8px;padding:4px 8px;font-size:12px}.note{margin-top:20px;font-size:12px;line-height:18px;max-width:1050px}
    </style></head><body><main><h1>Compose spacing and density · ${mode}</h1><p>Default source geometry; native interaction, labels and responsive layout remain separate</p><h2>Filled Button · baseline and expressive small overload</h2><div class="row"><div class="card"><div class="title">Baseline Button</div><div class="measure"><div class="button" style="padding:8px 24px">Button</div><span class="dim">40 dp min height · 58 dp min width</span></div><div class="ruler" style="width:180px"></div><div class="spec">24 dp start/end · 8 dp top/bottom · 18 dp default icon</div></div><div class="card"><div class="title">Expressive small Button</div><div class="measure"><div class="button" style="padding:10px 16px">Button</div><span class="dim">40 dp min height · 58 dp min width</span></div><div class="ruler" style="width:160px"></div><div class="spec">16 dp start/end · 10 dp top/bottom · 20 dp icon · 8 dp icon/label gap</div></div></div><h2>TextField · filled and outlined defaults</h2><div class="row"><div class="card"><div class="title">Filled · inside label</div><div class="field filled withlabel"><span class="label">Label</span>Input text</div><div class="pads"><span class="pill">280 × 56 dp min</span><span class="pill">16 dp inline</span><span class="pill">8 dp block with label</span></div></div><div class="card"><div class="title">Outlined · no inside label</div><div class="field">Input text</div><div class="pads"><span class="pill">280 × 56 dp min</span><span class="pill">16 dp inline</span><span class="pill">16 dp block without label</span></div></div></div><p class="note">Precision-pointer sizing is opt-in and disabled in pinned Compose. With its flag and device condition enabled, a small Button may use 36 dp height; this sheet records the default 40 dp branch. TextField labels here indicate padding inputs, not an exact floating-label layout.</p></main></body></html>`;
    const captureHtml = html.replace(
      '</style>',
      `@media(max-width:600px){body{width:390px;height:1100px}main{padding:18px 14px}h1{font-size:21px;line-height:28px}h2{margin:16px 0 9px}.row{display:block}.card{width:100%;height:178px;padding:14px 16px;margin-bottom:10px}.measure{gap:8px}.dim{font-size:11px}.pads{gap:4px;flex-wrap:wrap}.pill{font-size:10px;padding:3px 5px}.note{margin-top:8px}}[dir="rtl"] .label{left:auto;right:16px}</style>`,
    );
    const page = await browser.newPage({
      viewport: {width: 1180, height: 640},
      deviceScaleFactor: 1,
    });
    await page.setContent(captureHtml);
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('15px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    files[`spacing-${mode.toLowerCase()}.png`] = await page.screenshot();
    cases[mode.toLowerCase()] = {theme, geometry};
    if (mode === 'Light') {
      await page.setViewportSize({width: 390, height: 1100});
      files['spacing-narrow-light.png'] = await page.screenshot();
    } else {
      await page.evaluate(() => {
        document.documentElement.dir = 'rtl';
      });
      files['spacing-rtl-dark.png'] = await page.screenshot();
    }
    await page.close();
  }
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    figmaSha256: policy.figmaSha256,
    sourceFiles: Object.fromEntries(
      Object.entries(pinnedFiles).map(([name, hash]) => [base + name, hash]),
    ),
    kitNodes,
    cases,
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    dpr: 1,
    viewport: {width: 1180, height: 640},
    variantCaptures: {
      narrowLight: {
        file: 'spacing-narrow-light.png',
        viewport: {width: 390, height: 1100},
        direction: 'ltr',
      },
      rtlDark: {
        file: 'spacing-rtl-dark.png',
        viewport: {width: 1180, height: 640},
        direction: 'rtl',
      },
    },
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
      throw new Error(`Spacing source fixture differs: ${name}`);
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
