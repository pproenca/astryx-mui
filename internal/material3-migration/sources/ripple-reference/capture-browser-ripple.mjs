// Copyright (c) Meta Platforms, Inc. and affiliates.
// Ripple source equations: Copyright The Android Open Source Project, Apache-2.0.

/**
 * @input Pinned Compose Ripple manifests, approved source limits and system Chrome.
 * @output Independent, limit-checked browser interpolation for press and state-layer motion.
 * @position Disposable source measurement before native Ripple implementation.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const policy = await read(
  path.join(repo, 'internal/material3-migration/policy.json'),
);
const press = await read(path.join(here, 'manifest.json'));
const state = await read(path.join(here, 'state-motion-manifest.json'));
const baseline = await read(
  path.join(here, '../baseline/ripple-compose-first.json'),
);
if (
  press.composeCommit !== policy.androidxCommit ||
  state.composeCommit !== policy.androidxCommit ||
  baseline.compose.commit !== policy.androidxCommit ||
  baseline.authority !== 'compose-first'
)
  throw new Error('Pinned Ripple source revision changed');
const traces = baseline.motion.numeric.traces;
const pressLimits = traces.find(
  trace => trace.id === 'compose-ripple-source-values',
);
const stateLimits = traces.find(
  trace => trace.id === 'compose-ripple-state-layer',
);
if (
  traces.length !== 2 ||
  !pressLimits?.approvalReference ||
  !stateLimits?.approvalReference ||
  pressLimits.browserComparison !==
    'internal/material3-migration/sources/ripple-reference/browser-ripple-motion.json' ||
  stateLimits.browserComparison !== pressLimits.browserComparison
)
  throw new Error('Ripple interpolation limits need the approved baseline');
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check'))
  throw new Error('Usage: node capture-browser-ripple.mjs [--check]');

const browser = await chromium.launch({channel: 'chrome', headless: true});
try {
  if (`Chrome ${browser.version()}` !== press.browser)
    throw new Error(`Chrome source environment changed: ${browser.version()}`);
  const page = await browser.newPage();
  const actual = await page.evaluate(
    ({press, state}) => {
      document.body.innerHTML = '<div id="root"></div>';
      const root = document.getElementById('root');
      const motion = (node, frames, duration, easing = 'linear') => {
        const animation = node.animate(frames, {
          duration,
          easing,
          fill: 'both',
        });
        animation.pause();
        return animation;
      };
      const at = (animation, elapsed) => {
        animation.currentTime = Math.max(
          0,
          Math.min(elapsed, animation.effect.getTiming().duration),
        );
      };
      const traces = [];
      const values = press.sourceValues;
      const startRadius = values.startRadius;
      const center = {
        x: values.size.width / 2,
        y: values.size.height / 2,
      };
      for (const bounded of [true, false]) {
        const endRadius = bounded
          ? values.boundedEndRadius
          : values.unboundedEndRadius;
        for (const [index, item] of values.presses.entries()) {
          const origin = bounded ? item.origin : center;
          const moving = document.createElement('div');
          const growing = document.createElement('div');
          const fading = document.createElement('div');
          moving.append(growing);
          growing.append(fading);
          root.append(moving);
          const position = motion(
            moving,
            [
              {transform: `translate(${origin.x}px, ${origin.y}px)`},
              {transform: `translate(${center.x}px, ${center.y}px)`},
            ],
            values.radiusAndCenterMs,
          );
          const radius = motion(
            growing,
            [
              {transform: 'scale(1)'},
              {transform: `scale(${endRadius / startRadius})`},
            ],
            values.radiusAndCenterMs,
            `cubic-bezier(${values.radiusEasing.join(', ')})`,
          );
          const entry = motion(
            fading,
            [{opacity: 0}, {opacity: 1}],
            values.fadeInMs,
          );
          const exitNode = document.createElement('div');
          root.append(exitNode);
          const exit = motion(
            exitNode,
            [{opacity: 1}, {opacity: 0}],
            values.fadeOutMs,
          );
          const fadeOutStart = Math.max(
            item.finishMs,
            item.startMs + values.radiusAndCenterMs,
          );
          const samples = [];
          for (
            let timeMs = item.startMs;
            timeMs <= fadeOutStart + values.fadeOutMs;
            timeMs += 5
          ) {
            const elapsed = timeMs - item.startMs;
            at(position, elapsed);
            at(radius, elapsed);
            const centerMatrix = new DOMMatrixReadOnly(
              getComputedStyle(moving).transform,
            );
            const radiusMatrix = new DOMMatrixReadOnly(
              getComputedStyle(growing).transform,
            );
            let alpha;
            if (timeMs >= fadeOutStart) {
              at(exit, timeMs - fadeOutStart);
              alpha = Number(getComputedStyle(exit.effect.target).opacity);
            } else if (timeMs >= item.finishMs) {
              alpha = 1;
            } else {
              at(entry, elapsed);
              alpha = Number(getComputedStyle(fading).opacity);
            }
            samples.push({
              timeMs,
              alpha,
              radius: startRadius * radiusMatrix.a,
              x: centerMatrix.e,
              y: centerMatrix.f,
            });
          }
          traces.push({bounded, press: index, samples});
          moving.remove();
          position.cancel();
          radius.cancel();
          entry.cancel();
          exit.cancel();
          exitNode.remove();
        }
      }

      const layer = document.createElement('div');
      root.append(layer);
      layer.style.opacity = '0';
      let currentAnimation = null;
      let eventStart = 0;
      let eventIndex = 0;
      const stateSamples = [];
      for (let timeMs = 0; timeMs <= 970; timeMs += 5) {
        if (currentAnimation) at(currentAnimation, timeMs - eventStart);
        if (
          eventIndex < state.sourceValues.events.length &&
          state.sourceValues.events[eventIndex].timeMs === timeMs
        ) {
          const event = state.sourceValues.events[eventIndex++];
          const from = Number(getComputedStyle(layer).opacity);
          currentAnimation?.cancel();
          layer.style.opacity = String(from);
          const to = state.sourceValues.opacity[event.state] ?? 0;
          currentAnimation = motion(
            layer,
            [{opacity: from}, {opacity: to}],
            event.durationMs,
          );
          eventStart = timeMs;
          at(currentAnimation, 0);
        }
        stateSamples.push({
          timeMs,
          alpha: Number(getComputedStyle(layer).opacity),
        });
      }
      currentAnimation?.cancel();
      layer.remove();
      return {press: traces, state: stateSamples};
    },
    {press, state},
  );

  // Evaluate the pinned equations independently of Chrome's animation engine.
  const cubic = (p1, p2, t) =>
    3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;
  function eased(fraction) {
    if (fraction <= 0) return 0;
    if (fraction >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let step = 0; step < 48; step++) {
      const mid = (lo + hi) / 2;
      if (cubic(0.4, 0.2, mid) < fraction) lo = mid;
      else hi = mid;
    }
    return cubic(0, 1, (lo + hi) / 2);
  }
  const values = press.sourceValues;
  const center = {x: values.size.width / 2, y: values.size.height / 2};
  const expectedPress = (item, bounded, timeMs) => {
    const elapsed = timeMs - item.startMs;
    const progress = Math.min(elapsed / values.radiusAndCenterMs, 1);
    const origin = bounded ? item.origin : center;
    const endRadius = bounded
      ? values.boundedEndRadius
      : values.unboundedEndRadius;
    const fadeOutStart = Math.max(
      item.finishMs,
      item.startMs + values.radiusAndCenterMs,
    );
    return {
      alpha:
        timeMs >= fadeOutStart
          ? 1 - (timeMs - fadeOutStart) / values.fadeOutMs
          : timeMs >= item.finishMs
            ? 1
            : Math.min(elapsed / values.fadeInMs, 1),
      radius:
        values.startRadius + (endRadius - values.startRadius) * eased(progress),
      x: origin.x + (center.x - origin.x) * progress,
      y: origin.y + (center.y - origin.y) * progress,
    };
  };
  const expectedState = timeMs => {
    let from = 0;
    let target = 0;
    let started = 0;
    let duration = 0;
    for (const event of state.sourceValues.events) {
      if (event.timeMs > timeMs) break;
      from +=
        (target - from) *
        Math.min((event.timeMs - started) / (duration || 1), 1);
      target = state.sourceValues.opacity[event.state] ?? 0;
      started = event.timeMs;
      duration = event.durationMs;
    }
    return (
      from + (target - from) * Math.min((timeMs - started) / (duration || 1), 1)
    );
  };
  const max = values => Math.max(...values);
  const pressErrors = {
    alpha: 0,
    radiusPx: 0,
    centerPx: 0,
    alphaPerSecond: 0,
    pxPerSecond: 0,
  };
  let pressSamples = 0;
  const pressSettled = [];
  for (const trace of actual.press) {
    const item = values.presses[trace.press];
    const fadeOutStart = Math.max(
      item.finishMs,
      item.startMs + values.radiusAndCenterMs,
    );
    const settled = trace.samples.find(
      sample => sample.timeMs >= fadeOutStart && sample.alpha <= 0.000001,
    )?.timeMs;
    if (settled !== fadeOutStart + values.fadeOutMs)
      throw new Error(
        `Browser press did not settle on source time: ${trace.press}`,
      );
    pressSettled.push(settled);
    const expected = trace.samples.map(sample =>
      expectedPress(item, trace.bounded, sample.timeMs),
    );
    pressSamples += trace.samples.length;
    trace.samples.forEach((sample, index) => {
      const source = expected[index];
      pressErrors.alpha = Math.max(
        pressErrors.alpha,
        Math.abs(sample.alpha - source.alpha),
      );
      pressErrors.radiusPx = Math.max(
        pressErrors.radiusPx,
        Math.abs(sample.radius - source.radius),
      );
      pressErrors.centerPx = Math.max(
        pressErrors.centerPx,
        Math.abs(sample.x - source.x),
        Math.abs(sample.y - source.y),
      );
      if (index === 0) return;
      const previous = trace.samples[index - 1];
      const before = expected[index - 1];
      const seconds = (sample.timeMs - previous.timeMs) / 1000;
      pressErrors.alphaPerSecond = Math.max(
        pressErrors.alphaPerSecond,
        Math.abs(
          (sample.alpha - previous.alpha - source.alpha + before.alpha) /
            seconds,
        ),
      );
      for (const key of ['radius', 'x', 'y']) {
        pressErrors.pxPerSecond = Math.max(
          pressErrors.pxPerSecond,
          Math.abs(
            (sample[key] - previous[key] - source[key] + before[key]) / seconds,
          ),
        );
      }
    });
  }
  const stateErrors = {alpha: 0, alphaPerSecond: 0};
  const stateFinal = state.sourceValues.events.at(-1);
  const stateSettled = actual.state.find(
    sample => sample.timeMs >= stateFinal.timeMs && sample.alpha <= 0.000001,
  )?.timeMs;
  if (stateSettled !== stateFinal.timeMs + stateFinal.durationMs)
    throw new Error('Browser state layer did not settle on source time');
  for (const [index, sample] of actual.state.entries()) {
    const source = expectedState(sample.timeMs);
    stateErrors.alpha = Math.max(
      stateErrors.alpha,
      Math.abs(sample.alpha - source),
    );
    if (index === 0) continue;
    const previous = actual.state[index - 1];
    stateErrors.alphaPerSecond = Math.max(
      stateErrors.alphaPerSecond,
      Math.abs(
        (sample.alpha -
          previous.alpha -
          source +
          expectedState(previous.timeMs)) /
          0.005,
      ),
    );
  }
  if (
    pressErrors.radiusPx > pressLimits.positionTolerance ||
    pressErrors.centerPx > pressLimits.positionTolerance ||
    pressErrors.pxPerSecond > pressLimits.velocityTolerance ||
    pressErrors.alpha > pressLimits.alphaTolerance ||
    pressErrors.alphaPerSecond > pressLimits.alphaVelocityTolerance ||
    Math.abs(
      max(pressSettled) -
        max(
          values.presses.map(
            item =>
              Math.max(item.finishMs, item.startMs + values.radiusAndCenterMs) +
              values.fadeOutMs,
          ),
        ),
    ) > pressLimits.settlingToleranceMs ||
    stateErrors.alpha > stateLimits.positionTolerance ||
    stateErrors.alphaPerSecond > stateLimits.velocityTolerance ||
    Math.abs(stateSettled - (stateFinal.timeMs + stateFinal.durationMs)) >
      stateLimits.settlingToleranceMs
  )
    throw new Error(
      'Chrome Ripple interpolation exceeds approved source limits',
    );
  const output = {
    schemaVersion: 1,
    producer: {
      kind: 'browser',
      command:
        'node internal/material3-migration/sources/ripple-reference/capture-browser-ripple.mjs',
      browser: `Chrome ${browser.version()}`,
      sampleStepMs: 5,
      method:
        'Web Animations API computed transforms and opacity versus pinned Compose equations',
    },
    source: {
      composeCommit: policy.androidxCommit,
      pressManifest:
        'internal/material3-migration/sources/ripple-reference/manifest.json',
      stateManifest:
        'internal/material3-migration/sources/ripple-reference/state-motion-manifest.json',
    },
    press: {
      traces: actual.press.length,
      samples: pressSamples,
      settledAtMs: max(pressSettled),
      errors: pressErrors,
    },
    state: {
      samples: actual.state.length,
      settledAtMs: stateSettled,
      errors: stateErrors,
    },
    representative: {
      press: actual.press.map(trace => ({
        bounded: trace.bounded,
        press: trace.press,
        samples: trace.samples.filter(sample =>
          press.frameTimes.includes(sample.timeMs),
        ),
      })),
      state: actual.state.filter(sample =>
        state.frameTimes.includes(sample.timeMs),
      ),
    },
  };
  const target = path.join(here, 'browser-ripple-motion.json');
  const bytes = `${JSON.stringify(output, null, 2)}\n`;
  if (check) {
    if ((await fs.readFile(target, 'utf8')) !== bytes)
      throw new Error('Browser Ripple motion comparison changed');
  } else await fs.writeFile(target, bytes);
  process.stdout.write(
    `press: ${pressSamples} samples; ${JSON.stringify(pressErrors)}\n` +
      `state: ${actual.state.length} samples; ${JSON.stringify(stateErrors)}\n`,
  );
} finally {
  await browser.close();
}
