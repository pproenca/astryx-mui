// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file divider.tsx
 * @input Built public native Divider exports and Material 3 tokens
 * @output Interactive horizontal and vertical Divider QA across scheme, direction and semantics
 * @position Package-owned native Divider gallery fixture
 */

import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {HorizontalDivider, VerticalDivider} from '../dist/Divider/index.js';

function App() {
  const [scheme, setScheme] = useState('light');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [thickness, setThickness] = useState('1');
  const [inset, setInset] = useState('none');
  const [color, setColor] = useState('default');
  const [semantic, setSemantic] = useState(false);
  document.body.dataset.mdScheme = scheme;
  document.documentElement.dir = direction;
  const selectedThickness =
    thickness === 'hairline' ? 'hairline' : Number(thickness);
  const selectedColor = color === 'default' ? undefined : color;
  const selectedInset =
    inset === 'none' ? undefined : (inset as 'both' | 'start' | 'end');
  const role = semantic ? ('separator' as const) : undefined;
  return (
    <main>
      <p className="eyebrow">Native Material 3</p>
      <h1>Horizontal and vertical dividers</h1>
      <p className="intro">
        Inspect Compose color and thickness, a one-device-pixel hairline, the
        selected 16px logical inset, and decorative or explicit separator
        semantics. These are native package exports.
      </p>
      <p id="revision" className="revision" />
      <fieldset>
        <legend>Live Divider controls</legend>
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
          Thickness
          <select
            id="thickness"
            value={thickness}
            onChange={event => setThickness(event.target.value)}>
            <option value="1">1 CSS px</option>
            <option value="3">3 CSS px</option>
            <option value="20">20 CSS px</option>
            <option value="hairline">Hairline</option>
          </select>
        </label>
        <label>
          Horizontal inset
          <select
            id="inset"
            value={inset}
            onChange={event => setInset(event.target.value)}>
            <option value="none">None</option>
            <option value="both">Both</option>
            <option value="start">Start</option>
            <option value="end">End</option>
          </select>
        </label>
        <label>
          Color
          <select
            id="color"
            value={color}
            onChange={event => setColor(event.target.value)}>
            <option value="default">OutlineVariant token</option>
            <option value="#6750a4">Custom purple</option>
            <option value="#006a60">Custom teal</option>
          </select>
        </label>
        <label className="check">
          <input
            id="semantic"
            type="checkbox"
            checked={semantic}
            onChange={event => setSemantic(event.target.checked)}
          />
          Semantic separator
        </label>
      </fieldset>
      <div className="grid">
        <section className="card" aria-labelledby="horizontal-title">
          <h2 id="horizontal-title">HorizontalDivider</h2>
          <p className="note">
            The inset follows writing direction. The line does not move or take
            focus.
          </p>
          <div className="sample">
            <HorizontalDivider
              data-testid="horizontal-divider"
              thickness={selectedThickness}
              color={selectedColor}
              inset={selectedInset}
              role={role}
            />
          </div>
          <p className="note">
            Hairline occupies zero height and paints one physical pixel.
          </p>
        </section>
        <section className="card" aria-labelledby="vertical-title">
          <h2 id="vertical-title">VerticalDivider</h2>
          <p className="note">
            The container supplies height. A hairline occupies zero width.
          </p>
          <div className="vertical-sample">
            <span>Start</span>
            <VerticalDivider
              data-testid="vertical-divider"
              thickness={selectedThickness}
              color={selectedColor}
              role={role}
            />
            <span>End</span>
          </div>
          <p className="note">
            A meaningful boundary enters the accessibility tree only when
            selected.
          </p>
        </section>
      </div>
    </main>
  );
}

const root = document.getElementById('root');
if (!root) {throw new Error('Missing Divider gallery root.');}
createRoot(root).render(<App />);
fetch('../revision.json')
  .then(response => response.json())
  .then(({revision, dirty}) => {
    const label = document.getElementById('revision');
    if (label)
      {label.textContent = `Current native build: ${revision}${dirty ? ' · local changes' : ''}`;}
  });
