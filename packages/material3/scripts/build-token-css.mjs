// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native foundation module. @output Static CSS from the same runtime graph. @position Native package build artifact. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {material3TokenCss} from '../dist/foundation.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await fs.writeFile(
  path.join(packageRoot, 'dist/tokens.css'),
  `/* Copyright (c) Meta Platforms, Inc. and affiliates. */\n${material3TokenCss()}`,
);
