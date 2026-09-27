// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @file Mutation-sensitive scope/status matrix for the pull-request test join. */

import {execFileSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import yaml from 'yaml';

import {describe, expect, it} from 'vitest';

const script = path.join(import.meta.dirname, 'ci-test-join.mjs');
const broad = {
  CHECK_SCOPE_RESULT: 'success',
  DOCSITE_ONLY: 'false',
  SPEC_ONLY: 'false',
  TOOLING_ONLY: 'false',
  TEST_UI_RESULT: 'success',
  TEST_NODE_RESULT: 'success',
  TEST_BUILD_RESULT: 'success',
  REGISTRY_CONTRACT_RESULT: 'success',
  MATERIAL3_NATIVE_RESULT: 'success',
};

function run(overrides = {}) {
  try {
    const stdout = execFileSync(process.execPath, [script], {
      encoding: 'utf8',
      env: {...process.env, ...broad, ...overrides},
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {status: 0, output: stdout};
  } catch (error) {
    return {
      status: error.status ?? 1,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
    };
  }
}

describe('pull-request test join', () => {
  it('routes the permanent native browser command into PR and release gates', () => {
    const workflow = yaml.parse(
      fs.readFileSync(
        path.join(import.meta.dirname, '../workflows/ci.yml'),
        'utf8',
      ),
    );
    const native = workflow.jobs['material3-native'];
    expect(native['continue-on-error']).not.toBe(true);
    expect(native['runs-on']).toBe('xcode-27');
    const install = native.steps.find(step =>
      step.name?.startsWith('Install the reference Chrome'),
    );
    expect(install.run).toContain(
      'fixtures/references/typography/manifest.json',
    );
    expect(install.run).toContain('shasum -a 256 --check');
    expect(install.run).toContain(
      'Native pixel checks require the recorded reference OS',
    );
    expect(install.run).toContain('M3_BROWSER_EXECUTABLE=');
    expect(
      native.steps.some(
        step =>
          step.run === 'pnpm -F @astryxdesign/material3 test' &&
          !step['continue-on-error'],
      ),
    ).toBe(true);
    expect(workflow.jobs.test.needs).toContain('material3-native');
    const join = workflow.jobs.test.steps.find(step =>
      step.run?.includes('ci-test-join.mjs'),
    );
    expect(join.env.MATERIAL3_NATIVE_RESULT).toBe(
      '${{ needs.material3-native.result }}',
    );
    expect(workflow.jobs['release-check'].needs).toContain('material3-native');
  });
  it('requires every owner on broad scope', () => {
    expect(run()).toMatchObject({status: 0});
    for (const [name, value] of [
      ['TEST_UI_RESULT', 'failure'],
      ['TEST_NODE_RESULT', 'cancelled'],
      ['TEST_BUILD_RESULT', 'skipped'],
      ['REGISTRY_CONTRACT_RESULT', 'failure'],
      ['MATERIAL3_NATIVE_RESULT', 'failure'],
      ['MATERIAL3_NATIVE_RESULT', 'skipped'],
      ['MATERIAL3_NATIVE_RESULT', ''],
    ]) {
      expect(run({[name]: value}), name).toMatchObject({status: 1});
    }
  });

  it.each(['DOCSITE_ONLY', 'SPEC_ONLY', 'TOOLING_ONLY'])(
    'accepts a skipped Build owner only for %s',
    scope => {
      expect(
        run({[scope]: 'true', TEST_BUILD_RESULT: 'skipped'}),
      ).toMatchObject({status: 0});
      expect(
        run({[scope]: 'true', TEST_BUILD_RESULT: 'success'}),
      ).toMatchObject({status: 1});
    },
  );

  it('fails closed when classification failed or omitted', () => {
    expect(
      run({CHECK_SCOPE_RESULT: 'failure', TEST_BUILD_RESULT: 'skipped'}),
    ).toMatchObject({status: 1});
    expect(
      run({CHECK_SCOPE_RESULT: '', TEST_BUILD_RESULT: 'skipped'}),
    ).toMatchObject({status: 1});
  });

  it('rejects missing or invalid scope decisions', () => {
    expect(run({SPEC_ONLY: ''})).toMatchObject({status: 1});
    expect(run({TOOLING_ONLY: 'unknown'})).toMatchObject({status: 1});
  });
});
