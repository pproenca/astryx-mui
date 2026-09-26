// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Existing v2 workbook and pinned Compose index. @output Additive v3 migration with histories and formulas retained. @position One-time, idempotent disposable workbook upgrade. */
import {table, write, meta, sheets, ids, graph} from './model.mjs';
import {digest} from './compose.mjs';
import {excelTime} from './flow.mjs';

const taskFields = [
  'Contract',
  'Preparation',
  'Preparation SHA256',
  'Stage entered at',
  'Implementation ms',
  'QA wait ms',
  'Merge wait ms',
  'Blocked ms',
  'Rework count',
  'Closed at',
];
const sourceFields = [
  'Mapping IDs',
  'Coverage task',
  'Disposition',
  'Reason',
  'Approval reference',
];
function appendColumns(wb, name, columns) {
  const s = wb.worksheets.getItem(name),
    values = s.getUsedRange().values,
    headers = values[0];
  const added = columns.filter(c => !headers.includes(c));
  if (!added.length) return;
  for (let c = 0; c < added.length; c++) {
    const target = s.getRangeByIndexes(0, headers.length + c, values.length, 1);
    target.copyFrom(
      s.getRangeByIndexes(0, headers.length - 1, values.length, 1),
      'all',
    );
    target.values = [[added[c]], ...values.slice(1).map(() => [''])];
    target.format.columnWidth = 24;
    if (added[c].endsWith(' at')) target.setNumberFormat('yyyy-mm-dd hh:mm');
    if (added[c].endsWith(' ms') || added[c] === 'Rework count')
      target.setNumberFormat('0');
  }
  resizeTable(s);
}
function resizeTable(s) {
  const t = s.tables.items[0];
  if (!t) return;
  const name = t.name,
    style = t.style;
  t.delete();
  const size = s.getUsedRange().values;
  const rebuilt = s.tables.add(
    `A1:${column(size[0].length)}${size.length}`,
    true,
    name,
  );
  rebuilt.style = style;
}
function column(n) {
  let s = '';
  for (; n; n = Math.floor((n - 1) / 26))
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}
function append(wb, name, objects) {
  if (!objects.length) return;
  const s = wb.worksheets.getItem(name),
    headers = s.getUsedRange().values[0];
  s.tables.items[0].rows.add(
    null,
    objects.map(o => headers.map(h => o[h] ?? '')),
  );
}
function setMeta(wb, key, value) {
  const s = wb.worksheets.getItem('Overview'),
    used = s.getUsedRange(),
    rows = used.values,
    offset = used.rowIndex;
  let index = rows.findIndex(r => r[0] === key);
  if (index < 0) index = rows.length;
  if (index === rows.length)
    s.getRangeByIndexes(offset + index, 0, 1, 2).copyFrom(
      s.getRangeByIndexes(offset + index - 1, 0, 1, 2),
      'all',
    );
  s.getRangeByIndexes(offset + index, 0, 1, 2).values = [[key, value]];
}
const familyForElement = element => {
  const e = String(element);
  if (/icon-button/.test(e)) return 'IconButton';
  if (/segmented-button/.test(e)) return 'SegmentedButton';
  if (/button/.test(e)) return 'Button';
  if (/text-field|filled-field|outlined-field/.test(e))
    return /outlined/.test(e) ? 'OutlinedTextField' : 'TextField';
  if (/navigation-drawer/.test(e)) return 'NavigationDrawer';
  if (/navigation-bar/.test(e)) return 'NavigationBar';
  if (/navigation-tab|primary-tab|secondary-tab/.test(e)) return 'Tab';
  if (e === 'md-tabs') return 'TabRow';
  if (/progress/.test(e)) return 'ProgressIndicator';
  if (/select/.test(e)) return 'ExposedDropdownMenu';
  if (/menu/.test(e)) return 'Menu';
  if (/chip/.test(e)) return 'Chip';
  if (/card/.test(e)) return 'Card';
  if (/fab/.test(e)) return 'FloatingActionButton';
  if (/list|md-item/.test(e)) return 'ListItem';
  return {
    'md-badge': 'Badge',
    'md-checkbox': 'Checkbox',
    'md-dialog': 'AlertDialog',
    'md-divider': 'Divider',
    'md-icon': 'Icon',
    'md-radio': 'RadioButton',
    'md-ripple': 'Ripple',
    'md-slider': 'Slider',
    'md-switch': 'Switch',
    'md-elevation': 'Surface',
  }[e];
};
const groups = {
  AppBar: ['AppBar', 'AppBarColumn', 'AppBarRow', 'AppBarDsl'],
  BottomSheet: [
    'BottomSheet',
    'BottomSheetScaffold',
    'ModalBottomSheet',
    'Scrim',
  ],
  Carousel: ['Carousel', 'CarouselParallaxScrollEffect'],
  DatePicker: ['DatePicker', 'DateRangePicker'],
  NavigationRail: ['NavigationRail', 'WideNavigationRail'],
  Snackbar: ['Snackbar', 'SnackbarHost'],
  TimePicker: ['TimePicker', 'TimePickerDialog', 'ScrollField'],
  Tooltip: ['Tooltip', 'Label'],
};
const additional = [
  'AppBar',
  'BottomSheet',
  'Carousel',
  'DatePicker',
  'NavigationRail',
  'Snackbar',
  'TimePicker',
  'Tooltip',
  'ButtonGroup',
  'DragHandle',
  'FloatingActionButtonMenu',
  'FloatingToolbar',
  'LoadingIndicator',
  'PullToRefresh',
  'Scaffold',
  'SearchBar',
  'SecureTextField',
  'SplitButton',
  'SwipeToDismissBox',
  'ToggleButton',
  'WavyProgressIndicator',
];
export function scopeMembers(wb) {
  return [
    ...table(wb, sheets.tasks).map(r => [
      'task',
      r['Task ID'],
      r.Contract || 'historical',
    ]),
    ...table(wb, 'Compose sources').map(r => [
      'compose',
      r.ID,
      r['Source SHA256'],
      r.Symbols,
    ]),
    ...table(wb, 'Design kit sets').map(r => [
      'figma',
      r['Figma node ID'],
      r['Variant axes'],
      r['Variant values'],
      r.Variants,
    ]),
    ...table(wb, 'Material components').map(r => [
      'web',
      r.ID,
      r.Element,
      r['Source path'],
    ]),
  ].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
export function upgradeWorkbook(wb, p, index) {
  const before = meta(wb);
  if (
    before['Migration strategy'] === p.value.strategyId &&
    before['Policy SHA256'] === p.hash
  )
    return {
      changed: false,
      type: 'workbook.current',
      data: {strategy: p.value.strategyId},
    };
  if (before['Migration strategy'] !== 'material3-native-v2')
    throw new Error(
      'Upgrade requires the active v2 workbook; do not upgrade the old inventory-only export.',
    );
  const oldSizes = Object.fromEntries(
    wb.worksheets.items.map(s => [s.name, s.getUsedRange().values.length]),
  );
  const originalTasks = table(wb, sheets.tasks),
    historical = new Set(
      originalTasks
        .filter(t => ['Closed', 'Superseded'].includes(t.Status))
        .map(t => t['Task ID']),
    );
  appendColumns(wb, sheets.tasks, taskFields);
  appendColumns(wb, sheets.components, [
    'Compose families',
    'Required variants',
    'Token IDs',
    'Native source',
    'Disposition',
    'Scope reason',
    'Scope approval',
  ]);
  for (const name of ['Material components', 'Design kit sets'])
    appendColumns(wb, name, sourceFields);
  const sourceSheet = wb.worksheets.add('Compose sources');
  const headers = [
    'ID',
    'Family',
    'Kind',
    'Source path',
    'Source SHA256',
    'Symbols',
    'Token files',
    'Tests',
    'Source link',
    ...sourceFields,
  ];
  sourceSheet.getRangeByIndexes(0, 0, 1, headers.length).values = [headers];
  sourceSheet.tables.add(
    `A1:${column(headers.length)}1`,
    true,
    'ComposeSources',
  );
  sourceSheet.getRangeByIndexes(0, 0, 1, headers.length).format = {
    fill: '#182D49',
    font: {bold: true, color: '#FFFFFF'},
    wrapText: true,
  };
  sourceSheet.getRangeByIndexes(
    0,
    0,
    index.families.length + 1,
    headers.length,
  ).format.columnWidth = 26;
  sourceSheet.freezePanes.freezeRows(1);
  sourceSheet.showGridLines = false;
  const maps = table(wb, sheets.components);
  for (const m of maps) {
    write(wb, sheets.components, m._row, {
      Disposition: String(m['Material element']).startsWith('md-')
        ? 'Required'
        : 'Review',
    });
    const name = familyForElement(m['Material element']);
    if (name)
      write(wb, sheets.components, m._row, {
        'Compose families': `compose:${name}`,
        'Required variants':
          'Standard and Expressive sizes, shapes and interaction states; resolve exact Figma axes in source preparation.',
      });
    if (m.Contract)
      write(wb, sheets.components, m._row, {Contract: p.value.strategyId});
  }
  const newMaps = [],
    newTasks = [],
    newEdges = [];
  let nextMap = Math.max(...maps.map(m => Number(m['Map ID'].slice(3)))) + 1;
  for (const [i, name] of additional.entries()) {
    const families = (groups[name] || [name])
      .map(n => index.families.find(f => f.name === n))
      .filter(Boolean);
    if (!families.length) continue;
    const mapId = `CM-${String(nextMap++).padStart(4, '0')}`,
      taskId = `M3-EXP-${String(i + 1).padStart(3, '0')}`;
    newMaps.push({
      'Map ID': mapId,
      'Material element': name,
      Channel: 'Compose / Expressive',
      Package: p.value.nativePackage,
      Relationship: 'Candidate',
      'Work status': 'Not started',
      Review: 'Pending',
      Blocker: 'Resolve selected variants and design baseline',
      'Material source': families[0].url,
      'Gap / note':
        'Required family absent from the Web-led mapping. Candidate coverage is not implementation equivalence.',
      'Token gate': 'Pending',
      Contract: p.value.strategyId,
      'Native export': `${p.value.nativePackage}/${name}`,
      'Native QA': 'Pending',
      'Source coverage': 'Compose; reconcile Figma/guidance',
      'Source resolution': 'Unresolved',
      Merged: 'No',
      'Compose families': families.map(f => f.id).join(', '),
      'Required variants': [
        ...new Set(
          families.flatMap(f => f.symbols.filter(n => /^[A-Z]/.test(n))),
        ),
      ].join(', '),
    });
    newTasks.push({
      'Task ID': taskId,
      Epic: 'M3-E08',
      Title: `Migrate native ${name} family and Expressive states`,
      Layer: 'Component',
      Priority: 50 + i,
      Status: 'Backlog',
      Target: name,
      'Mapping IDs': mapId,
      Notes:
        'Resolve Figma variants and Compose behavior, transfer applicable upstream tests, then verify motion, browser semantics, performance and native-only consumer QA.',
      Phase: 'Material 3 + Expressive',
      Contract: p.value.strategyId,
    });
    for (const predecessor of ['M3-SRC-002', 'M3-NAT-006'])
      newEdges.push({
        Predecessor: predecessor,
        Successor: taskId,
        Kind: 'Hard',
      });
  }
  append(wb, sheets.components, newMaps);
  for (const m of table(wb, sheets.components).filter(
    m => m.Channel === 'Compose / Expressive',
  ))
    write(wb, sheets.components, m._row, {Disposition: 'Required'});
  append(wb, sheets.tasks, newTasks);
  const updatedMaps = table(wb, sheets.components);
  // Public foundation and helper files retain explicit coverage; no implicit exclusion.
  const nav = updatedMaps.filter(m =>
    String(m['Compose families']).includes('compose:NavigationBar'),
  );
  for (const m of nav)
    write(wb, sheets.components, m._row, {
      'Compose families':
        'compose:NavigationBar, compose:ShortNavigationBar, compose:NavigationItem',
    });
  const allMaps = table(wb, sheets.components);
  append(
    wb,
    'Compose sources',
    index.families.map(f => ({
      ID: f.id,
      Family: f.name,
      Kind: f.kind,
      'Source path': f.path,
      'Source SHA256': f.sha256,
      Symbols: f.symbols.join(', '),
      'Token files': f.tokens.join(', '),
      Tests: f.tests.map(t => t.path).join(', '),
      'Source link': f.url,
      'Mapping IDs': allMaps
        .filter(m =>
          String(m['Compose families'])
            .split(/[,;]\s*/)
            .includes(f.id),
        )
        .map(m => m['Map ID'])
        .join(', '),
      'Coverage task': f.kind === 'Foundation' ? 'M3-NAT-002' : 'M3-SRC-002',
      Disposition: f.kind === 'Foundation' ? 'Foundation' : 'Required',
      Reason:
        'Pinned reference candidate; exact variants and helper ownership must be resolved before verification.',
    })),
  );
  for (const name of ['Material components', 'Design kit sets'])
    for (const row of table(wb, name)) {
      const matched = allMaps.filter(m =>
        name === 'Material components'
          ? m['Material element'] === row.Element
          : String(m['Figma nodes'])
              .split(/[,;]\s*/)
              .includes(row['Figma node ID']),
      );
      write(wb, name, row._row, {
        'Mapping IDs': matched.map(m => m['Map ID']).join(', '),
        'Coverage task': 'M3-SRC-002',
        Disposition: 'Required',
        Reason: matched.length
          ? 'Resolve exact variants against selected baseline.'
          : 'Unmapped reference; classify in the coverage task. Missing from Web is not an exclusion.',
      });
    }
  // Record Compose expressions without advertising them as CSS properties.
  const tokens = table(wb, sheets.tokens);
  wb.worksheets
    .getItem(sheets.tokens)
    .getRange(`N2:N${tokens.length + 1}`).values = tokens.map(t => [
    t.Contract ? p.value.strategyId : '',
  ]);
  let nextToken =
    Math.max(...tokens.map(t => Number(t['Map ID'].slice(3)))) + 1;
  const newTokens = index.tokens.flatMap(f =>
    f.values.map(v => ({
      'Map ID': `TM-${String(nextToken++).padStart(5, '0')}`,
      'Material token': `compose:${f.name}.${v.name}`,
      Layer: 'Compose source-only',
      Relationship: 'Candidate',
      Verification: 'Pending',
      Review: 'Pending',
      'Material set': f.name,
      'Material source': `${f.url}#${v.line}`,
      Note: `${v.expression}; source-only expression, not a Material Web CSS property.`,
      Contract: p.value.strategyId,
      'Native QA': 'Pending',
      Merged: 'No',
    })),
  );
  append(wb, sheets.tokens, newTokens);
  for (const m of table(wb, sheets.components)) {
    const familyIds = String(m['Compose families']).split(/[,;]\s*/);
    const names = new Set(
      index.families
        .filter(f => familyIds.includes(f.id))
        .flatMap(f => f.tokens),
    );
    const selected = newTokens.filter(t => names.has(t['Material set']));
    if (selected.length)
      write(wb, sheets.components, m._row, {
        'Token IDs': selected.map(t => t['Map ID']).join(', '),
      });
  }
  // Broaden source inventory before native architecture. Preserve existing task IDs/history.
  const edgeSheet = wb.worksheets.getItem(sheets.edges);
  const edges = table(wb, sheets.edges).filter(
    e => !(e.Predecessor === 'M3-NAT-006' && e.Successor === 'M3-SRC-002'),
  );
  edges.push(
    {Predecessor: 'M3-SRC-001', Successor: 'M3-SRC-002', Kind: 'Hard'},
    {Predecessor: 'M3-SRC-002', Successor: 'M3-NAT-001', Kind: 'Hard'},
    ...newEdges,
  );
  edgeSheet
    .getRangeByIndexes(1, 0, oldSizes.Dependencies - 1, 3)
    .clear({applyTo: 'contents'});
  edgeSheet.getRangeByIndexes(1, 0, edges.length, 3).values = edges.map(e => [
    e.Predecessor,
    e.Successor,
    e.Kind,
  ]);
  resizeTable(edgeSheet);
  const now = Date.now();
  for (const t of table(wb, sheets.tasks))
    if (!historical.has(t['Task ID'])) {
      const fields = {Contract: p.value.strategyId};
      if (['Claimed', 'Awaiting QA', 'Approved', 'Blocked'].includes(t.Status))
        fields['Stage entered at'] = excelTime(now);
      if (t['Task ID'] === 'M3-SRC-002')
        Object.assign(fields, {
          Title: 'Resolve complete pinned Material 3 and Expressive coverage',
          Phase: 'Foundation',
          Notes:
            'Reconcile every retained Figma/Web/Compose inventory row, including all variants, states and foundations. Link native mappings or explicit helper/foundation ownership; any platform exclusion requires source evidence and human approval. Freeze scope before native implementation. Website-only requirements belong in this same workbook.',
        });
      if (t['Task ID'] === 'M3-NAT-002')
        fields.Notes =
          t.Notes +
          ' Include emphasized typography, expanded shapes, standard/Expressive motion and source-only Compose roles. Independent upstream traces and approved performance profiles are foundation acceptance inputs.';
      write(wb, sheets.tasks, t._row, fields);
    }
  const existingChecks = table(wb, sheets.checks),
    newChecks = [];
  for (const m of table(wb, sheets.components).filter(
    m => m.Disposition === 'Required',
  ))
    for (const [name, expected] of p.value.nativeAcceptance)
      if (
        !existingChecks.some(
          c => c['Map ID'] === m['Map ID'] && c.Scenario === name,
        )
      )
        newChecks.push({
          'Map ID': m['Map ID'],
          'Material element': m['Material element'],
          'Astryx candidate': m['Astryx candidate'],
          Dimension: 'Native contract',
          Scenario: name,
          'Expected check': expected,
          'Applicable?': 'Required',
          Result: 'Pending',
          'Requirement source': p.value.contract,
        });
  append(wb, sheets.checks, newChecks);
  const checkRows = wb.worksheets.getItem(sheets.checks).getUsedRange()
    .values.length;
  for (const c of table(wb, sheets.checks).filter(
    c => c._row >= oldSizes[sheets.checks] + 1,
  ))
    wb.worksheets.getItem(sheets.checks).getRange(`L${c._row}`).formulas = [
      [
        `=IF(AND(G${c._row}="Required",H${c._row}="Pass",I${c._row}<>""),"Ready",IF(AND(G${c._row}="N/A",J${c._row}<>"",K${c._row}<>""),"Ready","Open"))`,
      ],
    ];
  for (const m of table(wb, sheets.components)) {
    const s = wb.worksheets.getItem(sheets.components),
      r = m._row;
    s.getRange(`H${r}`).formulas = [
      [
        `=COUNTIFS('Acceptance checks'!$A$2:$A$${checkRows},$A${r},'Acceptance checks'!$G$2:$G$${checkRows},"Required")`,
      ],
    ];
    s.getRange(`I${r}`).formulas = [
      [
        `=COUNTIFS('Acceptance checks'!$A$2:$A$${checkRows},$A${r},'Acceptance checks'!$G$2:$G$${checkRows},"Required",'Acceptance checks'!$L$2:$L$${checkRows},"Ready")`,
      ],
    ];
    s.getRange(`K${r}`).formulas = [
      [
        `=IF(AND(AB${r}="Yes",AA${r}="Resolved",V${r}="${p.value.strategyId}",W${r}<>"",AF${r}<>"",X${r}="Approved",F${r}="Confirmed",G${r}="Verified",J${r}="Approved",H${r}>0,H${r}=I${r},COUNTIFS('Acceptance checks'!$A$2:$A$${checkRows},$A${r},'Acceptance checks'!$L$2:$L$${checkRows},"Ready")=COUNTIFS('Acceptance checks'!$A$2:$A$${checkRows},$A${r}),P${r}="",OR(S${r}<>"",AE${r}<>""),T${r}="Pass",U${r}<>""),"Yes","No")`,
      ],
    ];
  }
  for (const t of table(wb, sheets.tokens))
    wb.worksheets.getItem(sheets.tokens).getRange(`I${t._row}`).formulas = [
      [
        `=IF(AND(P${t._row}="Yes",N${t._row}="${p.value.strategyId}",O${t._row}="Approved",B${t._row}<>"",D${t._row}<>"",E${t._row}="Confirmed",F${t._row}="Pass",G${t._row}<>"",H${t._row}="Approved"),"Yes","No")`,
      ],
    ];
  const overview = wb.worksheets.getItem('Overview');
  const formulas = overview.getUsedRange().formulas;
  for (let r = 0; r < formulas.length; r++)
    for (let c = 0; c < formulas[r].length; c++)
      if (formulas[r][c]) {
        let f = formulas[r][c];
        for (const name of [
          sheets.components,
          sheets.tokens,
          sheets.tasks,
          sheets.checks,
        ])
          f = f.replace(
            new RegExp(
              `('${name}'!\\$[A-Z]+\\$2:\\$[A-Z]+\\$)${oldSizes[name]}\\b`,
              'g',
            ),
            `$1${wb.worksheets.getItem(name).getUsedRange().values.length}`,
          );
        overview.getUsedRange().getCell(r, c).formulas = [[f]];
      }
  for (const [key, value] of Object.entries({
    'Migration strategy': p.value.strategyId,
    'Policy SHA256': p.hash,
    AndroidX: p.value.androidxCommit,
    'Baseline ID': p.value.baselineId,
    'Source precedence':
      'Figma design; Compose behavior and Expressive; Material guidance; Web browser implementation',
    'Scope inventory SHA256': digest(JSON.stringify(scopeMembers(wb))),
    'Flow tracking since': excelTime(now),
    'Reference tabs':
      'Source inventories and dependency detail remain hidden and inspectable.',
    'Legacy approved component variants':
      before['Legacy approved component variants'],
    'Legacy approved token mappings': before['Legacy approved token mappings'],
    'Compose reference families': index.families.length,
  }))
    setMeta(wb, key, value);
  graph(table(wb, sheets.tasks), table(wb, sheets.edges));
  return {
    changed: true,
    type: 'workbook.upgraded',
    data: {
      strategy: p.value.strategyId,
      preservedTasks: originalTasks.length,
      newTasks: newTasks.length,
      composeFamilies: index.families.length,
      composeTokenExpressions: newTokens.length,
      coverage:
        'Unresolved rows remain required. No component or source decision was approved by this upgrade.',
    },
  };
}
