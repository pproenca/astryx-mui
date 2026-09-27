// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned Compose StateTokens, native Material value graph and sole workbook. @output Evidence-backed TM-04459–TM-04462 mappings through Artifact Tool. @position Disposable M3-GAP-013 token bookkeeping before native QA. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {workbook} from '../workbook.mjs';
import {sheets,table,write} from '../model.mjs';
import {tokenReady} from '../token-completion.mjs';

const source=JSON.parse(await fs.readFile('packages/material3/src/foundationSource.json'));
const values={
  'TM-04459':['dragged',0.16,'compose:StateTokens.DraggedStateLayerOpacity'],
  'TM-04460':['focus',0.1,'compose:StateTokens.FocusStateLayerOpacity'],
  'TM-04461':['hover',0.08,'compose:StateTokens.HoverStateLayerOpacity'],
  'TM-04462':['pressed',0.1,'compose:StateTokens.PressedStateLayerOpacity'],
};
const evidence='packages/material3/src/foundationSource.json; packages/material3/src/foundation.ts; packages/material3/src/Ripple/Ripple.tsx; packages/material3/src/foundation.test.ts; packages/material3/scripts/check-ripple-state-pixels.mjs; packages/material3/scripts/check-ripple-motion.mjs';
const result=await workbook(process.env.M3_WORKBOOK,true,wb=>{
  const tokens=table(wb,sheets.tokens);
  for(const [id,[key,value,name]] of Object.entries(values)){
    const row=tokens.find(item=>item['Map ID']===id);
    assert.ok(row,id);
    assert.equal(row['Material token'],name);
    assert.equal(source.state.opacity[key],value);
    const fields={
      'Astryx candidate':`material3StateOpacity.${key} (${value})`,
      Relationship:'Confirmed',Verification:'Pass',Evidence:evidence,
      'Astryx source':'packages/material3/src/foundationSource.json; packages/material3/src/Ripple/Ripple.tsx',
      Note:`${row.Note}\nNative Ripple consumes the pinned Compose ${key} opacity from the shared foundation graph; package state and motion regressions verify its rendered value.`,
    };
    assert.equal(tokenReady({...row,...fields},'material3-native-v4'),true);
    write(wb,sheets.tokens,row._row,fields);
  }
  return {changed:true,data:{tokenIds:Object.keys(values),evidence}};
});
process.stderr.write(`${JSON.stringify(result.data)}\n`);
