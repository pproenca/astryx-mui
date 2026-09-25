// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file build-preview.mjs
 * @input Built Material 3 CSS and module, pinned foundation artifacts, and Git revision
 * @output Source-comparison dist/preview.html for exact-revision foundation QA
 * @position Material 3 visual foundation preview generator
 */

import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
const read = name =>
  JSON.parse(fs.readFileSync(path.join(root, `src/${name}.json`), 'utf8'));
const css = fs.readFileSync(path.join(root, 'dist/theme.css'), 'utf8');
const colors = read('material3ColorSource');
const typography = read('material3TypographySource');
const shapes = read('material3ShapeSource');
const elevation = read('material3ElevationSource');
const motion = read('material3MotionSource');
const icons = read('material3IconSource');
const {material3ElevationLayers} = await import(
  pathToFileURL(path.join(root, 'dist/source.mjs')).href
);
const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
});
if (revision.error || revision.status !== 0)
  throw new Error('Cannot identify Astryx revision.');
const sha = revision.stdout.trim();
const escape = value =>
  String(value).replace(
    /[&<>"']/g,
    char =>
      ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[
        char
      ],
  );
const swatches = Object.keys(colors.lightResolved)
  .map(
    role => `
  <article class="swatch" data-role="${escape(role)}" data-light="${escape(colors.lightResolved[role])}" data-dark="${escape(colors.darkResolved[role])}">
    <code>${escape(role)}</code><div class="comparison-paints"><div><span>Material Web</span><div class="swatch-paint reference-paint"></div></div>
    <div><span>Astryx CSS</span><div class="swatch-paint actual-paint" style="background:var(--md-sys-color-${role})"></div></div></div>
    <small class="color-reading"></small></article>`,
  )
  .join('');
const colorPairs = [
  ['primary', 'on-primary'],
  ['primary-container', 'on-primary-container'],
  ['surface', 'on-surface'],
  ['surface-container', 'on-surface'],
  ['error', 'on-error'],
]
  .map(
    ([background, foreground]) => `
  <article class="color-pair" data-background="${background}" data-foreground="${foreground}"
    data-light-background="${colors.lightResolved[background]}" data-light-foreground="${colors.lightResolved[foreground]}"
    data-dark-background="${colors.darkResolved[background]}" data-dark-foreground="${colors.darkResolved[foreground]}">
    <code>${background} / ${foreground}</code><div class="comparison-paints"><div><span>Material Web</span><div class="pair-paint reference-paint">Sample text</div></div>
    <div><span>Astryx CSS</span><div class="pair-paint actual-paint" style="background:var(--md-sys-color-${background});color:var(--md-sys-color-${foreground})">Sample text</div></div></div></article>`,
  )
  .join('');
const typeRoles = Object.keys(typography.typescale)
  .filter(key => key.endsWith('-size'))
  .map(key => key.slice(0, -5));
const typeSamples = typeRoles
  .map(
    role => `
  <article class="type-sample"><code>${escape(role)}</code><small>Material Web: ${escape(typography.typescale[`${role}-size`])} / ${escape(typography.typescale[`${role}-line-height`])} · weight ${escape(typography.typescale[`${role}-weight`])}</small><div style="font-family:var(--md-sys-typescale-${role}-font),Arial,sans-serif;
    font-size:var(--md-sys-typescale-${role}-size);line-height:var(--md-sys-typescale-${role}-line-height);
    font-weight:var(--md-sys-typescale-${role}-weight);letter-spacing:var(--astryx-theme-material3-typescale-${role}-tracking)">Astryx Material 3</div></article>`,
  )
  .join('');
const shapeSamples = Object.keys(shapes.cssCorners)
  .map(
    role => `
  <article class="shape-sample"><div style="border-radius:var(--md-sys-shape-${role})"></div>
    <code>${escape(role)}</code><small>Material Web: ${escape(shapes.cssCorners[role])} · Astryx: <span class="shape-reading"></span></small></article>`,
  )
  .join('');
const elevationExamples = {
  level0: 'Filled button · outlined card',
  level1: 'Elevated button · elevated card',
  level2: 'Scrolled app bar · menu',
  level3: 'Dialog · floating action button',
  level4: 'Interaction only',
  level5: 'Interaction only',
};
const elevationSamples = Object.entries(elevation.layers)
  .map(([role, layers]) => {
    const actual = material3ElevationLayers(role, 'var(--md-sys-color-shadow)');
    const layer = (source, name) =>
      `<i class="elevation-layer ${name}" style="box-shadow:${escape(source[name].boxShadow.replace(elevation.sampleColor, 'var(--md-sys-color-shadow)'))};opacity:${source[name].opacity}"></i>`;
    const actualLayer = name =>
      `<i class="elevation-layer ${name}" style="box-shadow:${escape(actual[name].boxShadow)};opacity:${actual[name].opacity}"></i>`;
    const portable = {
      level1: '--shadow-low',
      level2: '--shadow-med',
      level3: '--shadow-high',
    }[role];
    return `<article class="elevation-row" data-level="${role}">
      <div class="elevation-label"><strong>${role.replace('level', 'Level ')} · ${elevation.generatedDp[role]} dp</strong><small>${elevationExamples[role]}</small>
      ${portable ? `<small>Also mapped to Core <code>${portable}</code></small>` : '<small>Astryx: elevation helper</small>'}</div>
      <div class="elevation-card reference-elevation" aria-label="Material Web ${role}">${layer(layers, 'key')}${layer(layers, 'ambient')}<span>Material Web reference</span></div>
      <div class="elevation-card actual-elevation" aria-label="Astryx ${role}">${actualLayer('key')}${actualLayer('ambient')}<span>Astryx projection</span></div>
    </article>`;
  })
  .join('');
const iconSamples = Object.entries(icons.artwork)
  .map(
    ([name, item]) => `
  <article class="icon-sample"><svg aria-hidden="true" focusable="false" viewBox="${item.viewBox}" fill="currentColor">${item.paths.map(d => `<path d="${escape(d)}"/>`).join('')}</svg><code>${escape(name)}</code></article>`,
  )
  .join('');
const html = `<!doctype html>
<html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Material 3 foundation QA · ${sha.slice(0, 12)}</title><style>${css}</style><style>
  *{box-sizing:border-box}html{font-family:Roboto,Arial,sans-serif}body{margin:0;background:var(--md-sys-color-background);color:var(--md-sys-color-on-background)}
  .theme{min-height:100vh;padding:24px;max-width:1500px;margin:auto;background:var(--md-sys-color-background);color:var(--md-sys-color-on-background)}.toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 24px}
  button{font:inherit;cursor:pointer;padding:10px 16px;border:1px solid var(--md-sys-color-outline);border-radius:var(--md-sys-shape-full);background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface)}
  button:hover{background:var(--md-sys-color-surface-container-high)}button:active{background:color-mix(in srgb,var(--md-sys-color-on-surface) 12%,var(--md-sys-color-surface-container))}button:focus-visible{outline:3px solid var(--md-sys-color-primary);outline-offset:3px}
  h1{margin:0 0 6px;font-size:var(--md-sys-typescale-headline-large-size);line-height:var(--md-sys-typescale-headline-large-line-height)}
  h2{margin:40px 0 12px;font-size:var(--md-sys-typescale-title-large-size)}p{margin:0 0 16px;color:var(--md-sys-color-on-surface-variant)}
  a{color:var(--md-sys-color-primary)}a:focus-visible{outline:3px solid var(--md-sys-color-primary);outline-offset:3px}
  .meta{font-size:12px;overflow-wrap:anywhere}.intro{max-width:900px}.guide{background:var(--md-sys-color-surface-container);border-radius:var(--md-sys-shape-large);padding:20px;max-width:950px}.guide p:last-child{margin-bottom:0}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
  .swatch,.color-pair,.shape-sample,.icon-sample,.type-sample{background:var(--md-sys-color-surface-container-low);border:1px solid var(--md-sys-color-outline-variant);border-radius:12px;padding:12px;min-width:0}
  code{font:12px ui-monospace,monospace;overflow-wrap:anywhere}small{display:block;color:var(--md-sys-color-on-surface-variant);line-height:1.4}
  .comparison-paints{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.comparison-paints span{font-size:11px}.swatch-paint,.pair-paint{height:60px;border-radius:8px;border:1px solid var(--md-sys-color-outline-variant);margin-top:4px}.pair-paint{display:grid;place-items:center;text-align:center;padding:4px}
  .type-list{display:grid;gap:10px}.type-sample{overflow:hidden}.type-sample code{display:block;margin-bottom:8px}.type-sample div{overflow-wrap:anywhere;margin-top:8px}
  .shape-sample div{height:70px;background:var(--md-sys-color-primary-container);margin-bottom:8px}.icon-sample{display:flex;align-items:center;flex-direction:column;gap:10px}
  .icon-sample svg{width:32px;height:32px}.elevation-grid{display:grid;gap:28px;max-width:950px;margin:22px 0}
  .elevation-row{display:grid;grid-template-columns:minmax(175px,1fr) repeat(2,minmax(150px,1fr));align-items:center;gap:24px;padding:12px 20px;background:var(--md-sys-color-surface-container);border-radius:var(--md-sys-shape-large)}
  .elevation-label{display:grid;gap:6px}.elevation-card{position:relative;isolation:isolate;background:var(--md-sys-color-surface-container-low);border-radius:var(--md-sys-shape-medium);padding:30px 8px;text-align:center;min-height:76px;display:grid;place-items:center;font-size:12px}
  .elevation-layer{position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none}
  .surface-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;max-width:950px}.surface-sample{border:1px solid var(--md-sys-color-outline-variant);border-radius:12px;padding:20px 10px;background:var(--sample-color);color:var(--md-sys-color-on-surface);min-height:72px}
  .motion-stage{height:96px;padding:22px;background:var(--md-sys-color-surface-container-low);border-radius:12px;overflow:hidden}
  .motion-dot{width:44px;height:44px;border-radius:50%;background:var(--md-sys-color-primary);transition:transform var(--astryx-theme-material3-motion-duration-medium2) var(--astryx-theme-material3-motion-easing-standard)}
  .motion-dot.moved{transform:translateX(min(55vw,350px))}
  @media(prefers-reduced-motion:reduce){.motion-dot{transition-duration:0ms}}
  .reduce-motion .motion-dot{transition-duration:0ms}
  .outline-aid .swatch,.outline-aid .color-pair,.outline-aid .shape-sample,.outline-aid .icon-sample,.outline-aid .type-sample,.outline-aid .elevation-card{outline:2px solid var(--md-sys-color-on-surface)}
  @media(forced-colors:active){.swatch,.color-pair,.shape-sample,.icon-sample,.type-sample,.elevation-card{border:2px solid CanvasText}.elevation-layer{box-shadow:none!important}}
  @media(max-width:600px){.theme{padding:16px}.grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}.elevation-row{grid-template-columns:1fr 1fr;gap:14px;padding:16px}.elevation-label{grid-column:1/-1}}
</style></head>
<body data-revision="${sha}"><main class="theme" data-astryx-theme="material3">
  <h1>Material 3 foundation comparison</h1><p class="intro">Compare Astryx's rendered foundation with the pinned Material Web web implementation. The Material 3 guidance explains which roles mean what; the pinned values give us an exact web reference.</p>
  <p class="meta">Astryx ${sha.slice(0, 12)} · Material Web ${colors.sourceCommit.slice(0, 12)} · Material Symbols ${icons.sourceCommit.slice(0, 12)}</p>
  <div class="guide"><strong>How to review</strong><p>Start with elevation below. Compare each left reference to Astryx on the right in light and dark mode. The level number and dp distance come from Material 3; the shadows come from pinned Material Web. Then inspect color pairs, text, shape, motion, and icons. Try RTL and a narrow window. Component behavior will be reviewed in later stories.</p><p>Use <a href="https://m3.material.io/styles/elevation/overview">Material 3 elevation overview</a> for the design intent and <a href="https://github.com/material-components/material-web/blob/${elevation.sourceCommit}/elevation/internal/_elevation.scss">pinned Material Web elevation</a> for the web shadow geometry.</p></div>
  <div class="toolbar" aria-label="Preview controls"><button id="mode" type="button">Switch to dark</button><button id="direction" type="button">Switch to RTL</button>
    <button id="contrast" type="button" aria-pressed="false">Outline aid</button><button id="motion" type="button" aria-pressed="false">Reduced motion preview</button></div>
  <section aria-labelledby="elevation"><h2 id="elevation">Elevation · six levels</h2><p><a href="https://m3.material.io/styles/elevation/tokens">Material 3 level tokens</a> define 0, 1, 3, 6, 8, and 12 dp. Material Web maps level numbers to two translucent shadow layers. Levels 4 and 5 are interaction states, not resting defaults. Compare shadow size and softness in both modes.</p><div class="elevation-grid">${elevationSamples}</div>
    <p>Surface colors are a separate way to show hierarchy. <a href="https://m3.material.io/styles/elevation/applying-elevation">Material 3 applying elevation</a> does not assign these color roles one-to-one to shadow levels.</p>
    <div class="surface-grid">${['surface', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest'].map(role => `<div class="surface-sample" style="--sample-color:var(--md-sys-color-${role})"><code>${role}</code></div>`).join('')}</div></section>
  <section aria-labelledby="colors"><h2 id="colors">Color · 49 system roles</h2><p>Each role shows the pinned Material Web color beside the computed Astryx CSS color. Check light and dark mode; inspect these foreground and background pairs using the <a href="https://m3.material.io/styles/color/roles">Material 3 color roles</a> guidance.</p><div class="grid">${colorPairs}</div><h3>All 49 roles</h3><div class="grid">${swatches}</div></section>
  <section aria-labelledby="type"><h2 id="type">Typography · 15 roles</h2><p>Compare the pinned size, line height, and weight to the Astryx sample. Inspect readability and wrapping at narrow widths.</p><div class="type-list">${typeSamples}</div></section>
  <section aria-labelledby="shapes"><h2 id="shapes">Shape · 7 corner roles</h2><p>Compare each Material Web corner value with Astryx's computed border radius.</p><div class="grid">${shapeSamples}</div></section>
  <section aria-labelledby="motion-title"><h2 id="motion-title">Motion and state</h2><p>Standard easing: ${escape(motion.easings['easing-standard'])}; medium 2 duration: ${escape(motion.durations['duration-medium2'])}. Astryx's dot uses those tokens. Press the button to animate; press and hold a control to inspect active feedback. Reduced motion removes the transition.</p>
    <button id="animate" type="button">Move dot</button><div class="motion-stage"><div class="motion-dot"></div></div></section>
  <section aria-labelledby="icons"><h2 id="icons">Icons · 28 shared symbols</h2><p>This contact sheet uses pinned Material Symbols artwork rendered with Astryx's current foreground color. Component icon size and placement will be reviewed with each component.</p><div class="grid">${iconSamples}</div></section>
</main><script>
  const root=document.querySelector('.theme');
  const asHex=value=>'#'+(value.match(/\\d+/g)||[]).slice(0,3).map(number=>Number(number).toString(16).padStart(2,'0')).join('');
  const normalizeHex=value=>value.length===4?'#'+[...value.slice(1)].map(char=>char+char).join(''):value.toLowerCase();
  function refreshReadings(){
    const mode=document.documentElement.dataset.theme;
    for(const swatch of document.querySelectorAll('.swatch')){
      const expected=normalizeHex(swatch.dataset[mode]);
      swatch.querySelector('.reference-paint').style.backgroundColor=expected;
      const actual=asHex(getComputedStyle(swatch.querySelector('.actual-paint')).backgroundColor);
      swatch.querySelector('.color-reading').textContent=expected+' reference · '+actual+' Astryx'+(expected===actual?' · match':' · differs');
    }
    for(const pair of document.querySelectorAll('.color-pair')){
      const reference=pair.querySelector('.reference-paint');
      reference.style.backgroundColor=pair.dataset[mode+'Background'];
      reference.style.color=pair.dataset[mode+'Foreground'];
    }
    for(const shape of document.querySelectorAll('.shape-sample'))shape.querySelector('.shape-reading').textContent=getComputedStyle(shape.querySelector('div')).borderTopLeftRadius;
  }
  refreshReadings();
  document.querySelector('#mode').addEventListener('click',event=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';event.currentTarget.textContent=dark?'Switch to light':'Switch to dark';refreshReadings()});
  document.querySelector('#direction').addEventListener('click',event=>{const rtl=document.documentElement.dir!=='rtl';document.documentElement.dir=rtl?'rtl':'ltr';event.currentTarget.textContent=rtl?'Switch to LTR':'Switch to RTL'});
  for(const [id,className] of [['contrast','outline-aid'],['motion','reduce-motion']])document.querySelector('#'+id).addEventListener('click',event=>{const active=root.classList.toggle(className);event.currentTarget.setAttribute('aria-pressed',String(active))});
  document.querySelector('#animate').addEventListener('click',()=>document.querySelector('.motion-dot').classList.toggle('moved'));
</script></body></html>`;
const output = path.join(root, 'dist/preview.html');
fs.writeFileSync(output, html);
console.log(`Wrote ${output} for ${sha}.`);
