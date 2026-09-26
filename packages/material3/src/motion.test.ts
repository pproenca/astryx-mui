// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native analytical spring and pinned independent Kotlin traces. @output Standard/Expressive trajectory, interruption, reversal and settling parity. @position Permanent native motion regression. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {material3SpringSpecs} from './foundation';
import {sampleMaterial3Spring} from './motion';

type Trace = {
  inputs: {
    changes: {timeMs: number; target: number}[];
    dampingRatio: number;
    stiffness: number;
    initialPosition: number;
    initialVelocity: number;
    settling: {position: number; velocity: number};
  };
  samples: {timeMs: number; position: number; velocity: number}[];
  settledAtMs: number;
};

const root = new URL('../fixtures/references/motion/', import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL('manifest.json', root), 'utf8'),
) as {
  commit: string;
  files: Record<string, {file: string; sha256: string; settledAtMs: number}>;
};

describe('pinned Compose spring trajectories', () => {
  it('matches all 12 independent traces through retarget and reversal', () => {
    expect(Object.keys(manifest.files)).toHaveLength(12);
    for (const [name, item] of Object.entries(manifest.files)) {
      const bytes = readFileSync(new URL(item.file, root));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        item.sha256,
      );
      const trace = JSON.parse(bytes.toString()) as Trace;
      const [style, speed, category] = name.split('-') as [
        'standard' | 'expressive',
        'fast' | 'default' | 'slow',
        'spatial' | 'effects',
      ];
      const spec = material3SpringSpecs[style][speed][category] as [
        number,
        number,
      ];
      expect(spec).toEqual([trace.inputs.dampingRatio, trace.inputs.stiffness]);
      expect(trace.samples).toHaveLength(151);
      for (const sample of trace.samples) {
        const actual = sampleMaterial3Spring(
          spec,
          trace.inputs.changes,
          sample.timeMs,
          {
            position: trace.inputs.initialPosition,
            velocity: trace.inputs.initialVelocity,
          },
        );
        expect(
          Math.abs(actual.position - sample.position),
          `${name} ${sample.timeMs} position`,
        ).toBeLessThan(0.0002);
        expect(
          Math.abs(actual.velocity - sample.velocity),
          `${name} ${sample.timeMs} velocity`,
        ).toBeLessThan(0.002);
      }
      expect(trace.settledAtMs).toBe(item.settledAtMs);
      const finalTarget = trace.inputs.changes.at(-1)!.target;
      const settled = trace.samples.find(
        sample =>
          sample.timeMs >= trace.inputs.changes.at(-1)!.timeMs &&
          trace.samples
            .filter(item => item.timeMs >= sample.timeMs)
            .every(
              item =>
                Math.abs(item.position - finalTarget) <=
                  trace.inputs.settling.position &&
                Math.abs(item.velocity) <= trace.inputs.settling.velocity,
            ),
      );
      expect(settled?.timeMs, name).toBe(trace.settledAtMs);
    }
  });

  it('rejects invalid spring inputs', () => {
    expect(() => sampleMaterial3Spring([0.8, 380], [], 0)).toThrow(RangeError);
    expect(() =>
      sampleMaterial3Spring([0.8, -1], [{timeMs: 0, target: 1}], 0),
    ).toThrow(RangeError);
  });
});
