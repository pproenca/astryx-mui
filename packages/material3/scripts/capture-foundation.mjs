// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input A verified native browser PNG and optional M3_CAPTURE_DIR. @output Named actual image for revision-bound migration evidence. @position Optional capture hook for permanent foundation checks. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';

export async function captureFoundation(id, image) {
  const directory = process.env.M3_CAPTURE_DIR;
  if (!directory) return;
  if (!/^[a-z][a-z0-9-]+$/i.test(id))
    throw new Error(`Invalid foundation capture ID: ${id}`);
  await fs.mkdir(directory, {recursive: true});
  await fs.writeFile(path.join(directory, `${id}.png`), PNG.sync.write(image));
}
