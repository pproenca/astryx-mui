// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Artifact-authored XLSX. @output Six working tabs with reference sheets retained and hidden.
 * @position OOXML presentation fallback: Artifact Tool exposes no documented sheet visibility/order setter.
 * Cell data, formulas, styles and relationships are untouched.
 */
import fs from 'node:fs/promises';
import {dependency} from './runtime.mjs';
export const visible = [
  'Overview',
  'Tasks',
  'Component mapping',
  'Token mapping',
  'Acceptance checks',
  'QA reviews',
];
export function presentXML(xml) {
  const region = xml.match(/<((?:\w+:)?sheets)>([\s\S]*?)<\/\1>/);
  if (!region) throw new Error('Missing workbook sheets');
  const entries = [...region[2].matchAll(/<(?:\w+:)?sheet\b[^>]*\/>/g)].map(
    (m, i) => ({
      text: m[0],
      name: m[0].match(/\bname="([^"]+)"/)?.[1],
      index: i,
    }),
  );
  if (!visible.every(name => entries.some(e => e.name === name)))
    throw new Error('Missing working sheet');
  const ordered = [
    ...visible.map(name => entries.find(e => e.name === name)),
    ...entries.filter(e => !visible.includes(e.name)),
  ];
  const tags = ordered
    .map(e =>
      e.text
        .replace(/\sstate="[^"]*"/, '')
        .replace(
          '/>',
          ` state="${visible.includes(e.name) ? 'visible' : 'hidden'}"/>`,
        ),
    )
    .join('');
  let result = xml.replace(region[0], `<${region[1]}>${tags}</${region[1]}>`);
  result = result.replace(
    /localSheetId="(\d+)"/g,
    (_, id) =>
      `localSheetId="${ordered.findIndex(e => e.index === Number(id))}"`,
  );
  result = result.replace(/activeTab="\d+"/g, 'activeTab="0"');
  return result;
}
export async function present(file) {
  const module = await dependency('jszip');
  const JSZip = module.default;
  const zip = await JSZip.loadAsync(await fs.readFile(file));
  const xml = await zip.file('xl/workbook.xml').async('string');
  zip.file('xl/workbook.xml', presentXML(xml));
  await fs.writeFile(
    file,
    await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}),
  );
}
