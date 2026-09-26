// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file check-theme-parity.mjs
 * @input Built Material 3 package, static CSS, pinned color source, and Chrome
 * @output Runtime/built graph parity and browser-resolved light/dark aliases
 * @position Material 3 theme build verification
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {resolveThemeToken} from '@astryxdesign/core/theme';

const directory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(directory, '..');
const source = await import(path.join(packageRoot, 'dist/source.mjs'));
const built = await import(path.join(packageRoot, 'dist/material3.js'));
const css = fs.readFileSync(path.join(packageRoot, 'dist/theme.css'), 'utf8');
const colors = JSON.parse(
  fs.readFileSync(
    path.join(packageRoot, 'src/material3ColorSource.json'),
    'utf8',
  ),
);

assert.deepEqual(source.material3Theme.tokens, built.material3Theme.tokens);
assert.equal(source.material3Theme.iconDefaultSize, 'lg');
assert.equal(built.material3Theme.iconDefaultSize, 'lg');
assert.deepEqual(
  source.material3Theme.localTokens,
  built.material3Theme.localTokens,
);
assert.deepEqual(
  source.material3Theme.components,
  built.material3Theme.components,
);
assert.deepEqual(
  Object.keys(source.material3Theme.icons).sort(),
  Object.keys(built.material3Theme.icons).sort(),
);
assert.equal(Object.keys(source.material3Theme.localTokens).length, 181);
assert.equal(Object.keys(source.material3Theme.tokens).length, 97);
assert.equal(Object.keys(source.material3Theme.icons).length, 28);
assert.equal(
  source.material3Theme.tokens['--color-accent'],
  'var(--md-sys-color-primary)',
);
assert.equal(
  source.material3Theme.tokens['--radius-full'],
  'var(--md-sys-shape-corner-full)',
);
assert.ok(
  !fs
    .readFileSync(path.join(packageRoot, 'dist/source.mjs'), 'utf8')
    .includes('from "@astryxdesign/material3"'),
  'Public theme bundle must contain its build-time native input',
);
for (const name of Object.keys(source.material3Theme.localTokens)) {
  assert.ok(css.includes(`${name}:`), `Missing static CSS role ${name}`);
}

const rgb = hex => {
  const digits = hex.slice(1);
  const full =
    digits.length === 3
      ? [...digits].map(char => char + char).join('')
      : digits;
  return `rgb(${[0, 2, 4].map(index => Number.parseInt(full.slice(index, index + 2), 16)).join(', ')})`;
};
const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head>
    <body><div id="theme" data-astryx-theme="material3"></div></body></html>`);
  for (const mode of ['light', 'dark']) {
    for (const theme of [source.material3Theme, built.material3Theme]) {
      assert.equal(
        resolveThemeToken(theme, '--color-accent', {mode}),
        colors[`${mode}Resolved`].primary,
      );
      assert.equal(
        resolveThemeToken(theme, '--text-body-size', {mode}),
        '0.875rem',
      );
      assert.match(
        resolveThemeToken(theme, '--color-overlay-hover', {mode}),
        /^rgba\(/,
      );
    }
    await page
      .locator('html')
      .evaluate((html, value) => html.setAttribute('data-theme', value), mode);
    const observed = await page.locator('#theme').evaluate(
      (host, roles) => {
        const values = {};
        for (const role of roles) {
          const node = document.createElement('span');
          node.style.color = `var(--md-sys-color-${role})`;
          host.append(node);
          values[role] = getComputedStyle(node).color;
          node.remove();
        }
        const primary = document.createElement('span');
        primary.style.color = 'var(--color-accent)';
        primary.style.fontSize = 'var(--text-body-size)';
        primary.style.fontFamily = 'var(--font-family-body)';
        host.append(primary);
        const style = getComputedStyle(primary);
        const portable = {
          accent: style.color,
          bodySize: style.fontSize,
          bodyFamily: style.fontFamily,
        };
        primary.remove();
        return {values, portable};
      },
      Object.keys(colors[`${mode}Resolved`]),
    );
    for (const [role, value] of Object.entries(colors[`${mode}Resolved`])) {
      assert.equal(observed.values[role], rgb(value), `${mode} ${role}`);
    }
    assert.equal(
      observed.portable.accent,
      rgb(colors[`${mode}Resolved`].primary),
    );
    assert.equal(observed.portable.bodySize, '14px');
    assert.match(observed.portable.bodyFamily, /Roboto/);
    const overridden = await page.locator('#theme').evaluate(host => {
      host.style.setProperty('--md-sys-color-primary', '#123456');
      const probe = document.createElement('span');
      probe.style.color = 'var(--color-accent)';
      host.append(probe);
      const result = getComputedStyle(probe).color;
      probe.remove();
      host.style.removeProperty('--md-sys-color-primary');
      return result;
    });
    assert.equal(
      overridden,
      'rgb(18, 52, 86)',
      `${mode} scoped bridge override`,
    );
  }
  console.log(
    `Chrome ${browser.version()}: 49 color roles in both modes, portable aliases and same-host scoped overrides, 181 static local roles, and runtime/built values agree.`,
  );
} finally {
  await browser.close();
}
