// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Sole migration workbook and committed native Ripple evidence. @output Scenario-specific CM-0042 acceptance rows through Artifact Tool. @position Disposable M3-GAP-013 workbook authoring; the workbook remains the only task database. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {workbook} from '../workbook.mjs';
import {sheets,table,write} from '../model.mjs';

const root='internal/material3-migration/actual/M3-GAP-013';
const component='packages/material3/src/Ripple/Ripple.tsx';
const spec='packages/material3/src/Ripple/Ripple.spec.md';
const unit='packages/material3/src/Ripple/Ripple.test.tsx';
const browser='packages/material3/scripts/check-ripple-browser.mjs';
const pixels='packages/material3/scripts/check-ripple-pixels.mjs';
const state='packages/material3/scripts/check-ripple-state-pixels.mjs';
const motion='packages/material3/scripts/check-ripple-motion.mjs';
const baseline='internal/material3-migration/sources/baseline/ripple-compose-first.json';
const family='internal/material3-migration/sources/families/family-CM-0023.md';
const p=(...files)=>files.join('; ');
const evidence={
  'Type and variant':p(spec,unit,`${root}/ripple-light-0075.png`,`${root}/ripple-light-0260.png`),
  'Properties and slots':p(spec,unit,'packages/material3/src/Ripple/Ripple.doc.mjs'),
  'Parts and geometry':p(pixels,motion,`${root}/ripple-light-0075.png`),
  'Color light':p(pixels,state,`${root}/state-motion-light-0100.png`),
  'Color dark':p(pixels,state,`${root}/state-motion-dark-0100.png`),
  'Shape spacing elevation':p(pixels,component,spec),
  Enabled:p(browser,`${root}/ripple-light-0000.png`),
  Hover:p(browser,state,`${root}/state-motion-light-0100.png`),
  'Focus visible':p(browser,state,`${root}/state-motion-light-0320.png`),
  Pressed:p(browser,pixels,`${root}/ripple-light-0075.png`),
  Disabled:p(browser,component),
  'Open closed dragged':p(browser,state,`${root}/state-motion-light-0187.png`),
  'Pointer touch':p(browser,component),
  'Keyboard form':p(browser,unit),
  Semantics:p(browser,unit,spec),
  'Contrast cues':p(browser,pixels,state),
  Transitions:p(motion,state,`${root}/native-ripple-press.webm`,`${root}/native-ripple-state.webm`),
  'Enter exit interruption':p(motion,browser,`${root}/ripple-light-0180.png`,`${root}/state-motion-light-0187.png`),
  'Reduced motion':p(browser,`${root}/ripple-light-reduced-press.png`,`${root}/state-motion-light-reduced-500.png`),
  'Viewport and container':p(browser,pixels),
  'Zoom RTL overflow':p(browser,component),
  'Color and overrides':p(browser,component),
  'Layering and nesting':p(browser,component,spec),
  'Browser SSR performance':p(unit,browser,`${root}/performance.json`),
  'Docs and regression':p('packages/material3/README.md','packages/material3/src/Ripple/Ripple.doc.mjs',unit,browser,pixels,state,motion),
  'Material token contract':p(component,browser,'packages/material3/src/foundation.ts'),
  'Native dependency boundary':p('packages/material3/package.json',component,'scripts/check-package-boundaries.js'),
  'Material API and defaults':p(spec,unit,browser,baseline),
  'Compatibility direction':p(spec,'packages/themes/material3/material3.spec.md','packages/material3/README.md'),
  'Native consumer preview':p('packages/material3/gallery/index.html','packages/material3/scripts/check-gallery.mjs','packages/material3/fixtures/ripple.tsx'),
  'Compose source precedence':p(baseline,family,spec),
  'Pixel comparison':p(`${root}/comparison.json`,`${root}/diff/ripple-light-0075.png`,`${root}/diff/state-motion-dark-0187.png`,pixels,state),
  'Motion evidence':p(`${root}/motion-review.json`,`${root}/native-ripple-press-contact.png`,`${root}/native-ripple-state-contact.png`,motion),
  'Compose behavior and tests':p(baseline,motion,browser,`${root}/compose-ripple-source-values.json`,`${root}/compose-ripple-state-layer.json`),
  'Native response and frame pacing':p(`${root}/performance.json`,'internal/material3-migration/actual/record-native-ripple.mjs'),
};
const notApplicable={
  'Touch target':'Ripple is decorative and pointer inert; its semantic owner defines target size and activation.',
  Typography:'Ripple renders no textual content; type is owned by its semantic control.',
  'Selected checked':'The semantic control owns selection and checked state; Ripple responds to its interaction state.',
  'Invalid error':'Ripple owns no value or validation state; the semantic control presents errors.',
  Loading:'Ripple owns no pending operation; its semantic control presents loading feedback.',
  'Read only':'Read-only semantics belong to the associated control; disabled suppression remains tested.',
  'Extremes and locale':'Ripple accepts no textual child or label; its semantic control owns localization and extremes.',
};
const detail={
  'Type and variant':'Bounded default and explicit unbounded modes match pinned Compose press geometry.',
  'Color light':'Light OnSurface and OnPrimary state treatment matches pinned source frames.',
  'Color dark':'Dark OnSurface and OnPrimary state treatment matches pinned source frames.',
  'Open closed dragged':'The custom drag input produces Compose 16% opacity and interrupted state retargeting; open/closed remains with the owner.',
  'Keyboard form':'The decorative layer stays outside tab and form semantics; Enter and Space remain with the control.',
  'Pixel comparison':'All 32 press frames meet the approved five Pixelmatch-pixel limit; 16 state frames meet region/channel limits with zero change outside controls.',
  'Motion evidence':'The owner watched source/native clips at normal speed; independent 5 ms browser samples and contact sheets are retained.',
  'Native response and frame pacing':'Thirty inputs and 300 active frames meet the approved Chrome/macOS response and frame profile.',
};
const result=await workbook(process.env.M3_WORKBOOK,true,async wb=>{
  const mapping=table(wb,sheets.components).find(row=>row['Map ID']==='CM-0042');
  const acceptance=table(wb,sheets.checks).filter(row=>row['Map ID']==='CM-0042');
  if(!mapping||acceptance.length!==42||Object.keys(evidence).length+Object.keys(notApplicable).length!==42)
    throw new Error('Unexpected Ripple acceptance scope');
  const updates=[];
  for(const row of acceptance){
    const applicable=evidence[row.Scenario],reason=notApplicable[row.Scenario];
    if((!applicable&&!reason)||(applicable&&reason))throw new Error(`Unresolved ${row.Scenario}`);
    for(const file of (applicable||'').split(';').map(item=>item.trim()).filter(Boolean))
      if(!(await fs.stat(path.join(process.cwd(),file))).isFile())throw new Error(`Missing ${file}`);
    updates.push({row:row._row,fields:{
      'Astryx candidate':'Ripple',
      'Applicable?':applicable?'Required':'N/A',
      Result:applicable?'Pass':'N/A',
      Evidence:applicable||'',
      'Notes / N/A reason':applicable?(detail[row.Scenario]||`Native Ripple evidence directly verifies ${row.Scenario.toLowerCase()}.`):reason,
      Gate:'Ready',
    }});
  }
  const sheet=wb.worksheets.getItem(sheets.checks);
  const headers=sheet.getUsedRange().getRow(0).values[0];
  const groups=[];
  for(const update of updates.sort((a,b)=>a.row-b.row)){
    const last=groups.at(-1);
    if(last&&last.at(-1).row+1===update.row)last.push(update);else groups.push([update]);
  }
  for(const group of groups)for(const key of Object.keys(group[0].fields)){
    const column=headers.indexOf(key);
    if(column<0)throw new Error(`Missing acceptance column ${key}`);
    sheet.getRangeByIndexes(group[0].row-1,column,group.length,1).values=group.map(update=>[update.fields[key]]);
  }
  const required=Object.keys(evidence).length;
  write(wb,sheets.components,mapping._row,{
    'Astryx candidate':'Native Ripple',Package:'@astryxdesign/material3',Relationship:'Confirmed','Work status':'Verified',
    'Required checks':required,'Passed checks':required,'Astryx source':component,
    'Astryx docs':'packages/material3/README.md; packages/material3/src/Ripple/Ripple.doc.mjs',
    'Token filter':'','Token IDs':'TM-04459, TM-04460, TM-04461, TM-04462','Token gate':'Pass',
    'Token evidence':p(browser,component),'Native export':'@astryxdesign/material3/Ripple','Native source':component,'Native QA':'Pending',
  });
  return {changed:true,data:{mapping:mapping['Map ID'],acceptance:acceptance.length,required,groups:groups.length}};
});
process.stderr.write(`${JSON.stringify(result.data)}\n`);
