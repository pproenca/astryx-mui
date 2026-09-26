// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file build-material-badge.mjs
 * @input MaterialBadge TypeScript source and the package StyleX Babel config
 * @output Parallel ESM and CommonJS component entry points
 * @position Build step for the opt-in Material 3 badge component
 */

import {transformFileAsync} from '@babel/core';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const source = new URL('../src/MaterialBadge.tsx', import.meta.url);
const configFile = fileURLToPath(
  new URL('../babel.config.json', import.meta.url),
);
const output = new URL('../dist/', import.meta.url);

for (const [extension, plugins] of [
  ['mjs', []],
  ['cjs', ['@babel/plugin-transform-modules-commonjs']],
]) {
  const result = await transformFileAsync(fileURLToPath(source), {
    configFile,
    plugins,
  });
  if (!result?.code)
    throw new Error(`Babel returned no MaterialBadge.${extension} output.`);
  await writeFile(
    new URL(`MaterialBadge.${extension}`, output),
    result.code + '\n',
  );
}
