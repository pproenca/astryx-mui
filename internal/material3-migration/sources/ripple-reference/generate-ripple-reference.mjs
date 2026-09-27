// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned Compose RippleAnimation and state/color tokens with licensed Roboto.
 * @output Bounded/unbounded press frames and watched browser source-value clip.
 * @position Disposable Ripple source reference; native evidence is captured separately.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = path.dirname(here);
const repo = path.resolve(here, '../../../..');
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const inventory = await read(path.join(sources, 'compose-inventory.json'));
const androidx = process.env.M3_ANDROIDX;
if (!androidx || inventory.commit !== policy.androidxCommit)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
if (
  execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim() !== policy.androidxCommit ||
  execFileSync('git', ['-C', androidx, 'status', '--porcelain'], {
    encoding: 'utf8',
  }).trim()
)
  throw new Error('Pinned AndroidX checkout differs or is dirty');
const sourceFiles = {
  animation: {
    path: 'compose/material3/material3-ripple/src/commonMain/kotlin/androidx/compose/material3/ripple/RippleAnimation.kt',
    sha256: '6d3a90e3ab5d82c7a1a1c615fadcc5886343d0029540d3de4c8b151bac6c14f2',
  },
  common: {
    path: 'compose/material3/material3-ripple/src/commonMain/kotlin/androidx/compose/material3/ripple/CommonRipple.kt',
    sha256: 'bedc98fb431199c95fa78cf6689253101f77b43a0ebf32d56f13e08a4105ccea',
  },
  node: {
    path: 'compose/material3/material3-ripple/src/commonMain/kotlin/androidx/compose/material3/ripple/Ripple.kt',
    sha256: 'f0ba3e8b3d5b40d3977f7e4dcbf2c93dec02e19705a1141f8efe6dc81c2f0aa7',
  },
  easing: {
    path: 'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/Easing.kt',
    sha256: '4a00295b76f9dad81eccb3f9e36e7968bd05802a8b29451226954ecee831b755',
  },
};
for (const item of Object.values(sourceFiles)) {
  if (sha256(await fs.readFile(path.join(androidx, item.path))) !== item.sha256)
    throw new Error(`Pinned Compose source changed: ${item.path}`);
}
const animationSource = await fs.readFile(
  path.join(androidx, sourceFiles.animation.path),
  'utf8',
);
const easingSource = await fs.readFile(
  path.join(androidx, sourceFiles.easing.path),
  'utf8',
);
if (
  !/private const val FadeInDuration = 75/.test(animationSource) ||
  !/private const val RadiusDuration = 225/.test(animationSource) ||
  !/private const val FadeOutDuration = 150/.test(animationSource) ||
  !/max\(size\.width, size\.height\) \* 0\.3f/.test(animationSource) ||
  !/CubicBezierEasing\(0\.4f, 0\.0f, 0\.2f, 1\.0f\)/.test(easingSource)
)
  throw new Error('Pinned Compose press tween or easing changed');

const token = name => {
  const item = inventory.tokens.find(candidate => candidate.name === name);
  if (!item) throw new Error(`Missing Compose token: ${name}`);
  return new Map(
    item.values.map(({name: key, expression}) => [key, expression]),
  );
};
const state = token('StateTokens');
if (
  state.get('PressedStateLayerOpacity') !== '0.1f' ||
  state.get('HoverStateLayerOpacity') !== '0.08f' ||
  state.get('FocusStateLayerOpacity') !== '0.1f' ||
  state.get('DraggedStateLayerOpacity') !== '0.16f'
)
  throw new Error('Pinned Compose Ripple state opacities changed');
const palette = token('PaletteTokens');
const rgb = expression => {
  const match = expression?.match(
    /^Color\(red = (\d+), green = (\d+), blue = (\d+)\)$/,
  );
  if (!match) throw new Error(`Unresolved Compose color: ${expression}`);
  return match.slice(1).map(Number);
};
const color = (mode, name) => {
  const scheme = token(`Color${mode}Tokens`);
  function resolve(role) {
    const expression = scheme.get(role);
    if (!expression) throw new Error(`Missing Compose ${mode} role: ${role}`);
    return expression.startsWith('PaletteTokens.')
      ? rgb(palette.get(expression.slice('PaletteTokens.'.length)))
      : resolve(expression);
  }
  return resolve(name);
};
const hex = channels =>
  `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
const roboto = await fs.readFile(
  path.join(
    repo,
    'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf',
  ),
);
const robotoSha256 = sha256(roboto);
if (
  robotoSha256 !==
  'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134'
)
  throw new Error('Pinned licensed Roboto fixture changed');
const fontUrl = `data:font/ttf;base64,${roboto.toString('base64')}`;

// Solve the pinned FastOutSlowIn (0.4, 0, 0.2, 1) cubic in browser coordinates.
const cubic = (first, second, t) =>
  3 * (1 - t) ** 2 * t * first + 3 * (1 - t) * t ** 2 * second + t ** 3;
function fastOutSlowIn(fraction) {
  if (fraction <= 0) return 0;
  if (fraction >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let step = 0; step < 32; step++) {
    const mid = (lo + hi) / 2;
    if (cubic(0.4, 0.2, mid) < fraction) lo = mid;
    else hi = mid;
  }
  return cubic(0, 1, (lo + hi) / 2);
}

const size = {width: 220, height: 92};
const center = {x: size.width / 2, y: size.height / 2};
const startRadius = Math.max(size.width, size.height) * 0.3;
const halfDiagonal = Math.hypot(size.width, size.height) / 2;
const presses = [
  {
    startMs: 0,
    finishMs: 50,
    finishKind: 'early-release',
    origin: {x: 40, y: 30},
  },
  {
    startMs: 160,
    finishMs: 300,
    finishKind: 'next-press',
    origin: {x: 180, y: 62},
  },
  {
    startMs: 300,
    finishMs: 400,
    finishKind: 'early-release',
    origin: {x: 110, y: 40},
  },
];
function pressFrame(timeMs, press, bounded) {
  const elapsed = timeMs - press.startMs;
  if (elapsed < 0) return null;
  const fadeInEnd = press.startMs + 225;
  const fadeOutStart = Math.max(press.finishMs, fadeInEnd);
  if (timeMs >= fadeOutStart + 150) return null;
  const earlyFinish = timeMs >= press.finishMs && timeMs < fadeInEnd;
  const alpha =
    timeMs >= fadeOutStart
      ? 1 - (timeMs - fadeOutStart) / 150
      : earlyFinish
        ? 1
        : Math.min(elapsed / 75, 1);
  const radiusProgress = fastOutSlowIn(Math.min(elapsed / 225, 1));
  const centerProgress = Math.min(elapsed / 225, 1);
  const endRadius = halfDiagonal + (bounded ? 10 : 0);
  const origin = bounded ? press.origin : center;
  return {
    alpha,
    radius: startRadius + (endRadius - startRadius) * radiusProgress,
    x: origin.x + (center.x - origin.x) * centerProgress,
    y: origin.y + (center.y - origin.y) * centerProgress,
  };
}

function html(mode) {
  const surface = hex(color(mode, 'Surface'));
  const container = hex(color(mode, 'SurfaceContainerLow'));
  const onSurface = hex(color(mode, 'OnSurface'));
  const [r, g, b] = color(mode, 'OnSurface');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
    *{box-sizing:border-box}html,body{margin:0;width:960px;height:360px}
    body{background:${surface};color:${onSurface};font:16px/24px SourceRoboto,sans-serif}
    main{padding:24px 36px}h1{font-size:22px;line-height:30px;margin:0 0 5px}
    p{font-size:13px;line-height:20px;margin:0 0 20px}.row{display:flex;gap:48px}
    .sample{width:300px;text-align:center}.target{position:relative;width:${size.width}px;height:${size.height}px;margin:0 auto;background:${container}}
    .bounded{overflow:hidden}.unbounded{overflow:visible}.circle{position:absolute;border-radius:50%;background:rgb(${r} ${g} ${b} / 10%);pointer-events:none}
    .label{font-size:13px;margin-top:16px}.legend{font-size:12px;margin-top:26px;line-height:20px}
  </style></head><body><main><h1>Compose Ripple press · ${mode}</h1>
    <p id="stage">Source-value browser rendering · early release and repeated press</p>
    <div class="row"><div class="sample"><div id="bounded" class="target bounded"></div><div class="label">Bounded · starts at press point</div></div>
    <div class="sample"><div id="unbounded" class="target unbounded"></div><div class="label">Unbounded · starts at center</div></div></div>
    <div class="legend">OnSurface at 10% · release 50ms · press 160ms · press 300ms · release 400ms · DPR 1</div>
  </main></body></html>`;
}
const frameTimes = [
  0, 20, 50, 75, 120, 160, 180, 260, 300, 320, 385, 525, 535, 675,
];
const check = process.argv.includes('--check');
const images = {};
const browser = await chromium.launch({channel: 'chrome', headless: true});
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-ripple-frames-'),
);
try {
  for (const mode of ['Light', 'Dark']) {
    const page = await browser.newPage({
      viewport: {width: 960, height: 360},
      deviceScaleFactor: 1,
    });
    await page.setContent(html(mode));
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    const render = async timeMs => {
      const bounded = presses.map(press => pressFrame(timeMs, press, true));
      const unbounded = presses.map(press => pressFrame(timeMs, press, false));
      await page.evaluate(
        ({timeMs, bounded, unbounded}) => {
          for (const [name, ripples] of [
            ['bounded', bounded],
            ['unbounded', unbounded],
          ]) {
            const target = document.getElementById(name);
            target.replaceChildren();
            for (const ripple of ripples) {
              if (!ripple) continue;
              const circle = document.createElement('span');
              circle.className = 'circle';
              circle.style.left = `${ripple.x - ripple.radius}px`;
              circle.style.top = `${ripple.y - ripple.radius}px`;
              circle.style.width = `${ripple.radius * 2}px`;
              circle.style.height = `${ripple.radius * 2}px`;
              circle.style.opacity = String(ripple.alpha);
              target.append(circle);
            }
          }
          document.getElementById('stage').textContent =
            `Press 0ms · release 50ms · press 160ms · press 300ms · release 400ms · ${timeMs}ms`;
        },
        {timeMs, bounded, unbounded},
      );
    };
    for (const timeMs of frameTimes) {
      await render(timeMs);
      const name = `ripple-${mode.toLowerCase()}-${String(timeMs).padStart(4, '0')}.png`;
      const bytes = await page.screenshot();
      images[name] = sha256(bytes);
      if (check) {
        if (sha256(await fs.readFile(path.join(here, name))) !== images[name])
          throw new Error(`Ripple source frame changed: ${name}`);
      } else await fs.writeFile(path.join(here, name), bytes);
    }
    for (const active of [true, false]) {
      await page.evaluate(
        ({active, boundedRadius, unboundedRadius, x, y}) => {
          for (const name of ['bounded', 'unbounded']) {
            const target = document.getElementById(name);
            target.replaceChildren();
            if (!active) continue;
            const radius = name === 'bounded' ? boundedRadius : unboundedRadius;
            const circle = document.createElement('span');
            circle.className = 'circle';
            circle.style.left = `${x - radius}px`;
            circle.style.top = `${y - radius}px`;
            circle.style.width = `${radius * 2}px`;
            circle.style.height = `${radius * 2}px`;
            circle.style.opacity = '1';
            target.append(circle);
          }
          document.getElementById('stage').textContent = active
            ? 'Reduced motion · immediately visible pressed state'
            : 'Reduced motion · immediately cleared after release';
        },
        {
          active,
          boundedRadius: halfDiagonal + 10,
          unboundedRadius: halfDiagonal,
          x: center.x,
          y: center.y,
        },
      );
      const name = `ripple-${mode.toLowerCase()}-reduced-${active ? 'press' : 'release'}.png`;
      const bytes = await page.screenshot();
      images[name] = sha256(bytes);
      if (check) {
        if (sha256(await fs.readFile(path.join(here, name))) !== images[name])
          throw new Error(`Reduced-motion ripple frame changed: ${name}`);
      } else await fs.writeFile(path.join(here, name), bytes);
    }
    if (mode === 'Light') {
      for (let index = 0; index <= 50; index++) {
        await render(index * 20);
        await page.screenshot({
          path: path.join(
            temporary,
            `frame-${String(index).padStart(3, '0')}.png`,
          ),
        });
      }
    }
    await page.close();
  }
  const clip = path.join(temporary, 'compose-ripple.mp4');
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-framerate',
    '50',
    '-i',
    path.join(temporary, 'frame-%03d.png'),
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '15',
    '-pix_fmt',
    'yuv420p',
    '-threads',
    '1',
    '-map_metadata',
    '-1',
    clip,
  ]);
  const clipBytes = await fs.readFile(clip);
  const clipHash = sha256(clipBytes);
  if (check) {
    if (
      sha256(await fs.readFile(path.join(here, 'compose-ripple.mp4'))) !==
      clipHash
    )
      throw new Error('Ripple source clip changed');
  } else await fs.writeFile(path.join(here, 'compose-ripple.mp4'), clipBytes);
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    figmaSha256: policy.figmaSha256,
    webCommit: policy.materialWebCommit,
    sourceFiles,
    sourceValues: {
      size,
      startRadius,
      boundedEndRadius: halfDiagonal + 10,
      unboundedEndRadius: halfDiagonal,
      pressedOpacity: 0.1,
      fadeInMs: 75,
      radiusAndCenterMs: 225,
      fadeOutMs: 150,
      radiusEasing: [0.4, 0, 0.2, 1],
      presses,
    },
    renderer: 'Chrome source-value browser fixture',
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    dpr: 1,
    viewport: {width: 960, height: 360},
    font: {family: 'Roboto', sha256: robotoSha256, loaded: true},
    frameTimes,
    images,
    clip: {file: 'compose-ripple.mp4', sha256: clipHash},
  };
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
  if (check) {
    if (
      (await fs.readFile(path.join(here, 'manifest.json'), 'utf8')) !==
      manifestBytes
    )
      throw new Error('Ripple source manifest changed');
  } else await fs.writeFile(path.join(here, 'manifest.json'), manifestBytes);
  console.log(
    JSON.stringify({images: Object.keys(images).length, clipSha256: clipHash}),
  );
} finally {
  await browser.close();
  await fs.rm(temporary, {recursive: true, force: true});
}
