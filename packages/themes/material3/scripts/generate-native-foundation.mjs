// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material values: Copyright The Android Open Source Project and Google LLC, Apache-2.0.

/**
 * @file generate-native-foundation.mjs
 * @input Built canonical native Material 3 token graph
 * @output Checked, self-contained compatibility snapshot for the CLI theme template
 * @position Theme build boundary between the private native package and public theme source
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {material3TokenValues} from '@astryxdesign/material3';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'src/material3Foundation.generated.ts');
const light = material3TokenValues('light', 'web-compat');
const dark = material3TokenValues('dark', 'web-compat');
const content = [
  '// Copyright (c) Meta Platforms, Inc. and affiliates.',
  '// Material values: Copyright The Android Open Source Project and Google LLC, Apache-2.0.',
  '',
  '/**',
  ' * @file material3Foundation.generated.ts',
  ' * @input Canonical @astryxdesign/material3 web-compat roles',
  ' * @output Self-contained light and dark values for the Core compatibility theme',
  ' * @position Generated theme source copied into the public CLI template',
  ' *',
  ' * Run pnpm -F @astryxdesign/theme-material3 generate:foundation after',
  ' * changing native values; the theme build rejects a stale snapshot.',
  ' */',
  '',
  `export const material3WebCompatLight = ${JSON.stringify(light, null, 2)} as const;`,
  '',
  `export const material3WebCompatDark = ${JSON.stringify(dark, null, 2)} as const;`,
  '',
].join('\n');

if (process.argv.includes('--write')) {
  fs.writeFileSync(output, content);
  console.log(`Updated ${path.relative(root, output)} from native Material 3.`);
} else if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) {
  throw new Error('Material 3 compatibility snapshot is stale; run pnpm -F @astryxdesign/theme-material3 generate:foundation.');
} else {
  console.log('Material 3 compatibility snapshot matches native values.');
}
