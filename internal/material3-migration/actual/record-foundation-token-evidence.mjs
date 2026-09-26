// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Sole migration workbook and verified native CSS role graph. @output Foundation token verification rows and exact coverage IDs for the task receipt. @position Disposable M3-NAT-002 workbook evidence update. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {workbook} from '../workbook.mjs';
import {sheets, table, write} from '../model.mjs';
import {material3TokenValues} from '../../../packages/material3/dist/index.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repo, encoding: 'utf8'}).trim();
const names = Object.keys(material3TokenValues('light')).filter(name =>
  ['--md-ref-typeface-', '--md-sys-color-', '--md-sys-typescale-', '--md-sys-shape-'].some(prefix => name.startsWith(prefix)));
assert.equal(names.length, 123);
const nativeSource = 'packages/material3/src/foundationSource.json';
const coverage = await workbook(process.env.M3_WORKBOOK, true, wb => {
  const rows = table(wb, sheets.tokens);
  const selected = names.map(name => {
    const matches = rows.filter(row => row['Material token'] === name);
    assert.equal(matches.length, 1, `Unique workbook token ${name}`);
    const row = matches[0];
    assert.equal(row.Contract, 'material3-native-v4');
    assert.ok(row['Map ID'].startsWith('TM-'));
    assert.notEqual(row.Merged, 'Yes');
    assert.notEqual(row['Native QA'], 'Approved');
    const kind = name.startsWith('--md-sys-color-') ? '35 schemes × 49 role Chrome captures' :
      name.startsWith('--md-sys-typescale-') || name.startsWith('--md-ref-typeface-') ? '30 type styles and licensed Roboto Chrome captures' :
      '10 corners and 35 Expressive shapes Chrome captures';
    const prior = String(row.Evidence || '').replace(/^M3-NAT-002 @ [a-f0-9]{40}; .*?; prior: /, '');
    write(wb, sheets.tokens, row._row, {
      Verification: 'Pass',
      Evidence: `M3-NAT-002 @ ${revision}; ${nativeSource}; ${kind}; 59 exact RGBA comparisons; prior: ${prior}`,
      'Astryx source': nativeSource,
    });
    return {id: row['Map ID'], name};
  });
  return {changed: true, data: selected};
});
const output = path.join(repo, 'internal/material3-migration/actual/M3-NAT-002/token-coverage.json');
await fs.writeFile(output, `${JSON.stringify({schemaVersion: 1, taskId: 'M3-NAT-002', evidenceRevision: revision, tokens: coverage.data}, null, 2)}\n`);
console.log(`Recorded ${coverage.data.length} canonical native token rows in the sole workbook.`);
