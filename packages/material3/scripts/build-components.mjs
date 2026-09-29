// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native component TypeScript sources, including FilledField and decorative Elevation paint. @output Babel-built ESM component entry points with compiled StyleX classes. @position Native package component build step. */
import {transformFileAsync} from '@babel/core';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const configFile = fileURLToPath(
  new URL('../babel.config.json', import.meta.url),
);

for (const [directory, name] of [
  ['Icon', 'Icon'],
  ['MaterialSymbol', 'MaterialSymbol'],
  ['FocusRing', 'FocusRing'],
  ['Ripple', 'Ripple'],
  ['Divider', 'DividerRule'],
  ['Divider', 'HorizontalDivider'],
  ['Divider', 'VerticalDivider'],
  ['Elevation', 'Elevation'],
  ['FilledField', 'FilledField'],
]) {
  const source = new URL(`../src/${directory}/${name}.tsx`, import.meta.url);
  const output = new URL(`../dist/${directory}/${name}.js`, import.meta.url);
  const result = await transformFileAsync(fileURLToPath(source), {configFile});
  if (!result?.code) throw new Error(`Babel returned no ${name} output.`);
  await writeFile(output, result.code + '\n');
}
