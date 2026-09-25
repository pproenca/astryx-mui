#!/usr/bin/env node
// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Bundles each public theme's source, strongly typed same-stem descriptor,
 * local source dependencies, and palette-authoring artifacts into
 * `packages/cli/assets/templates/themes/` so `astryx theme add` can scaffold a
 * complete theme without the package installed. There is no central catalog.
 * Run from the repo root and commit the generated bundle.
 * @input Public theme packages and their same-stem descriptors
 * @output Self-contained CLI theme templates
 * @position Theme package to CLI integration build
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseTheme} from '../packages/cli/authoring/doctypes/theme/parse.mjs';
import {readThemeDescriptorValue} from '../packages/cli/foundation/discovery/theme-discovery.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const THEMES_SRC_ROOT = path.join(REPO_ROOT, 'packages', 'themes');
const CLI_THEMES_OUT = path.join(
  REPO_ROOT,
  'packages',
  'cli',
  'assets',
  'templates',
  'themes',
);

function toIdentifier(slug) {
  return slug.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/**
 * Follow local imports used by the theme entry so a scaffold never receives a
 * theme file with missing sibling modules. Keep the package's relative paths.
 * @param {string} sourceDir
 * @param {string} entry
 * @returns {string[]}
 */
export function localThemeFiles(sourceDir, entry) {
  const files = new Set();
  const visit = relative => {
    if (files.has(relative)) return;
    const full = path.join(sourceDir, relative);
    files.add(relative);
    const content = fs.readFileSync(full, 'utf-8');
    const imports = [
      ...content.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g),
      ...content.matchAll(/\bimport\s*['"](\.[^'"]+)['"]/g),
    ];
    for (const [, specifier] of imports) {
      const base = path.resolve(path.dirname(full), specifier);
      if (!base.startsWith(`${sourceDir}${path.sep}`)) {
        throw new Error(
          `${relative} imports outside its theme source: ${specifier}`,
        );
      }
      const candidates = [
        base,
        ...['.ts', '.tsx', '.json', '.js', '.mjs'].map(ext => `${base}${ext}`),
      ];
      const dependency = candidates.find(
        candidate =>
          fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      if (!dependency) {
        throw new Error(
          `${relative} has unresolved local import: ${specifier}`,
        );
      }
      visit(path.relative(sourceDir, dependency).split(path.sep).join('/'));
    }
  };
  visit(entry);
  return [...files].sort();
}

/**
 * The public theme packages to bundle: each directory with a package.json and
 * a `src/<name>Theme.ts`, unless the package is private. A public one whose
 * same-stem descriptor is missing, or is not a ThemeDoc the CLI reads for that
 * slug, throws rather than dropping out of the bundle or breaking it.
 * @param {string} [themesRoot]
 * @returns {string[]}
 */
export function listThemeSlugs(themesRoot = THEMES_SRC_ROOT) {
  if (!fs.existsSync(themesRoot)) return [];
  return fs
    .readdirSync(themesRoot, {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(slug => {
      const sourceDir = path.join(themesRoot, slug, 'src');
      const stem = `${toIdentifier(slug)}Theme`;
      const pkg = path.join(themesRoot, slug, 'package.json');
      const source = path.join(sourceDir, `${stem}.ts`);
      if (!fs.existsSync(pkg) || !fs.existsSync(source)) return false;
      const manifest = readJSON(pkg);
      // A private theme package is a test fixture, not a selectable theme.
      if (manifest.private === true) return false;
      const where = `${path.basename(themesRoot)}/${slug}`;
      const name =
        typeof manifest.name === 'string'
          ? `${manifest.name} (${where})`
          : where;
      const descriptor = path.join(sourceDir, `${stem}.doc.mjs`);
      if (!fs.existsSync(descriptor)) {
        throw new Error(
          `Theme package ${name} has src/${stem}.ts but no src/${stem}.doc.mjs descriptor, so it cannot be bundled.`,
        );
      }
      // The CLI's own reader and parser, so a bundled theme always reads back.
      const label = `Theme package ${name} descriptor src/${stem}.doc.mjs`;
      const doc = parseTheme(
        readThemeDescriptorValue(descriptor, label),
        label,
      );
      if (doc.name !== slug) {
        throw new Error(
          `${label} names "${doc.name}", but the package folder is "${slug}".`,
        );
      }
      return true;
    })
    .sort();
}

function main() {
  let slugs;
  try {
    slugs = listThemeSlugs();
  } catch (error) {
    console.error(
      `generate-cli-themes: ${error instanceof Error ? error.message : error}`,
    );
    process.exitCode = 1;
    return;
  }
  if (slugs.length === 0) {
    console.warn('generate-cli-themes: no theme packages found — skipping.');
    return;
  }

  // Reset the output dir so removed themes and obsolete catalog files do not linger.
  fs.rmSync(CLI_THEMES_OUT, {recursive: true, force: true});
  fs.mkdirSync(CLI_THEMES_OUT, {recursive: true});

  for (const slug of slugs) {
    const id = toIdentifier(slug);
    const sourceDir = path.join(THEMES_SRC_ROOT, slug, 'src');
    const outDir = path.join(CLI_THEMES_OUT, slug);
    const stem = `${id}Theme`;
    fs.mkdirSync(outDir, {recursive: true});

    const files = new Map(
      [...localThemeFiles(sourceDir, `${stem}.ts`), `${stem}.doc.mjs`].map(
        file => [file, path.join(sourceDir, file)],
      ),
    );

    // Keep optional theme-owned authoring artifacts with the template. A
    // palette-backed theme must remain reproducible after `theme add`.
    const optionalFiles = [
      {source: path.join(sourceDir, 'icons.tsx'), output: 'icons.tsx'},
      {
        source: path.join(sourceDir, `${id}Palettes.ts`),
        output: `${id}Palettes.ts`,
      },
      {
        source: path.join(sourceDir, `${id}Palettes.generated.ts`),
        output: `${id}Palettes.generated.ts`,
      },
      {
        source: path.join(sourceDir, `${id}PaletteRefs.generated.ts`),
        output: `${id}PaletteRefs.generated.ts`,
      },
      {
        source: path.join(sourceDir, `${id}Palettes.generated.receipt.json`),
        output: `${id}Palettes.generated.receipt.json`,
      },
      {
        source: path.join(THEMES_SRC_ROOT, slug, 'palette.config.json'),
        output: 'palette.config.json',
      },
      {
        source: path.join(THEMES_SRC_ROOT, slug, 'THIRD_PARTY_NOTICES.md'),
        output: 'THIRD_PARTY_NOTICES.md',
      },
      {
        source: path.join(THEMES_SRC_ROOT, slug, 'LICENSE-APACHE-2.0'),
        output: 'LICENSE-APACHE-2.0',
      },
      {
        source: path.join(THEMES_SRC_ROOT, slug, 'LICENSE'),
        output: 'LICENSE',
      },
    ];
    for (const file of optionalFiles) {
      if (!fs.existsSync(file.source)) continue;
      files.set(file.output, file.source);
    }

    for (const [file, source] of files) {
      const output = path.join(outDir, file);
      fs.mkdirSync(path.dirname(output), {recursive: true});
      fs.copyFileSync(source, output);
    }

    console.log(`  bundled theme "${slug}" (${files.size} files)`);
  }

  console.log(
    `generate-cli-themes: wrote ${slugs.length} typed theme directories to ${path.relative(REPO_ROOT, CLI_THEMES_OUT)}`,
  );
}

/** Whether this module is the entry point, however the path to it was spelled. */
function isEntryPoint() {
  try {
    return (
      fs.realpathSync(process.argv[1] ?? '') ===
      fs.realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isEntryPoint()) main();
