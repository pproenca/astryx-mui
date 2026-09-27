// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file icons.tsx
 * @input Built native Icon and MaterialSymbol, selected licensed artwork, and gallery controls
 * @output Interactive native glyph preview for light, dark, direction, size, and font axes
 * @position Package-owned Icon gallery fixture; font binaries are supplied only for local QA
 */

import React, {useState, type SVGProps} from 'react';
import {createRoot} from 'react-dom/client';
import {Icon} from '../dist/Icon/Icon.js';
import {MaterialSymbol} from '../dist/MaterialSymbol/MaterialSymbol.js';

const artwork = {
  close:
    'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z',
  check: 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z',
  search:
    'M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z',
} as const;
type Glyph = keyof typeof artwork;
const glyphs = Object.keys(artwork) as Glyph[];
const svg = (name: Glyph) => (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 -960 960 960" fill="currentColor" {...props}>
    <path d={artwork[name]} />
  </svg>
);

function App() {
  const [scheme, setScheme] = useState('light');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [variant, setVariant] = useState<'outlined' | 'rounded' | 'sharp'>(
    'outlined',
  );
  const [size, setSize] = useState(24);
  const [fill, setFill] = useState(0);
  const [weight, setWeight] = useState(400);
  const [grade, setGrade] = useState(0);
  const [opticalSize, setOpticalSize] = useState(24);
  const [named, setNamed] = useState(false);
  const fontAvailable =
    document.documentElement.dataset.fontAvailable === 'true';
  document.body.dataset.mdScheme = scheme;
  document.documentElement.dir = direction;

  return (
    <main>
      <header>
        <p className="eyebrow">Native Material 3</p>
        <h1>Icon and Material Symbol</h1>
        <p>
          Supplied SVG artwork and optional font glyphs. Icons are
          presentational; the control around an icon owns its target and
          interaction.
        </p>
        <p id="revision" className="revision" />
      </header>
      <fieldset className="controls">
        <legend>Preview controls</legend>
        <label>
          Scheme
          <select
            id="scheme"
            value={scheme}
            onChange={event => setScheme(event.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="expressive-light">Expressive light</option>
          </select>
        </label>
        <label>
          Direction
          <select
            id="direction"
            value={direction}
            onChange={event =>
              setDirection(event.target.value as 'ltr' | 'rtl')
            }>
            <option value="ltr">LTR</option>
            <option value="rtl">RTL</option>
          </select>
        </label>
        <label>
          Size
          <select
            id="size"
            value={size}
            onChange={event => setSize(Number(event.target.value))}>
            <option value={16}>16 px</option>
            <option value={20}>20 px</option>
            <option value={24}>24 px</option>
            <option value={32}>32 px</option>
          </select>
        </label>
        <label>
          Accessible name
          <input
            id="named"
            type="checkbox"
            checked={named}
            onChange={event => setNamed(event.target.checked)}
          />
        </label>
      </fieldset>
      <section aria-labelledby="svg-heading">
        <h2 id="svg-heading">Supplied SVG</h2>
        <p>
          Google Material Symbols Outlined paths at the pinned artwork revision.
          The SVG inherits the surrounding text color.
        </p>
        <div className="cards">
          {glyphs.map(name => (
            <div className="card" key={name}>
              <Icon
                icon={svg(name)}
                size={size}
                label={named ? name : undefined}
                data-testid={`svg-${name}`}
              />
              <span>{name}</span>
            </div>
          ))}
          <div className="card primary">
            <Icon icon={svg('check')} size={size} data-testid="svg-primary" />
            <span>Primary tint</span>
          </div>
        </div>
      </section>
      <section aria-labelledby="font-heading">
        <h2 id="font-heading">Material Symbols font</h2>
        <p>
          The app supplies the selected font family. This preview loads pinned
          local fonts when available.
        </p>
        {!fontAvailable && (
          <p className="font-note" role="status">
            Font samples need a locally supplied Material Symbols font; SVG
            samples above remain available.
          </p>
        )}
        <fieldset className="controls">
          <legend>Font options</legend>
          <label>
            Family
            <select
              id="variant"
              value={variant}
              onChange={event =>
                setVariant(event.target.value as typeof variant)
              }>
              <option value="outlined">Outlined</option>
              <option value="rounded">Rounded</option>
              <option value="sharp">Sharp</option>
            </select>
          </label>
          <label>
            Fill{' '}
            <input
              id="fill"
              type="range"
              min="0"
              max="1"
              step="1"
              value={fill}
              onChange={event => setFill(Number(event.target.value))}
            />
            {fill}
          </label>
          <label>
            Weight{' '}
            <input
              id="weight"
              type="range"
              min="100"
              max="700"
              step="100"
              value={weight}
              onChange={event => setWeight(Number(event.target.value))}
            />
            {weight}
          </label>
          <label>
            Grade{' '}
            <input
              id="grade"
              type="range"
              min="-50"
              max="200"
              step="25"
              value={grade}
              onChange={event => setGrade(Number(event.target.value))}
            />
            {grade}
          </label>
          <label>
            Optical size{' '}
            <input
              id="optical-size"
              type="range"
              min="20"
              max="48"
              step="4"
              value={opticalSize}
              onChange={event => setOpticalSize(Number(event.target.value))}
            />
            {opticalSize}
          </label>
        </fieldset>
        <div className="cards" aria-hidden={fontAvailable ? undefined : true}>
          {glyphs.map(name => (
            <div className="card" key={name}>
              <MaterialSymbol
                name={name}
                variant={variant}
                size={size}
                fill={fill}
                weight={weight}
                grade={grade}
                opticalSize={opticalSize}
                label={named && fontAvailable ? name : undefined}
                data-testid={`font-${name}`}
              />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="composition-heading">
        <h2 id="composition-heading">Composition</h2>
        <p>
          A named button owns keyboard focus and activation; its glyph remains
          decorative.
        </p>
        <button
          type="button"
          className="example-button"
          onClick={event => {
            event.currentTarget.dataset.pressed = 'true';
          }}>
          <Icon icon={svg('check')} size={20} /> Confirm
        </button>
      </section>
      <footer>
        Artwork © Google LLC, Apache-2.0. Native component implementation © Meta
        Platforms, Inc. and affiliates.
      </footer>
    </main>
  );
}

fetch('../revision.json')
  .then(response => response.json())
  .then(({revision, dirty}) => {
    const node = document.querySelector('#revision');
    if (node)
      {node.textContent = `Revision ${revision}${dirty ? ' (local changes)' : ''}`;}
  });
createRoot(document.getElementById('root')!).render(<App />);
