// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Existing M3_WORKBOOK, archived receipts and --apply opt-in. @output Atomic correction of already-approved token mappings. @position One-time disposable repair entry point. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {workbook} from '../workbook.mjs';
import {reconcileCompletedTokens} from '../reconcile-tokens.mjs';
import {policy} from '../workflow.mjs';
const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const file = process.env.M3_WORKBOOK;
if (!file) throw new Error('Set M3_WORKBOOK to the sole migration workbook.');
if (process.argv.slice(2).some(arg => arg !== '--apply'))
  throw new Error('Only --apply is supported; omission performs a dry run.');
const apply = process.argv.includes('--apply');
const p = await policy();
const result = await workbook(
  file,
  apply,
  wb =>
    reconcileCompletedTokens(
      wb,
      repo,
      path.join(path.dirname(file), '.m3-receipts'),
      p.value.strategyId,
      apply,
    ),
  {archiveBeforeChange: true},
);
console.log(JSON.stringify(result));
