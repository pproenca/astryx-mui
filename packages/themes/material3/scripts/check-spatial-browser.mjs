// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-spatial-browser.mjs
 * @input Pinned Material Web geometry inventory and local Chrome
 * @output Computed reference geometry for representative component wrappers
 * @position Focused layout-value check; component parity remains downstream
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const {components} = JSON.parse(
  fs.readFileSync(
    path.resolve(directory, '../src/material3SpatialSource.json'),
    'utf8',
  ),
);
const value = (component, role) => components[component][role].value;
const cases = [
  {
    name: 'filled-button',
    width: null,
    height: value('filled-button', 'container-height'),
    inlineStart: value('filled-button', 'with-leading-icon-leading-space'),
    inlineEnd: value('filled-button', 'with-leading-icon-trailing-space'),
  },
  {
    name: 'icon-button',
    width: value('icon-button', 'state-layer-width'),
    height: value('icon-button', 'state-layer-height'),
  },
  {
    name: 'list-item',
    width: null,
    height: value('list-item', 'one-line-container-height'),
    inlineStart: value('list-item', 'leading-space'),
    inlineEnd: value('list-item', 'trailing-space'),
  },
  {
    name: 'switch-track',
    width: value('switch', 'track-width'),
    height: value('switch', 'track-height'),
  },
  {
    name: 'switch-touch-target',
    width: value('switch', 'touch-target-size'),
    height: value('switch', 'touch-target-size'),
  },
];
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  for (const direction of ['ltr', 'rtl']) {
    const observed = await page.evaluate(
      ({items, direction}) => {
        document.body.dir = direction;
        return items.map(item => {
          const node = document.createElement('div');
          node.style.boxSizing = 'border-box';
          node.style.width = item.width || '160px';
          node.style.height = item.height;
          node.style.paddingInlineStart = item.inlineStart || '0px';
          node.style.paddingInlineEnd = item.inlineEnd || '0px';
          document.body.append(node);
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          const result = {
            width: rect.width,
            height: rect.height,
            inlineStart: style.paddingInlineStart,
            inlineEnd: style.paddingInlineEnd,
          };
          node.remove();
          return result;
        });
      },
      {items: cases, direction},
    );
    for (let index = 0; index < cases.length; index++) {
      const expected = cases[index];
      const actual = observed[index];
      if (
        actual.width !== Number.parseFloat(expected.width || '160px') ||
        actual.height !== Number.parseFloat(expected.height) ||
        actual.inlineStart !== (expected.inlineStart || '0px') ||
        actual.inlineEnd !== (expected.inlineEnd || '0px')
      ) {
        throw new Error(
          `Chrome reference geometry differs for ${expected.name}:${direction}: ${JSON.stringify(actual)}`,
        );
      }
    }
  }
  console.log(
    `Chrome ${browser.version()}: 10 LTR/RTL reference layouts match pinned component geometry.`,
  );
} finally {
  await browser.close();
}
