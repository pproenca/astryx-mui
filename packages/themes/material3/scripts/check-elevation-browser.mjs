// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-elevation-browser.mjs
 * @input Material 3 elevation projection, color schemes, and local Chrome
 * @output Computed two-layer shadow and surface-color checks in both modes
 * @position Focused browser check for the Material 3 elevation foundation
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const elevationSource = JSON.parse(
  fs.readFileSync(
    path.resolve(directory, '../src/material3ElevationSource.json'),
    'utf8',
  ),
);
const colorSource = JSON.parse(
  fs.readFileSync(
    path.resolve(directory, '../src/material3ColorSource.json'),
    'utf8',
  ),
);
const bundled = await build({
  entryPoints: [path.resolve(directory, '../src/material3Elevation.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'silent',
});
const url = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`;
const {material3ElevationLayers} = await import(url);
const cases = ['light', 'dark'].flatMap(mode =>
  Object.keys(elevationSource.layers).map(level => ({
    mode,
    level,
    surface: colorSource[`${mode}Resolved`]['surface-container-low'],
    shadowColor: colorSource[`${mode}Resolved`].shadow,
    layers: material3ElevationLayers(
      level,
      colorSource[`${mode}Resolved`].shadow,
    ),
  })),
);
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  const observed = await page.evaluate(
    items =>
      items.map(item => {
        const panel = document.createElement('div');
        panel.style.backgroundColor = item.surface;
        const nodes = [item.layers.key, item.layers.ambient].map(layer => {
          const node = document.createElement('div');
          node.style.boxShadow = layer.boxShadow;
          node.style.opacity = String(layer.opacity);
          panel.append(node);
          return node;
        });
        document.body.append(panel);
        const result = {
          surface: getComputedStyle(panel).backgroundColor,
          layers: nodes.map(node => ({
            boxShadow: getComputedStyle(node).boxShadow,
            opacity: Number(getComputedStyle(node).opacity),
          })),
        };
        panel.remove();
        return result;
      }),
    cases,
  );
  for (let index = 0; index < cases.length; index++) {
    const item = cases[index];
    const actual = observed[index];
    const expectedRgb = item.shadowColor === '#000' ? 'rgb(0, 0, 0)' : null;
    if (
      !expectedRgb ||
      actual.surface !==
        item.surface.replace(
          /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
          (_, r, g, b) =>
            `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`,
        )
    ) {
      throw new Error(
        `Chrome surface differs for ${item.mode}:${item.level}: ${actual.surface}`,
      );
    }
    for (const [layerIndex, name] of ['key', 'ambient'].entries()) {
      const source = elevationSource.layers[item.level][name];
      const expectedShadow = source.boxShadow.replace(
        elevationSource.sampleColor,
        expectedRgb,
      );
      if (
        actual.layers[layerIndex].boxShadow !== expectedShadow ||
        actual.layers[layerIndex].opacity !== source.opacity
      ) {
        throw new Error(
          `Chrome elevation differs for ${item.mode}:${item.level}:${name}: ${JSON.stringify(actual.layers[layerIndex])}`,
        );
      }
    }
  }
  console.log(
    `Chrome ${browser.version()}: 12 light/dark surface cases and 24 independent elevation layers match pinned source.`,
  );
} finally {
  await browser.close();
}
