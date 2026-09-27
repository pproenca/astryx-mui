// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native Icon and MaterialSymbol TypeScript sources. @output Babel-built ESM component entry points with compiled StyleX classes. @position Native package component build step. */
import {transformFileAsync} from '@babel/core';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const configFile = fileURLToPath(new URL('../babel.config.json', import.meta.url));

for (const name of ['Icon', 'MaterialSymbol']) {
  const source = new URL(`../src/${name}/${name}.tsx`, import.meta.url);
  const output = new URL(`../dist/${name}/${name}.js`, import.meta.url);
  const result = await transformFileAsync(fileURLToPath(source), {configFile});
  if (!result?.code) throw new Error(`Babel returned no ${name} output.`);
  await writeFile(output, result.code + '\n');
}
