// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file generate-icon-source.mjs
 * @input Pinned Google Material Symbols SVGs at one immutable commit
 * @output material3IconSource.json or an exact --check comparison
 * @position Reproducible Material 3 theme artwork extraction
 */

import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sourceCommit = 'bd8cb85bd4bad964fe6918f79665bb40c3a8efef';
const symbols = {
  close: 'close',
  chevronDown: 'keyboard_arrow_down',
  chevronLeft: 'keyboard_arrow_left',
  chevronRight: 'keyboard_arrow_right',
  chevronsLeft: 'keyboard_double_arrow_left',
  chevronsRight: 'keyboard_double_arrow_right',
  check: 'check',
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
  calendar: 'calendar_month',
  clock: 'schedule',
  externalLink: 'open_in_new',
  menu: 'menu',
  moreHorizontal: 'more_horiz',
  search: 'search',
  arrowUp: 'arrow_upward',
  arrowDown: 'arrow_downward',
  arrowsUpDown: 'unfold_more',
  funnel: 'filter_alt',
  eyeSlash: 'visibility_off',
  viewColumns: 'view_column',
  copy: 'content_copy',
  checkDouble: 'done_all',
  wrench: 'build',
  stop: 'stop',
  microphone: 'mic',
};
const filled = new Set(['success', 'error', 'warning', 'info']);
const iconRows = {};
for (const [name, symbol] of Object.entries(symbols)) {
  const variant = filled.has(name) ? 'filled' : 'outlined';
  const filename = `${symbol}${variant === 'filled' ? '_fill1' : ''}_24px.svg`;
  const sourcePath = `symbols/web/${symbol}/materialsymbolsoutlined/${filename}`;
  const url = `https://raw.githubusercontent.com/google/material-design-icons/${sourceCommit}/${sourcePath}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const svg = (await response.text()).trim();
  const viewBox = svg.match(/\bviewBox="([^"]+)"/)?.[1];
  const paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/>/g)].map(
    match => match[1],
  );
  if (
    viewBox !== '0 -960 960 960' ||
    !paths.length ||
    /<(?:circle|rect|polygon|polyline|line|ellipse|image|text|use|g)\b/.test(
      svg,
    )
  ) {
    throw new Error(`Unsupported Material Symbol SVG structure: ${sourcePath}`);
  }
  iconRows[name] = {
    symbol,
    variant,
    sourcePath,
    sha256: createHash('sha256').update(svg).digest('hex'),
    viewBox,
    paths,
  };
}
if (Object.keys(iconRows).length !== 28)
  throw new Error('Expected all 28 Astryx shared icon names.');
const data = {
  sourceRepository: 'google/material-design-icons',
  sourceCommit,
  license: 'Apache-2.0',
  artwork: iconRows,
};
const output = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/material3IconSource.json',
);
const generated = JSON.stringify(data, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== generated)
    throw new Error('Material 3 icon data differs from pinned SVGs.');
  console.log('Icon source matches 28 pinned official Material Symbols SVGs.');
} else {
  fs.writeFileSync(output, generated);
  console.log(`Wrote ${output} from ${sourceCommit}.`);
}
