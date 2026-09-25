// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-shape-browser.mjs
 * @input Material 3 shape exports and a local Chrome browser
 * @output Computed border-radius verification for CSS roles and directional lists
 * @position Focused browser geometry check for the Material 3 shape foundation
 */

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(directory, '../src/material3Shape.ts');
const bundled = await build({entryPoints: [entry], bundle: true, platform: 'node',
  format: 'esm', write: false, logLevel: 'silent'});
const url = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`;
const {material3CssCorners, material3SassOnlyCornerLists, material3CornerListCss} = await import(url);
const cases = [
  ...Object.entries(material3CssCorners).map(([name, value]) => ({name, value, expected: [value, value, value, value]})),
  ...Object.keys(material3SassOnlyCornerLists).flatMap(name =>
    ['ltr', 'rtl'].map(direction => ({name: `${name}:${direction}`,
      value: material3CornerListCss(name, direction),
      expected: material3CornerListCss(name, direction).split(' ')}))),
];
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  const observed = await page.evaluate(items => items.map(item => {
    const node = document.createElement('div');
    node.style.width = '80px';
    node.style.height = '40px';
    node.style.borderRadius = item.value;
    document.body.append(node);
    const style = getComputedStyle(node);
    return [style.borderTopLeftRadius, style.borderTopRightRadius,
      style.borderBottomRightRadius, style.borderBottomLeftRadius];
  }), cases);
  for (let index = 0; index < cases.length; index++) {
    if (JSON.stringify(observed[index]) !== JSON.stringify(cases[index].expected)) {
      throw new Error(`Chrome shape geometry differs for ${cases[index].name}: ${JSON.stringify(observed[index])}`);
    }
  }
  console.log(`Chrome ${browser.version()}: ${cases.length} Material 3 corner cases have expected computed geometry.`);
} finally {
  await browser.close();
}
