// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Closed foundation/Icon tasks and immutable exact-revision receipts. @output Evidence-backed bookkeeping repair, never new approval. @position Disposable workbook reconciliation. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from './workbook.mjs';
import {table, sheets, write} from './model.mjs';
import {tokenReady, tokenCompletionFormula} from './token-completion.mjs';

export async function reconcileCompletedTokens(
  wb,
  repo,
  stateDir,
  strategy,
  apply = false,
) {
  const tasks = table(wb, sheets.tasks),
    reviews = table(wb, sheets.reviews),
    tokens = table(wb, sheets.tokens);
  const repairs = [];
  for (const id of ['M3-NAT-002', 'M3-NAT-003']) {
    const task = tasks.find(t => t['Task ID'] === id);
    assert.equal(task?.Status, 'Closed', `${id} must already be closed`);
    assert.equal(task.Contract, strategy);
    assert.match(task['Verified SHA'], /^[a-f0-9]{40}$/);
    assert.match(task['Merge SHA'], /^[a-f0-9]{40}$/);
    execFileSync(
      'git',
      ['merge-base', '--is-ancestor', task['Merge SHA'], 'HEAD'],
      {cwd: repo},
    );
    assert.equal(path.basename(task['Receipt path']), task['Receipt path']);
    const receipt = JSON.parse(
      await fs.readFile(path.join(stateDir, task['Receipt path']), 'utf8'),
    );
    assert.equal(hash(JSON.stringify(receipt)), task['Receipt SHA256']);
    assert.equal(receipt.revision, task['Verified SHA']);
    assert.equal(receipt.taskId, id);
    const review = reviews.findLast(
      r =>
        r['Task ID'] === id &&
        r['Verified SHA'] === task['Verified SHA'] &&
        r.Decision === 'Approved',
    );
    assert.ok(review, `${id}: missing exact-revision approval`);
    const files = JSON.parse(review.Notes.split('\n')[0]).files;
    const archived = async relative => {
      const digest = files[relative];
      assert.match(digest || '', /^[a-f0-9]{64}$/, relative);
      const bytes = await fs.readFile(path.join(stateDir, 'files', digest));
      assert.equal(hash(bytes), digest);
      assert.equal(
        hash(
          execFileSync('git', ['show', `${task['Verified SHA']}:${relative}`], {
            cwd: repo,
            maxBuffer: 16 * 1024 * 1024,
          }),
        ),
        digest,
      );
      return bytes.toString('utf8');
    };
    const coverage =
      id === 'M3-NAT-002'
        ? JSON.parse(
            await archived(
              'internal/material3-migration/actual/M3-NAT-002/token-coverage.json',
            ),
          ).tokens
        : null;
    const icon =
      id === 'M3-NAT-003'
        ? await archived('packages/material3/src/Icon/Icon.tsx')
        : '';
    for (const tokenId of receipt.tokenIds) {
      const row = tokens.find(t => t['Map ID'] === tokenId);
      assert.ok(row, tokenId);
      for (const [field, expected] of Object.entries({
        Contract: strategy,
        Verification: 'Pass',
        'Native QA': 'Approved',
        Review: 'Approved',
        Merged: 'Yes',
      }))
        assert.equal(row[field], expected, `${tokenId}: ${field}`);
      if (tokenReady(row, strategy, true)) continue;
      const fields = {};
      if (coverage) {
        assert.ok(
          coverage.some(
            t => t.id === tokenId && t.name === row['Material token'],
          ),
          `${tokenId}: missing approved coverage`,
        );
        assert.equal(row['Astryx candidate'], row['Material token']);
        assert.equal(row.Relationship, 'Candidate');
        fields.Relationship = 'Confirmed';
      } else {
        assert.equal(tokenId, 'TM-04298');
        assert.equal(
          row['Material token'],
          'compose:SmallIconButtonTokens.IconSize',
        );
        assert.equal(row['Astryx candidate'], '');
        assert.match(icon, /--md-icon-size/);
        assert.match(icon, /24px/);
        fields['Astryx candidate'] =
          'Native Icon/MaterialSymbol 24px default; parent controls own slot sizes';
      }
      assert.equal(tokenReady({...row, ...fields}, strategy, true), true);
      fields.Note =
        `${row.Note || ''}\nBookkeeping reconciled from ${id} approved receipt at ${task['Verified SHA']}; implementation and QA unchanged.`.trim();
      repairs.push({id: tokenId, row: row._row, fields});
    }
  }
  if (apply && repairs.length) {
    for (const repair of repairs)
      write(wb, sheets.tokens, repair.row, repair.fields);
    const sheet = wb.worksheets.getItem(sheets.tokens);
    sheet.getRange(`I2:I${tokens.length + 1}`).formulas = tokens.map(t => [
      tokenCompletionFormula(t._row, strategy),
    ]);
  }
  return {
    changed: apply && repairs.length > 0,
    data: {
      repaired: repairs.length,
      tokenIds: repairs.map(r => r.id),
      applied: apply,
    },
  };
}
