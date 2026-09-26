// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Existing XLSX and workflow/upgrade mutation. @output Locked atomic transactions and immutable pre-upgrade snapshots. @position Migration-only persistence. */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dependency} from './runtime.mjs';
import {present} from './presentation.mjs';
import path from 'node:path';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function workbook(
  file,
  mutating,
  action,
  {archiveBeforeChange = false} = {},
) {
  if (!file)
    throw new Error(
      'Set M3_WORKBOOK to the existing migration workbook. No database is created implicitly.',
    );
  let lock;
  const originalWrite = process.stdout.write;
  process.stdout.write = function (...args) {
    return process.stderr.write(...args);
  };
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    if (mutating) {
      lock = await fs.open(`${file}.lock`, 'wx');
      await lock.writeFile(`${process.pid} material3-migration\n`);
    }
    const before = await fs.readFile(file);
    const {SpreadsheetFile, FileBlob} = await dependency('@oai/artifact-tool');
    const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(file));
    const result = await action(wb);
    if (mutating && result.changed) {
      if (archiveBeforeChange) {
        const dir = path.join(path.dirname(file), '.m3-receipts', 'upgrades');
        await fs.mkdir(dir, {recursive: true});
        const snapshot = path.join(dir, `${hash(before)}.xlsx`);
        try {
          await fs.writeFile(snapshot, before, {flag: 'wx'});
        } catch (e) {
          if (
            e.code !== 'EEXIST' ||
            hash(await fs.readFile(snapshot)) !== hash(before)
          )
            throw e;
        }
        result.data.previousWorkbookSnapshot = snapshot;
      }
      wb.recalculate();
      await (await SpreadsheetFile.exportXlsx(wb)).save(temporary);
      await present(temporary);
      if (hash(await fs.readFile(file)) !== hash(before))
        throw new Error(
          'Workbook changed outside this transaction; retry from its latest state.',
        );
      await fs.rename(temporary, file);
    }
    return result;
  } finally {
    process.stdout.write = originalWrite;
    await fs.rm(`${temporary}.inspect.ndjson`, {force: true});
    await fs.rm(temporary, {force: true});
    await lock?.close();
    if (lock) await fs.rm(`${file}.lock`, {force: true});
  }
}
