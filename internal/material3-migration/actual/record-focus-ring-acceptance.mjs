// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Sole migration workbook and committed native FocusRing evidence. @output Scenario-specific CM-0023 acceptance rows through Artifact Tool. @position Disposable M3-GAP-011 workbook authoring; the workbook remains the only task database. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {workbook} from '../workbook.mjs';
import {sheets, table, write} from '../model.mjs';

const root = 'internal/material3-migration/actual/M3-GAP-011';
const spec = 'packages/material3/src/FocusRing/FocusRing.spec.md';
const component = 'packages/material3/src/FocusRing/FocusRing.tsx';
const unit = 'packages/material3/src/FocusRing/FocusRing.test.tsx';
const browser = 'packages/material3/scripts/check-focus-ring-browser.mjs';
const pixels = 'packages/material3/scripts/check-focus-ring-pixels.mjs';
const motion = 'packages/material3/scripts/check-focus-ring-motion.mjs';
const baseline = 'internal/material3-migration/sources/baseline/focus-compose-first.json';
const family = 'internal/material3-migration/sources/families/family-CM-0023.md';
const p = (...files) => files.join('; ');
const evidence = {
  'Type and variant': p(spec, unit, `${root}/focus-light-0260.png`, `${root}/web-outward-light-active.png`),
  'Properties and slots': p(spec, unit, 'packages/material3/src/FocusRing/FocusRing.doc.mjs'),
  'Parts and geometry': p(pixels, `${root}/focus-dark-0260.png`, `${root}/web-outward-dark-active.png`),
  'Color light': p(pixels, `${root}/focus-light-0260.png`, browser),
  'Color dark': p(pixels, `${root}/focus-dark-0260.png`, browser),
  'Shape spacing elevation': p(pixels, `${root}/web-outward-dark-active.png`, spec),
  Enabled: p(`${root}/focus-light-0000.png`, browser),
  'Focus visible': p(browser, pixels, `${root}/focus-light-0260.png`),
  Disabled: p(browser, component),
  'Pointer touch': p(browser, component),
  'Keyboard form': p(browser, 'packages/material3/fixtures/focus-ring.tsx'),
  Semantics: p(unit, browser, spec),
  'Contrast cues': p(browser, pixels),
  Transitions: p(motion, `${root}/native-focus.webm`, `${root}/motion-review.json`),
  'Enter exit interruption': p(motion, `${root}/focus-light-0120.png`, `${root}/focus-light-0160.png`),
  'Reduced motion': p(browser, `${root}/focus-light-reduced.png`, `${root}/focus-dark-reduced.png`),
  'Viewport and container': p(browser, pixels),
  'Zoom RTL overflow': p(browser, component),
  'Color and overrides': p(browser, component),
  'Layering and nesting': p(browser, component, spec),
  'Browser SSR performance': p(unit, browser, `${root}/performance.json`),
  'Docs and regression': p('packages/material3/README.md', 'packages/material3/src/FocusRing/FocusRing.doc.mjs', unit, browser, pixels),
  'Material token contract': p(component, browser, 'packages/material3/src/foundation.ts'),
  'Native dependency boundary': p('packages/material3/package.json', component, 'scripts/check-package-boundaries.js'),
  'Material API and defaults': p(spec, unit, browser, baseline),
  'Compatibility direction': p(spec, 'packages/themes/material3/material3.spec.md', 'packages/material3/README.md'),
  'Native consumer preview': p('packages/material3/gallery/index.html', 'packages/material3/scripts/check-gallery.mjs', 'apps/storybook/stories/Material3FocusRing.stories.tsx', 'apps/docsite/src/app/(site)/material3/foundations/page.tsx'),
  'Compose source precedence': p(baseline, family, spec),
  'Pixel comparison': p(`${root}/focus-light-0260.png`, `${root}/web-outward-dark-active.png`, 'internal/material3-migration/actual/capture-native-focus-ring.mjs'),
  'Motion evidence': p(`${root}/motion-review.json`, `${root}/inspection/contact-sheet.png`, motion),
  'Compose behavior and tests': p(baseline, pixels, browser, motion),
  'Native response and frame pacing': p(`${root}/performance.json`, 'internal/material3-migration/actual/record-native-focus-ring.mjs'),
};
const notApplicable = {
  'Touch target': 'The ring is decorative and pointer-events none; the semantic control owns target size and activation.',
  Typography: 'The decorative ring renders no text; typography belongs to its semantic control.',
  Hover: 'The pinned focus indication has no hover state; hover remains with the semantic control.',
  Pressed: 'Native Ripple and the control own pressed treatment; FocusRing follows focus only.',
  'Selected checked': 'The associated semantic control owns selection and checked state; FocusRing follows focus only.',
  'Invalid error': 'The primitive owns no value or validation state; its control owns error presentation.',
  Loading: 'The primitive owns no pending operation; its control owns loading feedback.',
  'Read only': 'Read-only semantics belong to the associated control; FocusRing reflects eligible focus.',
  'Open closed dragged': 'The primitive owns no disclosure or drag state; these remain with the associated control.',
  'Extremes and locale': 'FocusRing accepts no textual children; its control owns long and localized labels.',
};
const detail = {
  'Type and variant': 'Required inset and explicitly selected outward placements cover standard and Expressive source states.',
  'Parts and geometry': 'Two inset strokes and the outward outline match pinned DPR 1 geometry.',
  'Shape spacing elevation': 'Insets, stroke widths, outward offset and full corner match; the ring has no elevation.',
  'Pointer touch': 'Mouse, touch and pen pointerdown suppress focus paint; keyboard return restores it.',
  Semantics: 'Server markup hydrates; the ring remains aria-hidden, unfocusable and role-free while its control retains semantics.',
  'Contrast cues': 'Material two-stroke geometry persists with supported roles and forced-colors system colors.',
  Transitions: 'Compose fast spatial/effects traces and the selected Web outward pulse are checked.',
  'Enter exit interruption': 'Timed enter, blur, interrupted refocus, reversal and settlement match source traces.',
  'Reduced motion': 'The browser preference paints final geometry without spring travel.',
  'Viewport and container': 'Desktop source and narrow 320 px checks retain owner geometry; no component breakpoint exists.',
  'Zoom RTL overflow': 'Inset stays aligned at 200% zoom and RTL; clipped outward owners are diagnosed and withheld.',
  'Layering and nesting': 'The direct owner paints; the ring cannot intercept input and outward clipping is rejected.',
  'Browser SSR performance': 'Hydration, Chrome interaction and the approved 30-input/360-frame performance profile pass.',
  'Compatibility direction': 'No legacy FocusRing export exists; native ownership and the separate Core bridge remain intact.',
  'Native consumer preview': 'The gallery renders the native fixture; Storybook and docsite expose that gallery with build revision.',
  'Compose source precedence': 'Compose governs default/inset design and motion; Web fills the recorded outward and browser-semantic gaps.',
  'Pixel comparison': 'Twenty-six full scenarios and eight static crops have zero changed RGBA pixels with no tolerance.',
  'Motion evidence': 'The owner watched pinned and native clips at normal speed; frames, interruption and reduced motion are retained.',
  'Compose behavior and tests': 'Three inset upstream cases map to permanent browser assertions; two default opacity cases remain with Ripple.',
  'Native response and frame pacing': 'The recorded Chrome/macOS profile has 30 input and 360 active-frame samples within approved limits.',
};

const result = await workbook(process.env.M3_WORKBOOK, true, async wb => {
  const mapping = table(wb, sheets.components).find(row => row['Map ID'] === 'CM-0023');
  const acceptance = table(wb, sheets.checks).filter(row => row['Map ID'] === 'CM-0023');
  if (!mapping || acceptance.length !== 42 || Object.keys(evidence).length + Object.keys(notApplicable).length !== 42)
    throw new Error('Unexpected FocusRing acceptance scope');
  const updates = [];
  for (const row of acceptance) {
    const applicable = evidence[row.Scenario];
    const reason = notApplicable[row.Scenario];
    if ((!applicable && !reason) || (applicable && reason)) throw new Error(`Unresolved ${row.Scenario}`);
    for (const file of (applicable || '').split(';').map(item => item.trim()).filter(Boolean))
      if (!(await fs.stat(path.join(process.cwd(), file))).isFile()) throw new Error(`Missing ${file}`);
    updates.push({row: row._row, fields: {
      'Astryx candidate': 'FocusRing',
      'Applicable?': applicable ? 'Required' : 'N/A',
      Result: applicable ? 'Pass' : 'N/A',
      Evidence: applicable || '',
      'Notes / N/A reason': applicable ? (detail[row.Scenario] || `Native FocusRing evidence directly verifies ${row.Scenario.toLowerCase()}.`) : reason,
      Gate: 'Ready',
    }});
  }
  const sheet = wb.worksheets.getItem(sheets.checks);
  const headers = sheet.getUsedRange().getRow(0).values[0];
  const groups = [];
  for (const update of updates.sort((a, b) => a.row - b.row)) {
    const last = groups.at(-1);
    if (last && last.at(-1).row + 1 === update.row) last.push(update);
    else groups.push([update]);
  }
  for (const group of groups)
    for (const key of Object.keys(group[0].fields)) {
      const column = headers.indexOf(key);
      if (column < 0) throw new Error(`Missing acceptance column ${key}`);
      sheet.getRangeByIndexes(group[0].row - 1, column, group.length, 1).values =
        group.map(update => [update.fields[key]]);
    }
  const required = Object.keys(evidence).length;
  write(wb, sheets.components, mapping._row, {
    'Astryx candidate': 'Native FocusRing',
    Package: '@astryxdesign/material3',
    Relationship: 'Confirmed',
    'Work status': 'Verified',
    'Required checks': required,
    'Passed checks': required,
    'Astryx source': component,
    'Astryx docs': 'packages/material3/README.md; packages/material3/src/FocusRing/FocusRing.doc.mjs',
    'Token filter': '',
    'Token IDs': 'TM-01708, TM-01725',
    'Token gate': 'Pass',
    'Token evidence': p(browser, component),
    'Native export': '@astryxdesign/material3/FocusRing',
    'Native source': component,
    'Native QA': 'Pending',
  });
  return {changed: true, data: {mapping: mapping['Map ID'], acceptance: acceptance.length, required, groups: groups.length}};
});
process.stderr.write(`${JSON.stringify(result.data)}\n`);
