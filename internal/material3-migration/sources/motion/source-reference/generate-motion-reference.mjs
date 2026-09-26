// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Kotlin spatial spring traces, Compose colors and licensed Roboto. @output Replayable source motion clip and light/dark timed-frame sheets. @position Disposable foundation motion reference generator. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const sources = path.resolve(here, '../..');
const repo = path.resolve(sources, '../../..');
const read = async file => JSON.parse(await fs.readFile(file));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const compose = await read(path.join(sources, 'compose-inventory.json'));
const upstream = await read(
  path.join(sources, 'motion/upstream/manifest.json'),
);
const androidx = process.env.M3_ANDROIDX;
if (!androidx)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
if (
  execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim() !== policy.androidxCommit ||
  execFileSync('git', ['-C', androidx, 'status', '--porcelain'], {
    encoding: 'utf8',
  }).trim() ||
  compose.commit !== policy.androidxCommit ||
  upstream.commit !== policy.androidxCommit
)
  throw new Error('Pinned Compose motion sources or checkout differ');
const names = ['standard-default-spatial', 'expressive-default-spatial'];
const traces = {};
const traceHashes = {};
for (const name of names) {
  const item = upstream.files[name];
  const bytes = await fs.readFile(
    path.join(sources, 'motion/upstream', item.file),
  );
  if (sha256(bytes) !== item.sha256)
    throw new Error(`Pinned Kotlin trace differs: ${name}`);
  const trace = JSON.parse(bytes);
  if (
    trace.producer.kind !== 'upstream' ||
    trace.producer.commit !== policy.androidxCommit ||
    trace.inputs.stepMs !== 20 ||
    trace.inputs.endMs !== 3000 ||
    trace.samples.length !== 151 ||
    trace.inputs.changes.map(change => change.timeMs).join(',') !==
      '0,120,260,600'
  )
    throw new Error(`Unexpected upstream trajectory: ${name}`);
  traces[name] = trace;
  traceHashes[name] = item.sha256;
}
const sample = (name, timeMs) => {
  const hit = traces[name].samples.find(item => item.timeMs === timeMs);
  if (!hit) throw new Error(`Missing ${name} sample at ${timeMs} ms`);
  return hit;
};
const token = name => {
  const file = compose.tokens.find(item => item.name === name);
  if (!file) throw new Error(`Missing Compose token: ${name}`);
  return new Map(
    file.values.map(({name: key, expression}) => [key, expression]),
  );
};
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
const times = [0, 120, 260, 600, 900, 1380];
const modeTheme = mode =>
  Object.fromEntries(
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
const htmlFor = (mode, sheet) => {
  const theme = modeTheme(mode);
  if (!sheet)
    return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
    *{box-sizing:border-box}html,body{margin:0}body{width:960px;height:360px;background:${theme.surface};color:${theme.onSurface};font:16px/24px SourceRoboto,sans-serif}main{padding:24px 36px}h1{font-size:21px;margin:0 0 4px}p{font-size:12px;margin:0 0 16px}.row{display:flex;align-items:center;gap:18px;height:92px}.name{width:120px;font-size:14px;font-weight:600}.track{width:620px;height:54px;border-radius:40px;background:${theme.surfaceContainerLow};position:relative}.axis{position:absolute;top:26px;left:110px;width:400px;height:2px;background:${theme.outline};opacity:.7}.dot{position:absolute;top:7px;left:calc(50% - 20px);width:40px;height:40px;border-radius:100%;background:${theme.primary}}.time{font-size:14px;font-weight:500;margin-top:4px}
  </style></head><body><main><h1>Pinned Compose default spatial spring</h1><p>0 → 100 at 0 ms · 40 at 120 ms · 0 at 260 ms · −100 at 600 ms</p><div class="row"><div class="name">Standard</div><div class="track"><div class="axis"></div><div id="standard" class="dot"></div></div></div><div class="row"><div class="name">Expressive</div><div class="track"><div class="axis"></div><div id="expressive" class="dot"></div></div></div><div id="time" class="time">0 ms</div></main></body></html>`;
  const panel = timeMs => {
    const rows = names
      .map(name => {
        const position = sample(name, timeMs).position;
        const dotX = 125 + position * 1.1;
        return `<div class="line"><span>${name.startsWith('standard') ? 'Standard' : 'Expressive'}</span><div class="track"><div class="dot" style="left:${dotX}px"></div></div></div><small>${position.toFixed(1)} px</small>`;
      })
      .join('');
    return `<div class="panel"><strong>${timeMs} ms</strong>${rows}</div>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:SourceRoboto;src:url('${fontUrl}') format('truetype');font-weight:100 900}
    *{box-sizing:border-box}html,body{margin:0}body{width:1180px;height:520px;background:${theme.surface};color:${theme.onSurface};font:15px/22px SourceRoboto,sans-serif}main{padding:25px 31px}h1{font-size:23px;line-height:30px;margin:0 0 5px}p{font-size:12px;line-height:18px;margin:0 0 18px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.panel{height:170px;background:${theme.surfaceContainerLow};border-radius:16px;padding:13px 16px}.panel strong{display:block;font-size:14px;margin-bottom:8px}.line{display:flex;align-items:center;gap:5px;margin:3px 0}.line span{font-size:11px;width:62px}.track{position:relative;width:270px;height:28px;border-radius:24px;border:1px solid ${theme.outline}}.dot{position:absolute;top:5px;width:16px;height:16px;border-radius:100%;background:${theme.primary}}small{display:block;font-size:10px;line-height:14px;padding-left:67px;color:${theme.onSurfaceVariant}}
  </style></head><body><main><h1>Compose spatial source frames · ${mode}</h1><p>Independent Kotlin positions · target changes at 0, 120, 260 and 600 ms · 20 ms samples</p><div class="grid">${times.map(panel).join('')}</div></main></body></html>`;
};

const files = {};
const browser = await chromium.launch({channel: 'chrome', headless: true});
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'astryx-motion-source-'));
try {
  for (const mode of ['Light', 'Dark']) {
    const page = await browser.newPage({
      viewport: {width: 1180, height: 520},
      deviceScaleFactor: 1,
    });
    await page.setContent(htmlFor(mode, true));
    await page.evaluate(() => document.fonts.ready);
    if (!(await page.evaluate(() => document.fonts.check('15px SourceRoboto'))))
      throw new Error('Pinned Roboto did not load');
    files[`motion-${mode.toLowerCase()}.png`] = await page.screenshot();
    await page.close();
  }
  const page = await browser.newPage({
    viewport: {width: 960, height: 360},
    deviceScaleFactor: 1,
  });
  await page.setContent(htmlFor('Light', false));
  await page.evaluate(() => document.fonts.ready);
  for (let index = 0; index <= 80; index++) {
    const timeMs = index * 20;
    const positions = names.map(name => sample(name, timeMs).position);
    await page.evaluate(
      ([standard, expressive, time]) => {
        document.getElementById('standard').style.transform =
          `translateX(${standard * 2}px)`;
        document.getElementById('expressive').style.transform =
          `translateX(${expressive * 2}px)`;
        document.getElementById('time').textContent = `${time} ms`;
      },
      [...positions, timeMs],
    );
    await page.screenshot({
      path: path.join(temp, `frame-${String(index).padStart(3, '0')}.png`),
    });
  }
  await page.close();
  const video = path.join(temp, 'compose-default-spatial.mp4');
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-framerate',
      '50',
      '-i',
      path.join(temp, 'frame-%03d.png'),
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
      '-metadata',
      'creation_time=1970-01-01T00:00:00Z',
      '-movflags',
      '+faststart',
      video,
    ],
    {stdio: ['ignore', 'pipe', 'pipe']},
  );
  files['compose-default-spatial.mp4'] = await fs.readFile(video);
  const manifest = {
    schemaVersion: 1,
    composeCommit: policy.androidxCommit,
    upstreamSource: upstream.source,
    upstreamSourceSha256: upstream.sourceSha256,
    traceHashes,
    inputs: traces[names[0]].inputs,
    settledAtMs: Object.fromEntries(
      names.map(name => [name, traces[name].settledAtMs]),
    ),
    times,
    browser: `Chrome ${browser.version()}`,
    os: `${os.platform()} ${os.release()}`,
    ffmpeg: execFileSync('ffmpeg', ['-version'], {encoding: 'utf8'}).split(
      '\n',
    )[0],
    dpr: 1,
    sheetViewport: {width: 1180, height: 520},
    videoViewport: {width: 960, height: 360},
    fps: 50,
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
  await fs.rm(temp, {recursive: true, force: true});
}
const check = process.argv.includes('--check');
for (const [name, bytes] of Object.entries(files)) {
  const file = path.join(here, name);
  if (check) {
    if (!(await fs.readFile(file)).equals(bytes))
      throw new Error(`Motion source fixture differs: ${name}`);
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
