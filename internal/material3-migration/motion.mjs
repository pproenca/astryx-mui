/** @input Local reference/native GIF or video and sampling times. @output Playback metadata, exact decoded frames and contact sheet. @position Disposable media inspection helper. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {hash} from './workbook.mjs';
import {dependency} from './runtime.mjs';
const run = (command, args) =>
  execFileSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 60000,
  });
export function selectFrames(times, frames) {
  if (
    !Array.isArray(times) ||
    times.length < 3 ||
    times.length > 12 ||
    times.some(t => !Number.isFinite(t) || t < 0) ||
    new Set(times).size !== times.length
  )
    throw new Error(
      'Supply 3–12 distinct nonnegative sampling times in milliseconds',
    );
  return [...times]
    .sort((a, b) => a - b)
    .map(time => {
      let best = 0;
      for (let i = 1; i < frames.length; i++)
        if (Math.abs(frames[i] - time) < Math.abs(frames[best] - time))
          best = i;
      if (!frames.length || time > frames.at(-1))
        throw new Error('Sampling time exceeds the final decoded frame');
      return {
        requestedTimeMs: time,
        actualTimeMs: frames[best],
        frameIndex: best,
      };
    });
}
export async function inspectMotion(file, times, out) {
  if (!file || !out)
    throw new Error(
      'Supply a local clip, --times milliseconds and --out a new directory',
    );
  const absolute = await fs.realpath(file),
    data = await fs.readFile(absolute);
  const probe = JSON.parse(
    run('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height,avg_frame_rate:frame=best_effort_timestamp_time',
      '-of',
      'json',
      absolute,
    ]),
  );
  const stream = probe.streams?.[0],
    frames = (probe.frames || [])
      .map(f => Number(f.best_effort_timestamp_time) * 1000)
      .filter(Number.isFinite);
  if (!stream || !frames.length)
    throw new Error('No timestamped video frames found');
  const selected = selectFrames(times, frames);
  if (new Set(selected.map(f => f.frameIndex)).size !== selected.length)
    throw new Error(
      'Sampling times collapse onto the same decoded frame; choose wider intervals',
    );
  await fs.mkdir(out, {recursive: false}); // refuses overwrite of a prior capture
  for (let i = 0; i < selected.length; i++) {
    const frame = selected[i];
    frame.file = path.resolve(
      out,
      `frame-${String(i).padStart(2, '0')}-${Math.round(frame.actualTimeMs)}ms.png`,
    );
    run('ffmpeg', [
      '-v',
      'error',
      '-i',
      absolute,
      '-vf',
      `select=eq(n\\,${frame.frameIndex})`,
      '-frames:v',
      '1',
      '-update',
      '1',
      frame.file,
    ]);
  }
  const module = await dependency('pngjs'),
    PNG = module.PNG || module.default.PNG;
  const images = await Promise.all(
    selected.map(async f => PNG.sync.read(await fs.readFile(f.file))),
  );
  const columns = Math.min(3, images.length),
    rows = Math.ceil(images.length / columns),
    gutter = 8;
  const w = images[0].width,
    h = images[0].height;
  if ((w + gutter) * columns * (h + gutter) * rows > 48_000_000)
    throw new Error(
      'Contact sheet exceeds safe dimensions; crop the source deliberately before inspection',
    );
  const sheet = new PNG({
    width: columns * (w + gutter) + gutter,
    height: rows * (h + gutter) + gutter,
  });
  sheet.data.fill(255);
  for (let i = 0; i < images.length; i++)
    PNG.bitblt(
      images[i],
      sheet,
      0,
      0,
      w,
      h,
      gutter + (i % columns) * (w + gutter),
      gutter + Math.floor(i / columns) * (h + gutter),
    );
  const contactSheet = path.resolve(out, 'contact-sheet.png');
  await fs.writeFile(contactSheet, PNG.sync.write(sheet));
  const result = {
    reference: absolute,
    referenceSha256: hash(data),
    width: w,
    height: h,
    fps: stream.avg_frame_rate,
    contactSheet,
    frames: selected,
    reviewInstruction:
      'Play the original clip at normal speed, then inspect frames left-to-right/top-to-bottom using actualTimeMs. Extraction does not record a watched review.',
  };
  await fs.writeFile(
    path.join(out, 'frames.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
  return result;
}
