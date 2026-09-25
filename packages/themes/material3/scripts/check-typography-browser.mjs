// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-typography-browser.mjs
 * @input Material 3 type-style exports and a local Chromium browser
 * @output Computed CSS metric verification for every size-specific type role
 * @position Focused browser check for the Material 3 typography foundation
 */

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(directory, '../src/material3Typography.ts');
const bundled = await build({entryPoints: [entry], bundle: true, platform: 'node',
  format: 'esm', write: false, logLevel: 'silent'});
const url = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`;
const {material3TypeRoles, material3TypeStyle} = await import(url);
const entries = material3TypeRoles.map(role => ({role, style: material3TypeStyle(role)}));
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><head><style>:root{font-size:16px}</style></head><body></body></html>');
  const observed = await page.evaluate(items => {
    return items.map(({role, style}) => {
      const node = document.createElement('div');
      node.textContent = 'Material typography metric sample';
      Object.assign(node.style, style);
      document.body.append(node);
      const css = getComputedStyle(node);
      return {role, fontFamily: css.fontFamily, fontSize: css.fontSize,
        lineHeight: css.lineHeight, fontWeight: css.fontWeight,
        letterSpacing: css.letterSpacing, boxHeight: node.getBoundingClientRect().height};
    });
  }, entries);
  for (let index = 0; index < entries.length; index++) {
    const {role, style} = entries[index];
    const actual = observed[index];
    const close = (value, expected) => Math.abs(Number.parseFloat(value) - Number.parseFloat(expected) * 16) < 0.12;
    const letterSpacing = actual.letterSpacing === 'normal' ? '0px' : actual.letterSpacing;
    if (!actual.fontFamily.includes('Roboto') || !actual.fontFamily.includes('Arial') ||
        !close(actual.fontSize, style.fontSize) || !close(actual.lineHeight, style.lineHeight) ||
        !close(letterSpacing, style.letterSpacing) ||
        actual.fontWeight !== style.fontWeight ||
        Math.abs(actual.boxHeight - Number.parseFloat(style.lineHeight) * 16) > 0.2) {
      throw new Error(`Chromium type metrics differ for ${role}: ${JSON.stringify(actual)}`);
    }
  }
  console.log(`Chromium ${browser.version()}: ${observed.length} Material 3 type roles have expected computed size, line-height, weight, spacing, fallback family, and line box.`);
} finally {
  await browser.close();
}
