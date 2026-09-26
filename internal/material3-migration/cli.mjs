#!/usr/bin/env node
// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Migration commands, pinned AndroidX and configured workbook. @output One versioned source/workflow/audit result. @position Disposable CLI entry point. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {workbook} from './workbook.mjs';
import {dispatch, policy} from './workflow.mjs';
import {compare} from './compare.mjs';
import {inspectMotion} from './motion.mjs';
import {indexCompose, digest} from './compose.mjs';
export const commands = [
  {
    name: 'source prepare',
    summary:
      'Index the clean pinned AndroidX checkout; reuse unchanged source output',
    writesWorkbook: false,
    args: '--androidx <checkout>',
  },
  {
    name: 'workbook upgrade',
    summary: 'Upgrade the existing v2 workbook in place, preserving history',
    writesWorkbook: true,
  },
  {
    name: 'task prepare',
    summary:
      'Prepare a hashed source brief; implementation requires a resolved --baseline',
    writesWorkbook: true,
    args: '<id> [--baseline <source-decision.json>]',
  },
  {
    name: 'audit',
    summary:
      'Check complete baseline coverage; --retire-check proves build/tests without the harness in an isolated copy',
    writesWorkbook: false,
  },
  {
    name: 'source',
    summary:
      'Search the retained Figma, Compose, Web and source-access inventories',
    writesWorkbook: false,
    args: '<query> --limit <count>',
  },
  {
    name: 'motion inspect',
    summary:
      'Extract timed GIF/video frames and a contact sheet; then watch the original',
    writesWorkbook: false,
    args: '<clip> --times 0,100,200 --out <new-directory>',
  },
  {
    name: 'status',
    summary: 'Ready work, blockers and QA queue',
    writesWorkbook: false,
  },
  {
    name: 'task pop',
    summary: 'Claim one ready outcome and return its source-linked brief',
    writesWorkbook: true,
  },
  {
    name: 'task show',
    summary: 'Read one task; --full expands acceptance rows',
    writesWorkbook: false,
    args: '<id>',
  },
  {
    name: 'task block',
    summary: 'Release an active claim with a reason',
    writesWorkbook: true,
    args: '<id> --reason <text>',
  },
  {
    name: 'task unblock',
    summary: 'Release a manual hold; hard prerequisites still apply',
    writesWorkbook: true,
    args: '<id>',
  },
  {
    name: 'task verify',
    summary: 'Run the task verifier, recompute visual evidence and prepare QA',
    writesWorkbook: true,
    args: '<id>',
  },
  {
    name: 'task review',
    summary: 'Show preview, references, motion clips and interaction checks',
    writesWorkbook: false,
    args: '<id>',
  },
  {
    name: 'task qa',
    summary: 'Record the actual human decision for the verified revision',
    writesWorkbook: true,
    args: '<id> <approve|reject> --reference <text>',
  },
  {
    name: 'task finish',
    summary: 'Confirm merged revision, passing CI and worktree cleanup',
    writesWorkbook: true,
    args: '<id> --pr <url>',
  },
  {
    name: 'compare',
    summary: 'Measure exact PNG differences; optionally write --diff <png>',
    writesWorkbook: false,
    args: '<reference.png> <actual.png>',
  },
];
export function parse(args) {
  const flags = {},
    words = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (['json', 'full', 'dense', 'help', 'retire-check'].includes(key))
        flags[key] = true;
      else if (
        [
          'repo',
          'workbook',
          'reason',
          'reference',
          'pr',
          'diff',
          'times',
          'out',
          'limit',
          'androidx',
          'baseline',
        ].includes(key)
      ) {
        if (!args[i + 1] || args[i + 1].startsWith('--'))
          throw new Error(`Missing value for ${arg}`);
        flags[key] = args[++i];
      } else throw new Error(`Unknown option ${arg}`);
    } else words.push(arg);
  }
  const command =
    ['task', 'motion', 'workbook'].includes(words[0]) ||
    (words[0] === 'source' && words[1] === 'prepare')
      ? words.slice(0, 2).join(' ')
      : words[0] || 'help';
  return {
    command,
    flags,
    words,
    id: words[0] === 'task' ? words[2] : undefined,
    decision: words[3],
  };
}
export function render(envelope) {
  return JSON.stringify(envelope, null, 2);
}
export async function main(args = process.argv.slice(2)) {
  let input;
  try {
    input = parse(args);
    const {command, flags, words, id, decision} = input;
    if (command === 'help' || command === 'manifest' || flags.help) {
      const data = {
        commands,
        options: [
          '--json',
          '--dense',
          '--full',
          '--repo <checkout>',
          '--workbook <file>',
        ],
        workflow:
          'Pinned scope → prepared sources → foundations → pilots → dependency-ready Material 3 + Expressive coverage. Verify → human QA → merge → audit without harness.',
        configuration: ['M3_WORKBOOK', 'M3_DEPS', 'M3_ANDROIDX', 'ASTRYX_REPO'],
        next: ['status', 'task pop'],
      };
      const out = {apiVersion: 1, type: 'manifest', data};
      console.log(
        flags.json || flags.dense ? JSON.stringify(out) : render(out),
      );
      return;
    }
    const definition = commands.find(c => c.name === command);
    if (!definition) throw new Error(`Unknown command: ${command}. Run help.`);
    let result;
    if (command === 'source prepare') {
      const p = await policy(),
        repo =
          flags.repo ||
          process.env.ASTRYX_REPO ||
          path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
      const index = await indexCompose(
          flags.androidx || process.env.M3_ANDROIDX,
          p.value,
        ),
        bytes = JSON.stringify(index, null, 2) + '\n',
        target = path.join(repo, p.value.composeInventory);
      let reused = false;
      try {
        reused = (await fs.readFile(target, 'utf8')) === bytes;
      } catch {}
      if (!reused) await fs.writeFile(target, bytes);
      result = {
        type: 'source.prepared',
        data: {
          commit: index.commit,
          families: index.families.length,
          tokenFiles: index.tokens.length,
          sha256: digest(bytes),
          reused,
        },
      };
    } else if (command === 'motion inspect')
      result = {
        type: 'motion.inspection',
        data: await inspectMotion(
          words[2],
          String(flags.times || '')
            .split(',')
            .map(Number),
          flags.out,
        ),
      };
    else if (command === 'compare')
      result = {
        type: 'comparison',
        data: await compare(words[1], words[2], flags.diff),
      };
    else {
      if (
        command.startsWith('task ') &&
        command !== 'task pop' &&
        !/^M3-[A-Z]+-\d+$/.test(id || '')
      )
        throw new Error('Supply a valid task ID from status');
      const file =
        flags.workbook ||
        process.env.M3_WORKBOOK ||
        process.env.ASTRYX_MIGRATION_WORKBOOK;
      const repo =
        flags.repo ||
        process.env.ASTRYX_REPO ||
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
      result = await workbook(file, definition.writesWorkbook, wb =>
        dispatch(wb, command, {
          ...flags,
          repo,
          id,
          decision,
          query: words[1],
          limit: Number(flags.limit || 12),
          stateDir: path.join(path.dirname(file), '.m3-receipts'),
        }),
      );
    }
    const out = {apiVersion: 1, type: result.type, data: result.data};
    if (command === 'audit' && !result.data.complete) process.exitCode = 1;
    console.log(flags.json || flags.dense ? JSON.stringify(out) : render(out));
  } catch (error) {
    const out = {
      apiVersion: 1,
      type: 'error',
      code: error.code === 'EEXIST' ? 'WORKBOOK_LOCKED' : 'MIGRATION_BLOCKED',
      error: error.message,
      next: ['help', 'status'],
    };
    console.log(
      input?.flags.json || input?.flags.dense || args.includes('--json')
        ? JSON.stringify(out)
        : render(out),
    );
    process.exitCode = 1;
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
