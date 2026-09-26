// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file tsup.config.ts
 * @input Material 3 source and icon registry entry points
 * @output CJS/ESM package bundles alongside the CLI-built theme artifacts
 * @position Material 3 theme package build configuration
 */

import {defineConfig} from 'tsup';

const external = ['@astryxdesign/core', 'react'];

export default defineConfig([
  {
    entry: ['src/source.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    clean: false,
    external,
    noExternal: ['@astryxdesign/material3'],
  },
  {
    entry: {icons: 'src/material3Icons.tsx'},
    format: ['esm'],
    dts: false,
    clean: false,
    external,
  },
]);
