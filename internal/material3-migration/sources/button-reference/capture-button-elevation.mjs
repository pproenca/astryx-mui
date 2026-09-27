// Copyright (c) Meta Platforms, Inc. and affiliates.
// Source specification: Copyright The Android Open Source Project, Apache-2.0.

/**
 * @input Pinned Compose Button elevation, easing, and generated token sources.
 * @output Source-value interruption trace and independent Chrome tween comparison.
 * @position Disposable Button source evidence before native implementation.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const policy = JSON.parse(
  await fs.readFile(
    path.join(repo, 'internal/material3-migration/policy.json'),
  ),
);
const androidx = process.env.M3_ANDROIDX;
if (!androidx)
  throw new Error('Set M3_ANDROIDX to the pinned AndroidX checkout');
if (
  execFileSync('git', ['-C', androidx, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim() !== policy.androidxCommit ||
  execFileSync('git', ['-C', androidx, 'status', '--porcelain'], {
    encoding: 'utf8',
  }).trim()
)
  throw new Error(
    'Pinned AndroidX checkout is not clean at the selected revision',
  );
if (process.argv.slice(2).some(arg => arg !== '--check'))
  throw new Error('Usage: node capture-button-elevation.mjs [--check]');
const check = process.argv.includes('--check');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const prefix =
  'compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/';
const files = {
  button: [
    prefix + 'Button.kt',
    '9095ad12e5b26a20bf0cdc53ba01f54b7c8ca41ba4ece933d578ef28a2d97240',
  ],
  elevation: [
    prefix + 'internal/Elevation.kt',
    '304e9d0d7749bf1a7a2646acd7f05a7d6f5c52fe0118fd8bbfd37fbd03d08f2f',
  ],
  easing: [
    'compose/animation/animation-core/src/commonMain/kotlin/androidx/compose/animation/core/Easing.kt',
    '4a00295b76f9dad81eccb3f9e36e7968bd05802a8b29451226954ecee831b755',
  ],
  levels: [
    prefix + 'tokens/ElevationTokens.kt',
    'b0613cc2c1e30fb62da126f82f5870f7231e3cf4117f36132e466e1827de0a3c',
  ],
  elevated: [
    prefix + 'tokens/ElevatedButtonTokens.kt',
    '4cff9fca4f66e2627d8845873b74b2bcf14eadc50d50fae918869cdbb7db6545',
  ],
  filled: [
    prefix + 'tokens/FilledButtonTokens.kt',
    '7612e40587f9fa987a817ddd9a89c424da4e5b91edbe850bd3812156c6ee9e33',
  ],
  tonal: [
    prefix + 'tokens/FilledTonalButtonTokens.kt',
    '9887aa0fa5ee457e33c1bb428a5ef27fd7e0ab6319186f42f2c103d15e36e2a7',
  ],
};
const source = {};
for (const [name, [relative, hash]] of Object.entries(files)) {
  const bytes = await fs.readFile(path.join(androidx, relative));
  if (sha256(bytes) !== hash)
    throw new Error(`Pinned source changed: ${relative}`);
  source[name] = bytes.toString('utf8');
}
const expected = [
  [
    source.elevation,
    /TweenSpec<Dp>\(durationMillis = 120, easing = FastOutSlowInEasing\)/,
  ],
  [
    source.elevation,
    /TweenSpec<Dp>\(durationMillis = 150, easing = OutgoingSpecEasing\)/,
  ],
  [
    source.elevation,
    /TweenSpec<Dp>\(durationMillis = 120, easing = OutgoingSpecEasing\)/,
  ],
  [source.elevation, /CubicBezierEasing\(0\.40f, 0\.00f, 0\.60f, 1\.00f\)/],
  [
    source.easing,
    /FastOutSlowInEasing: Easing = CubicBezierEasing\(0\.4f, 0\.0f, 0\.2f, 1\.0f\)/,
  ],
  [
    source.button,
    /if \(!enabled\) \{\s*\/\/ No transition when moving to a disabled state\s*animatable\.snapTo\(target\)/,
  ],
  [source.button, /val interaction = interactions\.lastOrNull\(\)/],
];
for (const [body, binding] of expected)
  if (!binding.test(body))
    throw new Error(`Pinned elevation binding changed: ${binding}`);

function level(name) {
  const match = source.levels.match(
    new RegExp(`inline val Level${name}:[\\s\\S]*?get\\(\\) = ([0-9.]+)\\.dp`),
  );
  if (!match) throw new Error(`Missing Compose level ${name}`);
  return Number(match[1]);
}
function token(file, name) {
  const match = source[file].match(
    new RegExp(
      `inline val ${name}:[\\s\\S]*?get\\(\\) = ElevationTokens\\.Level([0-5])`,
    ),
  );
  if (!match) throw new Error(`Missing Compose ${file}.${name}`);
  return level(match[1]);
}
const styles = {
  Elevated: {
    rest: token('elevated', 'ContainerElevation'),
    hover: token('elevated', 'HoveredContainerElevation'),
    press: token('elevated', 'PressedContainerElevation'),
    focus: token('elevated', 'FocusedContainerElevation'),
    disabled: token('elevated', 'DisabledContainerElevation'),
  },
  Filled: {
    rest: token('filled', 'ContainerElevation'),
    hover: token('filled', 'HoveredContainerElevation'),
    press: token('filled', 'PressedContainerElevation'),
    focus: token('filled', 'FocusedContainerElevation'),
    disabled: token('filled', 'DisabledContainerElevation'),
  },
  Tonal: {
    rest: token('tonal', 'ContainerElevation'),
    hover: token('tonal', 'HoverContainerElevation'),
    press: token('tonal', 'PressedContainerElevation'),
    focus: token('tonal', 'FocusContainerElevation'),
    disabled: 0,
  },
};
const changes = [
  {timeMs: 0, state: 'hover', transition: 'incoming'},
  {timeMs: 80, state: 'press', transition: 'incoming'},
  {timeMs: 140, state: 'hover', transition: 'incoming'},
  {timeMs: 220, state: 'rest', transition: 'hover-outgoing'},
  {timeMs: 240, state: 'hover', transition: 'incoming'},
  {timeMs: 360, state: 'rest', transition: 'hover-outgoing'},
  {timeMs: 500, state: 'disabled', transition: 'snap'},
  {timeMs: 580, state: 'rest', transition: 'snap'},
];
const specs = {
  incoming: {durationMs: 120, cubic: [0.4, 0, 0.2, 1]},
  'hover-outgoing': {durationMs: 120, cubic: [0.4, 0, 0.6, 1]},
  'press-outgoing': {durationMs: 150, cubic: [0.4, 0, 0.6, 1]},
};
// The pinned Button's interaction stack returns to hover when press is released.
// Separately retain the outgoing press specification for a press without hover.
const pressExit = {
  from: styles.Elevated.press,
  to: styles.Elevated.rest,
  spec: specs['press-outgoing'],
};
function cubic(fraction, [a, b, c, d]) {
  if (fraction <= 0 || fraction >= 1) return fraction;
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 60; iteration++) {
    const t = (low + high) / 2;
    const x = 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * c + t ** 3;
    if (x < fraction) low = t;
    else high = t;
  }
  const t = (low + high) / 2;
  return 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * d + t ** 3;
}
function valueAt(segment, timeMs) {
  if (!segment.spec) return segment.to;
  const fraction = Math.min(
    1,
    Math.max(0, (timeMs - segment.startMs) / segment.spec.durationMs),
  );
  return (
    segment.from +
    (segment.to - segment.from) * cubic(fraction, segment.spec.cubic)
  );
}
function sourceTrace(values) {
  const samples = [];
  let segment = {from: values.rest, to: values.rest, startMs: 0, spec: null};
  let nextChange = 0;
  for (let timeMs = 0; timeMs <= 720; timeMs += 20) {
    if (nextChange < changes.length && changes[nextChange].timeMs === timeMs) {
      const change = changes[nextChange++];
      const current = valueAt(segment, timeMs);
      const target = values[change.state];
      segment = {
        from: current,
        to: target,
        startMs: timeMs,
        spec:
          change.transition === 'snap' || current === target
            ? null
            : specs[change.transition],
      };
    }
    samples.push({timeMs, elevationDp: valueAt(segment, timeMs)});
  }
  return samples;
}
const traces = Object.fromEntries(
  Object.entries(styles).map(([name, values]) => [name, sourceTrace(values)]),
);
const reference = {
  schemaVersion: 1,
  producer: {
    kind: 'pinned-compose-source-specification',
    commit: policy.androidxCommit,
    command:
      'node internal/material3-migration/sources/button-reference/capture-button-elevation.mjs',
  },
  files,
  styles,
  specs,
  changes,
  pressExit,
  stepMs: 20,
  endMs: 720,
  traces,
};

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  const page = await browser.newPage();
  const actual = await page.evaluate(
    ({styles, specs, changes}) => {
      const element = document.createElement('div');
      document.body.append(element);
      const traces = {};
      for (const [name, values] of Object.entries(styles)) {
        const samples = [];
        let current = values.rest;
        let animation = null;
        let startMs = 0;
        let nextChange = 0;
        for (let timeMs = 0; timeMs <= 720; timeMs += 20) {
          if (animation) {
            animation.currentTime = timeMs - startMs;
            current = new DOMMatrixReadOnly(getComputedStyle(element).transform)
              .m41;
          }
          if (
            nextChange < changes.length &&
            changes[nextChange].timeMs === timeMs
          ) {
            const change = changes[nextChange++];
            if (animation) animation.cancel();
            element.style.transform = `translateX(${current}px)`;
            const target = values[change.state];
            const spec = specs[change.transition];
            if (spec && current !== target) {
              animation = element.animate(
                [
                  {transform: `translateX(${current}px)`},
                  {transform: `translateX(${target}px)`},
                ],
                {
                  duration: spec.durationMs,
                  easing: `cubic-bezier(${spec.cubic.join(',')})`,
                  fill: 'forwards',
                },
              );
              animation.pause();
              animation.currentTime = 0;
              startMs = timeMs;
            } else {
              animation = null;
              current = target;
              element.style.transform = `translateX(${target}px)`;
            }
          }
          if (animation) {
            animation.currentTime = timeMs - startMs;
            current = new DOMMatrixReadOnly(getComputedStyle(element).transform)
              .m41;
          }
          samples.push({timeMs, elevationDp: current});
        }
        traces[name] = samples;
        if (animation) animation.cancel();
      }
      element.remove();
      return traces;
    },
    {styles, specs, changes},
  );
  const errors = Object.fromEntries(
    Object.keys(styles).map(name => [
      name,
      Math.max(
        ...traces[name].map((sample, index) =>
          Math.abs(sample.elevationDp - actual[name][index].elevationDp),
        ),
      ),
    ]),
  );
  if (Object.values(errors).some(error => error > 0.00001))
    throw new Error(
      `Browser tween differs from pinned source reconstruction: ${JSON.stringify(errors)}`,
    );
  const output = {
    ...reference,
    browser: `Chrome ${browser.version()}`,
    browserErrorsDp: errors,
  };
  const bytes = `${JSON.stringify(output, null, 2)}\n`;
  const target = path.join(here, 'button-elevation-motion.json');
  if (check) {
    if ((await fs.readFile(target, 'utf8')) !== bytes)
      throw new Error('Button elevation source trace changed');
  } else await fs.writeFile(target, bytes);
  console.log(
    JSON.stringify({
      samplesPerStyle: traces.Elevated.length,
      errors,
      browser: output.browser,
    }),
  );
} finally {
  await browser.close();
}
