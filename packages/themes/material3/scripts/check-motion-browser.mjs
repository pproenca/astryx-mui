// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-motion-browser.mjs
 * @input Material 3 motion exports and a local Chrome browser
 * @output Computed motion, state-layer, and reduced-motion reference checks
 * @position Focused browser check for the Material 3 motion foundation
 */

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const directory = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(directory, '../src/material3Motion.ts');
const bundled = await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'silent',
});
const url = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString('base64')}`;
const {
  material3Durations,
  material3Easings,
  material3StateLayerOpacity,
  material3StateLayerColor,
} = await import(url);
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html><head><style>
    #motion { transition-property: opacity; transition-duration: 200ms;
      transition-timing-function: cubic-bezier(0.2, 0, 0, 1); }
    @media (prefers-reduced-motion: reduce) {
      #motion { transition-duration: 0ms; }
    }
  </style></head><body><div id="motion"></div></body></html>`);
  const observed = await page.evaluate(
    ({durations, easings, states}) => {
      const node = document.getElementById('motion');
      const durationValues = Object.entries(durations).map(([name, value]) => {
        node.style.transitionDuration = value;
        return [
          name,
          Number.parseFloat(getComputedStyle(node).transitionDuration) * 1000,
        ];
      });
      node.style.transitionDuration = '';
      const easingValues = Object.entries(easings).map(([name, value]) => {
        node.style.transitionTimingFunction = value;
        return [name, getComputedStyle(node).transitionTimingFunction];
      });
      node.style.transitionTimingFunction = '';
      const stateColors = states.map(([name, value]) => {
        node.style.backgroundColor = value;
        return [name, getComputedStyle(node).backgroundColor];
      });
      return {
        durationValues,
        easingValues,
        stateColors,
        normalDuration: getComputedStyle(node).transitionDuration,
      };
    },
    {
      durations: material3Durations,
      easings: material3Easings,
      states: Object.keys(material3StateLayerOpacity).map(name => [
        name,
        material3StateLayerColor('#000000', name),
      ]),
    },
  );
  for (const [name, milliseconds] of observed.durationValues) {
    if (milliseconds !== Number.parseFloat(material3Durations[name])) {
      throw new Error(`Chrome duration differs for ${name}: ${milliseconds}ms`);
    }
  }
  for (const [name, curve] of observed.easingValues) {
    if (curve !== material3Easings[name])
      throw new Error(`Chrome easing differs for ${name}: ${curve}`);
  }
  for (const [name, color] of observed.stateColors) {
    const alpha = Number(
      color.match(/\/ ([\d.]+)\)/)?.[1] ??
        color.match(/rgba\([^,]+,[^,]+,[^,]+, ([\d.]+)\)/)?.[1],
    );
    if (Math.abs(alpha - material3StateLayerOpacity[name]) > 0.0001) {
      throw new Error(`Chrome state-layer alpha differs for ${name}: ${color}`);
    }
  }
  if (observed.normalDuration !== '0.2s')
    throw new Error(`Normal motion differs: ${observed.normalDuration}`);
  await page.emulateMedia({reducedMotion: 'reduce'});
  const reduced = await page.locator('#motion').evaluate(node => ({
    duration: getComputedStyle(node).transitionDuration,
    background: getComputedStyle(node).backgroundColor,
  }));
  if (
    reduced.duration !== '0s' ||
    reduced.background !== observed.stateColors.at(-1)[1]
  ) {
    throw new Error(
      `Reduced motion must stop travel while preserving state feedback: ${JSON.stringify(reduced)}`,
    );
  }
  console.log(
    `Chrome ${browser.version()}: 16 durations, 10 easings, 4 state layers, and reduced-motion CSS passed.`,
  );
} finally {
  await browser.close();
}
