// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Material 3 gallery. @output Self-contained docsite public preview. @position Docsite build asset copy; runtime never reads the migration harness. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(app, '../../packages/material3/dist/gallery');
const target = path.join(app, 'public/material3-gallery');
await fs.access(path.join(source, 'index.html'));
await fs.rm(target, {recursive: true, force: true});
await fs.cp(source, target, {recursive: true});
console.log('Copied native Material 3 foundation gallery to docsite/public.');
