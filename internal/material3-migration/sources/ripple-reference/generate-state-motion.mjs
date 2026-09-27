// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Pinned Compose Ripple state-layer tween source, state tokens and licensed Roboto.
 * @output Light/dark state-transition frames, watched clip and source-value manifest.
 * @position Disposable Ripple source motion reference; native acceptance is separate.
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
const staticState = await read(
  path.join(sources, 'state-reference/manifest.json'),
);
const androidx = process.env.M3_ANDROIDX;
if (
  !androidx ||
  inventory.commit !== policy.androidxCommit ||
  staticState.composeCommit !== policy.androidxCommit
)
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
const sourceFile = {
  path: 'compose/material3/material3-ripple/src/commonMain/kotlin/androidx/compose/material3/ripple/Ripple.kt',
  sha256: 'f0ba3e8b3d5b40d3977f7e4dcbf2c93dec02e19705a1141f8efe6dc81c2f0aa7',
};
const source = await fs.readFile(path.join(androidx, sourceFile.path), 'utf8');
if (
  sha256(source) !== sourceFile.sha256 ||
  !/is HoverInteraction\.Enter -> DefaultTweenSpec/.test(source) ||
  !/is FocusInteraction\.Focus -> TweenSpec\(durationMillis = 45, easing = LinearEasing\)/.test(
    source,
  ) ||
  !/is DragInteraction\.Start -> TweenSpec\(durationMillis = 45, easing = LinearEasing\)/.test(
    source,
  ) ||
  !/is DragInteraction\.Start -> TweenSpec\(durationMillis = 150, easing = LinearEasing\)/.test(
    source,
  ) ||
  !/DefaultTweenSpec = TweenSpec<Float>\(durationMillis = 15, easing = LinearEasing\)/.test(
    source,
  ) ||
  !/val newInteraction = interactions\.lastOrNull\(\)/.test(source)
)
  throw new Error('Pinned Compose Ripple state-layer behavior changed');
const tokens = inventory.tokens.find(item => item.name === 'StateTokens');
const expressions = new Map(
  tokens.values.map(({name, expression}) => [name, expression]),
);
const opacity = {
  hover: 0.08,
  focus: 0.1,
  drag: 0.16,
};
for (const [state, value] of Object.entries(opacity)) {
  const key = `${state === 'drag' ? 'Dragged' : state[0].toUpperCase() + state.slice(1)}StateLayerOpacity`;
  if (
    expressions.get(key) !== `${value}f` ||
    staticState.stateOpacity[state === 'drag' ? 'dragged' : state] !== value
  )
    throw new Error(`Pinned ${state} state-layer opacity changed`);
}
const font = await fs.readFile(
  path.join(
    repo,
    'packages/themes/material3/scripts/fonts/Roboto-wdth-wght.ttf',
  ),
);
const fontHash = sha256(font);
if (
  fontHash !==
  'd7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134'
)
  throw new Error('Pinned licensed Roboto fixture changed');
const fontUrl = `data:font/ttf;base64,${font.toString('base64')}`;

// The latest active interaction owns the layer. Retarget from the current alpha.
// Returning from drag to hover uses the incoming hover tween; leaving drag for
// no active interaction uses the longer outgoing drag tween.
const events = [
  {timeMs: 0, state: 'hover', durationMs: 15, action: 'hover enter'},
  {timeMs: 80, state: 'drag', durationMs: 45, action: 'drag over hover'},
  {
    timeMs: 180,
    state: 'hover',
    durationMs: 15,
    action: 'drag stop; hover remains',
  },
  {timeMs: 220, state: null, durationMs: 15, action: 'hover exit'},
  {timeMs: 300, state: 'focus', durationMs: 45, action: 'focus enter'},
  {timeMs: 420, state: null, durationMs: 15, action: 'focus exit'},
  {timeMs: 500, state: 'drag', durationMs: 45, action: 'drag enter'},
  {timeMs: 530, state: null, durationMs: 150, action: 'early drag cancel'},
  {timeMs: 720, state: 'drag', durationMs: 45, action: 'drag enter'},
  {timeMs: 820, state: null, durationMs: 150, action: 'drag exit'},
];
function stateAt(timeMs) {
  let from = 0;
  let to = 0;
  let start = 0;
  let duration = 0;
  let action = 'rest';
  for (const event of events) {
    if (event.timeMs > timeMs) break;
    from += (to - from) * Math.min((event.timeMs - start) / (duration || 1), 1);
    to = opacity[event.state] ?? 0;
    start = event.timeMs;
    duration = event.durationMs;
    action = event.action;
  }
  return {
    alpha: from + (to - from) * Math.min((timeMs - start) / (duration || 1), 1),
    action,
  };
}
const frameTimes = [
  0, 7, 15, 80, 100, 125, 180, 187, 195, 220, 228, 235, 300, 320, 345, 420, 435,
  500, 520, 530, 580, 680, 720, 740, 765, 820, 870, 970,
];
const viewport = {width: 960, height: 360};
function html(mode) {
  const theme = staticState.cases[mode].theme;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
  *{box-sizing:border-box}html,body{margin:0;width:960px;height:360px}
  body{background:${theme.backdrop};color:${theme.onSurface};font:16px/24px SourceRoboto,sans-serif}
  main{padding:24px 36px}h1{font-size:22px;line-height:30px;margin:0 0 5px}
  p{font-size:13px;line-height:20px;margin:0 0 20px}.row{display:flex;gap:48px}
  .sample{width:300px;text-align:center}.target{position:relative;width:220px;height:92px;margin:0 auto;overflow:hidden}
  .generic{background:${theme.surface}}.button{background:${theme.primary};border-radius:46px;color:${theme.onPrimary}}
  .layer{position:absolute;inset:0;pointer-events:none;opacity:0}.generic .layer{background:${theme.onSurface}}
  .button .layer{background:${theme.onPrimary}}.label{font-size:13px;margin-top:16px}
  .button span{position:relative;display:block;padding-top:34px}.legend{font-size:12px;margin-top:26px;line-height:20px}
  </style></head><body><main><h1>Compose Ripple state layer · ${mode}</h1>
  <p id="stage">Source-value browser rendering · most recent active interaction</p>
  <div class="row"><div class="sample"><div class="target generic"><div class="layer"></div></div><div class="label">OnSurface over Surface</div></div>
  <div class="sample"><div class="target button"><div class="layer"></div><span>Filled Button</span></div><div class="label">OnPrimary over Primary</div></div></div>
  <div class="legend">Hover 8% · focus 10% · drag 16% · drag cancel and return-to-hover · DPR 1</div>
  </main></body></html>`;
}
const check = process.argv.includes('--check');
const browser = await chromium.launch({channel: 'chrome', headless: true});
const temporary = await fs.mkdtemp(
  path.join(os.tmpdir(), 'astryx-state-motion-'),
);
const images = {};
try {
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage({viewport, deviceScaleFactor: 1});
    await page.setContent(html(mode));
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('16px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    async function render(timeMs, reduced = false) {
      const {alpha, action} = stateAt(timeMs);
      const displayed = reduced
        ? (opacity[
            events.filter(event => event.timeMs <= timeMs).at(-1)?.state
          ] ?? 0)
        : alpha;
      await page.evaluate(
        ({timeMs, displayed, action, reduced}) => {
          for (const layer of document.querySelectorAll('.layer'))
            layer.style.opacity = String(displayed);
          document.getElementById('stage').textContent =
            `${reduced ? 'Reduced motion · ' : ''}${action} · ${timeMs}ms · alpha ${displayed.toFixed(4)}`;
        },
        {timeMs, displayed, action, reduced},
      );
      return {alpha: displayed, action};
    }
    for (const timeMs of frameTimes) {
      await render(timeMs);
      const name = `state-motion-${mode}-${String(timeMs).padStart(4, '0')}.png`;
      const bytes = await page.screenshot();
      images[name] = sha256(bytes);
      if (check) {
        if (sha256(await fs.readFile(path.join(here, name))) !== images[name])
          throw new Error(`State motion frame changed: ${name}`);
      } else await fs.writeFile(path.join(here, name), bytes);
    }
    for (const timeMs of [500, 530]) {
      await render(timeMs, true);
      const name = `state-motion-${mode}-reduced-${timeMs}.png`;
      const bytes = await page.screenshot();
      images[name] = sha256(bytes);
      if (check) {
        if (sha256(await fs.readFile(path.join(here, name))) !== images[name])
          throw new Error(`Reduced state motion frame changed: ${name}`);
      } else await fs.writeFile(path.join(here, name), bytes);
    }
    if (mode === 'light') {
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
  const clip = path.join(temporary, 'compose-state-motion.mp4');
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
      sha256(await fs.readFile(path.join(here, 'compose-state-motion.mp4'))) !==
      clipHash
    )
      throw new Error('State motion clip changed');
  } else
    await fs.writeFile(path.join(here, 'compose-state-motion.mp4'), clipBytes);
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    sourceFile,
    sourceValues: {
      opacity,
      defaultTweenMs: 15,
      focusAndDragEnterMs: 45,
      dragExitMs: 150,
      events,
    },
    renderer: 'Chrome source-value browser fixture',
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    dpr: 1,
    viewport,
    font: {family: 'Roboto', sha256: fontHash, loaded: true},
    frameTimes,
    samples: Object.fromEntries(
      frameTimes.map(timeMs => [timeMs, stateAt(timeMs)]),
    ),
    images,
    clip: {file: 'compose-state-motion.mp4', sha256: clipHash},
  };
  const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
  if (check) {
    if (
      (await fs.readFile(
        path.join(here, 'state-motion-manifest.json'),
        'utf8',
      )) !== bytes
    )
      throw new Error('State motion manifest changed');
  } else
    await fs.writeFile(path.join(here, 'state-motion-manifest.json'), bytes);
  console.log(
    JSON.stringify({images: Object.keys(images).length, clipSha256: clipHash}),
  );
} finally {
  await browser.close();
  await fs.rm(temporary, {recursive: true, force: true});
}
