// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file build-preview.mjs
 * @input Built Material 3 CSS, pinned foundation artifacts, and Git revision
 * @output Interactive dist/preview.html for exact-revision foundation QA
 * @position Material 3 visual foundation preview generator
 */

import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
const read = name =>
  JSON.parse(fs.readFileSync(path.join(root, `src/${name}.json`), 'utf8'));
const css = fs.readFileSync(path.join(root, 'dist/theme.css'), 'utf8');
const colors = read('material3ColorSource');
const typography = read('material3TypographySource');
const shapes = read('material3ShapeSource');
const elevation = read('material3ElevationSource');
const icons = read('material3IconSource');
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
  <article class="swatch"><div class="swatch-paint" style="background:var(--md-sys-color-${role})"></div>
  <code>${escape(role)}</code></article>`,
  )
  .join('');
const typeRoles = Object.keys(typography.typescale)
  .filter(key => key.endsWith('-size'))
  .map(key => key.slice(0, -5));
const typeSamples = typeRoles
  .map(
    role => `
  <article class="type-sample"><code>${escape(role)}</code><div style="font-family:var(--md-sys-typescale-${role}-font),Arial,sans-serif;
    font-size:var(--md-sys-typescale-${role}-size);line-height:var(--md-sys-typescale-${role}-line-height);
    font-weight:var(--md-sys-typescale-${role}-weight);letter-spacing:var(--astryx-theme-material3-typescale-${role}-tracking)">Astryx Material 3</div></article>`,
  )
  .join('');
const shapeSamples = Object.keys(shapes.cssCorners)
  .map(
    role => `
  <article class="shape-sample"><div style="border-radius:var(--md-sys-shape-${role})"></div>
    <code>${escape(role)}</code></article>`,
  )
  .join('');
const elevationSamples = Object.entries(elevation.layers)
  .map(([role, layers]) => {
    const layer = name =>
      `<i class="elevation-layer" style="box-shadow:${layers[name].boxShadow.replace(elevation.sampleColor, 'var(--md-sys-color-shadow)')};opacity:${layers[name].opacity}"></i>`;
    return `<article class="elevation-card">${layer('key')}${layer('ambient')}<strong>${role}</strong></article>`;
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
  .meta{font-size:12px;overflow-wrap:anywhere}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  .swatch,.shape-sample,.icon-sample,.type-sample{background:var(--md-sys-color-surface-container-low);border:1px solid var(--md-sys-color-outline-variant);border-radius:12px;padding:12px;min-width:0}
  code{font:12px ui-monospace,monospace;overflow-wrap:anywhere}.swatch-paint{height:76px;border-radius:8px;border:1px solid var(--md-sys-color-outline-variant);margin-bottom:8px}
  .type-list{display:grid;gap:10px}.type-sample{overflow:hidden}.type-sample code{display:block;margin-bottom:8px}.type-sample div{overflow-wrap:anywhere}
  .shape-sample div{height:70px;background:var(--md-sys-color-primary-container);margin-bottom:8px}.icon-sample{display:flex;align-items:center;flex-direction:column;gap:10px}
  .icon-sample svg{width:32px;height:32px}.elevation-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:22px;padding:18px}
  .elevation-card{position:relative;isolation:isolate;background:var(--md-sys-color-surface-container-low);border-radius:var(--md-sys-shape-medium);padding:35px 12px;text-align:center}
  .elevation-layer{position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none}
  .motion-stage{height:96px;padding:22px;background:var(--md-sys-color-surface-container-low);border-radius:12px;overflow:hidden}
  .motion-dot{width:44px;height:44px;border-radius:50%;background:var(--md-sys-color-primary);transition:transform var(--astryx-theme-material3-motion-duration-medium2) var(--astryx-theme-material3-motion-easing-standard)}
  .motion-dot.moved{transform:translateX(min(55vw,350px))}
  @media(prefers-reduced-motion:reduce){.motion-dot{transition-duration:0ms}}
  .reduce-motion .motion-dot{transition-duration:0ms}
  .high-contrast .swatch,.high-contrast .shape-sample,.high-contrast .icon-sample,.high-contrast .type-sample,.high-contrast .elevation-card{outline:2px solid var(--md-sys-color-on-surface)}
  @media(forced-colors:active){.swatch,.shape-sample,.icon-sample,.type-sample,.elevation-card{border:2px solid CanvasText}.elevation-layer{box-shadow:none!important}}
  @media(max-width:600px){.theme{padding:16px}.grid{grid-template-columns:repeat(auto-fill,minmax(125px,1fr))}}
</style></head>
<body data-revision="${sha}"><main class="theme" data-astryx-theme="material3">
  <h1>Material 3 foundation</h1><p>Color, typography, shape, motion, elevation, and shared icon artwork.</p>
  <p class="meta">Astryx ${sha.slice(0, 12)} · Material Web ${colors.sourceCommit.slice(0, 12)} · Material Symbols ${icons.sourceCommit.slice(0, 12)}</p>
  <div class="toolbar" aria-label="Preview controls"><button id="mode" type="button">Switch to dark</button><button id="direction" type="button">Switch to RTL</button>
    <button id="contrast" type="button" aria-pressed="false">High contrast preview</button><button id="motion" type="button" aria-pressed="false">Reduced motion preview</button></div>
  <section aria-labelledby="colors"><h2 id="colors">49 system color roles</h2><div class="grid">${swatches}</div></section>
  <section aria-labelledby="type"><h2 id="type">15 type roles</h2><div class="type-list">${typeSamples}</div></section>
  <section aria-labelledby="shapes"><h2 id="shapes">7 CSS corner roles</h2><div class="grid">${shapeSamples}</div></section>
  <section aria-labelledby="motion-title"><h2 id="motion-title">Motion and state</h2><p>Press the button to play the standard easing; press and hold to inspect the state layer.</p>
    <button id="animate" type="button">Move dot</button><div class="motion-stage"><div class="motion-dot"></div></div></section>
  <section aria-labelledby="elevation"><h2 id="elevation">6 elevation levels</h2><div class="elevation-grid">${elevationSamples}</div></section>
  <section aria-labelledby="icons"><h2 id="icons">28 shared symbols</h2><div class="grid">${iconSamples}</div></section>
</main><script>
  const root=document.querySelector('.theme');
  document.querySelector('#mode').addEventListener('click',event=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';event.currentTarget.textContent=dark?'Switch to light':'Switch to dark'});
  document.querySelector('#direction').addEventListener('click',event=>{const rtl=document.documentElement.dir!=='rtl';document.documentElement.dir=rtl?'rtl':'ltr';event.currentTarget.textContent=rtl?'Switch to LTR':'Switch to RTL'});
  for(const [id,className] of [['contrast','high-contrast'],['motion','reduce-motion']])document.querySelector('#'+id).addEventListener('click',event=>{const active=root.classList.toggle(className);event.currentTarget.setAttribute('aria-pressed',String(active))});
  document.querySelector('#animate').addEventListener('click',()=>document.querySelector('.motion-dot').classList.toggle('moved'));
</script></body></html>`;
const output = path.join(root, 'dist/preview.html');
fs.writeFileSync(output, html);
console.log(`Wrote ${output} for ${sha}.`);
