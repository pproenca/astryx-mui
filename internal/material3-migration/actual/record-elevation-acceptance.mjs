// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Sole migration workbook and committed Elevation evidence. @output CM-0018 acceptance and six Compose token mappings through Artifact Tool. @position Disposable M3-GAP-006 workbook authoring; the workbook remains the only task database. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {workbook} from '../workbook.mjs';
import {sheets, table, write} from '../model.mjs';
import {tokenReady} from '../token-completion.mjs';

const root = 'internal/material3-migration/actual/M3-GAP-006';
const component = 'packages/material3/src/Elevation/Elevation.tsx';
const spec = 'packages/material3/src/Elevation/Elevation.spec.md';
const unit = 'packages/material3/src/Elevation/Elevation.test.tsx';
const pixels = 'packages/material3/scripts/check-elevation-pixels.mjs';
const matrix = 'packages/material3/scripts/check-elevation-native-baseline.mjs';
const gallery = 'packages/material3/scripts/check-gallery.mjs';
const baseline =
  'internal/material3-migration/sources/baseline/elevation-compose-first.json';
const family =
  'internal/material3-migration/sources/families/family-CM-0018.md';
const foundation = 'packages/material3/src/foundationSource.json';
const p = (...files) => files.join('; ');
const evidence = {
  'Type and variant': p(
    spec,
    unit,
    `${root}/elevation-light.png`,
    `${root}/elevation-dark.png`,
  ),
  'Properties and slots': p(
    spec,
    unit,
    'packages/material3/src/Elevation/Elevation.doc.mjs',
  ),
  'Parts and geometry': p(matrix, pixels, `${root}/diff/elevation-light.png`),
  'Color light': p(matrix, pixels, `${root}/elevation-light.png`),
  'Color dark': p(matrix, pixels, `${root}/elevation-dark.png`),
  'Shape spacing elevation': p(foundation, component, matrix),
  Enabled: p(unit, pixels),
  'Pointer touch': p(component, pixels),
  'Keyboard form': p(unit, pixels),
  Semantics: p(component, unit, pixels),
  'Contrast cues': p(
    pixels,
    `${root}/elevation-light.png`,
    `${root}/elevation-dark.png`,
  ),
  'Viewport and container': p(gallery, pixels),
  'Zoom RTL overflow': p(pixels, component),
  'Color and overrides': p(pixels, component, foundation),
  'Layering and nesting': p(component, pixels, spec),
  'Browser SSR performance': p(unit, pixels, `${root}/performance.json`),
  'Docs and regression': p(
    'packages/material3/README.md',
    'packages/material3/src/Elevation/Elevation.doc.mjs',
    unit,
    matrix,
    pixels,
  ),
  'Material token contract': p(component, foundation, pixels),
  'Native dependency boundary': p(
    'packages/material3/package.json',
    component,
    'scripts/check-package-boundaries.js',
  ),
  'Material API and defaults': p(spec, unit, baseline),
  'Compatibility direction': p(
    spec,
    'packages/themes/material3/material3.spec.md',
    'packages/material3/README.md',
  ),
  'Native consumer preview': p(
    'packages/material3/gallery/index.html',
    gallery,
    'apps/storybook/stories/Material3NativeElevation.stories.tsx',
  ),
  'Compose source precedence': p(baseline, family, spec),
  'Pixel comparison': p(
    matrix,
    pixels,
    `${root}/elevation-light.png`,
    `${root}/diff/elevation-light.png`,
    `${root}/elevation-dark.png`,
    `${root}/diff/elevation-dark.png`,
  ),
  'Motion evidence': p(baseline, family, component),
  'Compose behavior and tests': p(
    baseline,
    'packages/material3/src/foundation.test.ts',
    matrix,
  ),
  'Native response and frame pacing': p(
    `${root}/performance.json`,
    'internal/material3-migration/actual/capture-native-elevation-performance.mjs',
  ),
};
const notApplicable = {
  'Touch target':
    'Elevation is pointer inert; its visual owner defines target size and activation.',
  Typography:
    'The decorative shadow renders no text; its visual owner controls typography.',
  Hover:
    'Pinned standalone shadow elevation has no hover behavior; controls own hover state.',
  'Focus visible':
    'Elevation has no focus target or focus paint; the semantic control owns focus indication.',
  Pressed:
    'Elevation owns no press state; a future native control selects its level.',
  'Selected checked':
    'Elevation owns no selection or checked state; the semantic control owns those states.',
  Disabled:
    'Elevation owns no disabled state; the semantic control selects or suppresses its shadow.',
  'Invalid error':
    'Elevation owns no value or validation state; the semantic control presents errors.',
  Loading:
    'Elevation owns no pending operation; the semantic control presents loading feedback.',
  'Read only':
    'Elevation owns no value or read-only semantics; the semantic control owns them.',
  'Open closed dragged':
    'Elevation owns no disclosure or drag state; its owner selects a level when needed.',
  Transitions:
    'The pinned source has no standalone Elevation motion; its owner controls transitions.',
  'Enter exit interruption':
    'No standalone Compose Elevation enter, exit, interruption or reversal sequence exists.',
  'Reduced motion':
    'Elevation is static at every level; its owner controls motion and reduced-motion behavior.',
  'Extremes and locale':
    'Elevation renders no label or content; its owner handles locale and content extremes.',
};
const detail = {
  'Type and variant':
    'All six pinned levels render in light and dark; Expressive uses the same native shadow graph with its scoped color role.',
  'Parts and geometry':
    'Independent key and ambient layers match frozen source geometry and opacity.',
  'Shape spacing elevation':
    'Compose levels 0, 1, 3, 6, 8 and 12 dp map to canonical foundation values; inherited radius follows the owner.',
  Enabled: 'Every level paints without event listeners or semantic state.',
  'Pointer touch':
    'The shadow is pointer inert; pointer activation remains on the owner.',
  'Keyboard form':
    'The decorative span stays out of tab order; Enter activation remains on its button owner.',
  Semantics:
    'The shadow is aria-hidden, role-free and unfocusable; owner semantics are retained.',
  'Contrast cues':
    'Both shadow layers use the scoped Material shadow role; forced colors suppress the decorative shadow.',
  'Viewport and container':
    'The native gallery retains six-level layout at desktop and narrow widths.',
  'Zoom RTL overflow':
    'The shadow stays attached to its owner at 200% zoom and in RTL.',
  'Color and overrides':
    'Scoped --md-sys-color-shadow overrides reach both key and ambient layers.',
  'Layering and nesting':
    'The component is a direct visual child, occupies no flow and adds no z-index or tonal surface.',
  'Browser SSR performance':
    'SSR/unit checks and 30 input plus 360 active frame measurements meet the approved browser profile.',
  'Material token contract':
    'Six Compose source levels and the native Material shadow role are consumed without a parallel value map.',
  'Native dependency boundary':
    'The public package export has no Core or theme-bridge dependency.',
  'Material API and defaults':
    'Owner-approved opt-in level 0 default and levels 0–5 match the pinned Compose source route.',
  'Compatibility direction':
    'The additive native primitive leaves existing Core and theme compatibility surfaces intact.',
  'Native consumer preview':
    'The native package gallery and Storybook expose the exact-revision component and source comparison.',
  'Compose source precedence':
    'Compose governs six levels and tonal separation; Figma fills CSS shadow geometry and Web supplies inert browser attachment.',
  'Pixel comparison':
    'Twelve light/dark level matrices and 24 additional themed crops compare with zero changed RGBA pixels.',
  'Motion evidence':
    'Pinned standalone Elevation is static; no watched-motion sequence applies, as documented in the source baseline.',
  'Compose behavior and tests':
    'Six pinned Surface cases map to permanent foundation and native static-shadow checks.',
  'Native response and frame pacing':
    'Thirty level-change responses and 360 shadow-color frames meet approved Chrome/macOS budgets.',
};

const source = JSON.parse(await fs.readFile(foundation));
const result = await workbook(process.env.M3_WORKBOOK, true, async wb => {
  const mapping = table(wb, sheets.components).find(
    row => row['Map ID'] === 'CM-0018',
  );
  const acceptance = table(wb, sheets.checks).filter(
    row => row['Map ID'] === 'CM-0018',
  );
  assert.ok(mapping);
  assert.equal(acceptance.length, 42);
  assert.equal(
    Object.keys(evidence).length + Object.keys(notApplicable).length,
    42,
  );
  for (let level = 0; level <= 5; level++) {
    const id = `TM-${String(2878 + level).padStart(5, '0')}`;
    const row = table(wb, sheets.tokens).find(item => item['Map ID'] === id);
    assert.ok(row, id);
    assert.equal(
      row['Material token'],
      `compose:ElevationTokens.Level${level}`,
    );
    const dp = [0, 1, 3, 6, 8, 12][level];
    assert.equal(source.elevation.levels[level].dp, dp);
    const fields = {
      'Astryx candidate': `material3ElevationLevels[${level}].dp (${dp})`,
      Relationship: 'Confirmed',
      Verification: 'Pass',
      Evidence: p(
        foundation,
        'packages/material3/src/foundation.ts',
        'packages/material3/src/foundation.test.ts',
        matrix,
      ),
      'Astryx source': p(foundation, 'packages/material3/src/foundation.ts'),
      Note: `${row.Note}\nNative Elevation consumes pinned Compose level ${level} through the canonical foundation graph; foundation and exact browser shadow checks verify the selected value.`,
    };
    assert.equal(tokenReady({...row, ...fields}, 'material3-native-v4'), true);
    write(wb, sheets.tokens, row._row, fields);
  }
  const updates = [];
  for (const row of acceptance) {
    const applicable = evidence[row.Scenario];
    const reason = notApplicable[row.Scenario];
    if ((!applicable && !reason) || (applicable && reason))
      throw new Error(`Unresolved ${row.Scenario}`);
    for (const file of (applicable || '')
      .split(';')
      .map(item => item.trim())
      .filter(Boolean))
      if (!(await fs.stat(path.join(process.cwd(), file))).isFile())
        throw new Error(`Missing ${file}`);
    updates.push({
      row: row._row,
      fields: {
        'Astryx candidate': 'Elevation',
        'Applicable?': applicable ? 'Required' : 'N/A',
        Result: applicable ? 'Pass' : 'N/A',
        Evidence: applicable || '',
        'Notes / N/A reason': applicable
          ? detail[row.Scenario] ||
            `Native Elevation evidence directly verifies ${row.Scenario.toLowerCase()}.`
          : reason,
        Gate: 'Ready',
      },
    });
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
      sheet.getRangeByIndexes(
        group[0].row - 1,
        column,
        group.length,
        1,
      ).values = group.map(update => [update.fields[key]]);
    }
  const required = Object.keys(evidence).length;
  write(wb, sheets.components, mapping._row, {
    'Astryx candidate': 'Native Elevation',
    Package: '@astryxdesign/material3',
    Relationship: 'Confirmed',
    'Work status': 'Verified',
    'Required checks': required,
    'Passed checks': required,
    'Astryx source': component,
    'Astryx docs': p(
      'packages/material3/README.md',
      'packages/material3/src/Elevation/Elevation.doc.mjs',
    ),
    'Token filter': '',
    'Token IDs':
      'TM-01729, TM-02878, TM-02879, TM-02880, TM-02881, TM-02882, TM-02883',
    'Token gate': 'Pass',
    'Token evidence': p(foundation, component, pixels),
    'Native export': '@astryxdesign/material3/Elevation',
    'Native source': component,
    'Native QA': 'Pending',
  });
  return {
    changed: true,
    data: {
      mapping: mapping['Map ID'],
      acceptance: acceptance.length,
      required,
      tokenIds: 7,
    },
  };
});
process.stderr.write(`${JSON.stringify(result.data)}\n`);
