/** @input Two PNGs captured under the selected reference conditions. @output Exact RGBA pixel differences. @position Disposable comparison helper. */
import fs from 'node:fs/promises';
import {dependency} from './runtime.mjs';
export function pixels(a, b) {
  if (a.width !== b.width || a.height !== b.height)
    throw new Error('Reference and actual dimensions differ');
  let changedPixels = 0,
    maxChannelDelta = 0;
  const data = Buffer.alloc(a.width * a.height * 4);
  for (let i = 0; i < a.data.length; i += 4) {
    let changed = false;
    for (let c = 0; c < 4; c++) {
      const delta = Math.abs(a.data[i + c] - b.data[i + c]);
      maxChannelDelta = Math.max(maxChannelDelta, delta);
      changed ||= delta !== 0;
    }
    if (changed) changedPixels++;
    data[i] = changed ? 255 : 0;
    data[i + 1] = 0;
    data[i + 2] = changed ? 255 : 0;
    data[i + 3] = 255;
  }
  return {
    width: a.width,
    height: a.height,
    changedPixels,
    maxChannelDelta,
    data,
  };
}
export async function compare(reference, actual, diff, readOnly = false) {
  const module = await dependency('pngjs');
  const PNG = module.PNG || module.default.PNG;
  const measured = pixels(
    PNG.sync.read(await fs.readFile(reference)),
    PNG.sync.read(await fs.readFile(actual)),
  );
  if (diff) {
    if (readOnly) {
      const supplied = PNG.sync.read(await fs.readFile(diff));
      if (pixels(measured, supplied).changedPixels)
        throw new Error('Supplied diff image does not match recomputed pixels');
    } else await fs.writeFile(diff, PNG.sync.write(measured));
  }
  const {data, ...result} = measured;
  return result;
}
