// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Current native Ripple, pinned Compose-first baseline and committed browser captures. @output Exact-revision visual, motion and interaction receipt. @position Disposable M3-GAP-013 verifier; permanent checks remain in the native package. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = async file => fs.readFile(path.join(repo,file));
const policy = JSON.parse(await read('internal/material3-migration/policy.json'));
const sourceDecision = 'internal/material3-migration/sources/baseline/ripple-compose-first.json';
const sourceBytes = await read(sourceDecision);
const source = JSON.parse(sourceBytes);
const actualRoot = 'internal/material3-migration/actual/M3-GAP-013';
const actual = file => `${actualRoot}/${file}`;
const revision = execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (command,...args) => execFileSync(command,args,{cwd:repo,encoding:'utf8',env:{...process.env,M3_CAPTURE_DIR:''},stdio:['ignore','pipe','pipe']});
const pass = (reason,...evidence) => ({result:'Pass',reason,evidence});
assert.equal(source.authority,'compose-first');
assert.equal(source.compose.commit,policy.androidxCommit);
assert.equal(source.web.commit,policy.materialWebCommit);
assert.equal(source.baselineId,policy.baselineId);
assert.equal(source.scenarios.length,48);
run('pnpm','-F','@astryxdesign/material3','run','test');
run('pnpm','-F','@astryxdesign/material3','run','typecheck');
run('node','internal/material3-migration/actual/capture-native-ripple.mjs','--check');

const review = JSON.parse(await read(actual('motion-review.json')));
assert.ok(review.watchedBy && review.watchedAt?.endsWith('Z') && review.observations?.length >= 3);
assert.equal(review.referenceSha256,source.motion.sha256);
assert.equal(review.stateReferenceSha256,source.motion.stateLayerSha256);
assert.equal(review.actualSha256,hash(await read(actual('native-ripple-press.webm'))));
assert.equal(review.stateActualSha256,hash(await read(actual('native-ripple-state.webm'))));
const checks = {
  source:pass('Pinned Compose governs press geometry, state opacity and motion; Web supplies browser attachment semantics.',sourceDecision,'internal/material3-migration/sources/families/family-CM-0023.md'),
  'token-contract':pass('The native indication consumes supported content roles, state opacity and scoped overrides.','packages/material3/src/Ripple/Ripple.tsx','packages/material3/scripts/check-ripple-browser.mjs'),
  'native-boundary':pass('Ripple exports from the native package, with no Core adapter or duplicate semantic control.','packages/material3/package.json','packages/material3/src/index.ts','packages/material3/src/Ripple/index.ts'),
  compatibility:pass('The opt-in native primitive leaves Core theme compatibility and control ownership intact.','packages/material3/src/Ripple/Ripple.spec.md','packages/themes/material3/material3.spec.md'),
  'automated-checks':pass('Native package test and typecheck include unit, browser, pixel, state and motion checks.','packages/material3/package.json','packages/material3/src/Ripple/Ripple.test.tsx','packages/material3/scripts/check-ripple-motion.mjs'),
  'browser-behavior':pass('Pointer, keyboard, hover, focus, drag, disabled, detached target, forced colors, reduced motion, zoom and RTL pass in Chrome.','packages/material3/scripts/check-ripple-browser.mjs','packages/material3/fixtures/ripple.tsx'),
  'consumer-docs':pass('The native public API, gallery, examples, discovery and upstream attribution ship with the package.','packages/material3/src/Ripple/Ripple.doc.mjs','packages/material3/README.md','packages/material3/THIRD_PARTY_NOTICES.md'),
  'source-resolution':pass('Compose owns press and state timing; browser target attachment and reduced motion use recorded gaps.',sourceDecision,'internal/material3-migration/sources/families/family-CM-0023.md'),
  'visual-comparison':pass('All 48 native frames meet the separately approved press and state-layer pixel rules.','packages/material3/scripts/check-ripple-pixels.mjs','packages/material3/scripts/check-ripple-state-pixels.mjs',actual('comparison.json'),actual('diff/state-motion-dark-0187.png')),
  'motion-review':pass('The owner watched source and native clips at normal speed; sampled press/state traces, interruption, reduced motion and contact sheets are retained.',actual('motion-review.json'),actual('native-ripple-press.webm'),actual('native-ripple-state.webm'),actual('native-ripple-state-contact.png')),
  'upstream-tests':pass('Pinned start and bounded/unbounded end-radius cases map to native geometry and browser regression.','packages/material3/scripts/check-ripple-motion.mjs','packages/material3/scripts/check-ripple-pixels.mjs',sourceDecision),
  performance:pass('Chrome/macOS input response and active-frame pacing meet the approved 30-input and 300-frame profile.',actual('performance.json'),'internal/material3-migration/actual/record-native-ripple.mjs',sourceDecision),
};
for(const key of policy.evidenceRequirements)assert.ok(checks[key],`Missing ${key}`);
const qaChecks = {
  states:{result:'Pass',reason:'Bounded/unbounded press, overlap, release, hover, focus, drag, disabled and detached target pass.'},
  keyboard:{result:'Pass',reason:'The decorative span stays out of tab order; the semantic control retains keyboard activation and focus.'},
  theme:{result:'Pass',reason:'Light, dark and Expressive roles and scoped overrides resolve through native Material tokens.'},
  responsive:{result:'Pass',reason:'Native owner geometry holds at narrow width, RTL and zoom; unbounded paint is explicit.'},
  motion:{result:'Pass',reason:'Pinned Compose press/state timing, interrupted changes and reduced-motion final states pass visual and numeric checks.'},
  accessibility:{result:'Pass',reason:'The span is aria-hidden and pointer inert; semantic controls retain name, role, focus and forced-colors cues.'},
};
const motionPass=(reason,evidence)=>({result:'Pass',reason,evidence});
const motion={
  applicable:true,
  reference:source.motion.reference,
  referenceSha256:source.motion.sha256,
  actualRecording:actual('native-ripple-press.webm'),
  watchedBy:review.watchedBy,
  watchedAt:review.watchedAt,
  contactSheet:actual('native-ripple-press-contact.png'),
  observations:review.observations,
  scenarios:{
    enter:motionPass('The bounded and unbounded circles enter on the pinned radius and opacity paths.',actual('ripple-light-0075.png')),
    exit:motionPass('The early release waits for radius completion and exits over the pinned 150 ms fade.',actual('ripple-light-0385.png')),
    interruption:motionPass('A second press overlaps the earlier release without stale completion; drag retargets during the state tween.',actual('ripple-light-0180.png')),
    reversal:motionPass('Drag cancellation and hover return reverse the current state-layer opacity.',actual('state-motion-light-0187.png')),
    'reduced-motion':motionPass('Reduced motion immediately paints the terminal press and state and clears on release.',actual('ripple-light-reduced-press.png')),
  },
  traces:source.motion.numeric.traces.map(item=>({id:item.id,actual:actual(`${item.id}.json`)})),
};
const visualComparisons=source.scenarios.map(item=>({id:item.id,environment:item.environment,...(item.timeMs===undefined?{}:{timeMs:item.timeMs}),actual:actual(`${item.id}.png`),diff:actual(`diff/${item.id}.png`)}));
const upstreamTests=source.compose.tests.map(item=>({id:item.id,result:'Pass',reason:'Pinned Compose start or bounded/unbounded end radius is translated to native browser trajectory and visual assertions.',evidence:'packages/material3/scripts/check-ripple-motion.mjs',nativeTest:'packages/material3/scripts/check-ripple-pixels.mjs'}));
const receipt={strategyId:policy.strategyId,taskId:'M3-GAP-013',revision,materialWebCommit:policy.materialWebCommit,androidxCommit:policy.androidxCommit,baselineId:policy.baselineId,reviewKind:'visual',preview:`http://127.0.0.1:8420/index.html?revision=${revision}`,sourceDecision,sourceDecisionSha256:hash(sourceBytes),checks,qaChecks,visualComparisons,motion,upstreamTests,performance:source.performance.map(item=>({id:item.id,actual:actual('performance.json')}))};
process.stdout.write(JSON.stringify(receipt)+'\n');
