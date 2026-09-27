// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file elevation.tsx
 * @input Built native Elevation export and Material token CSS
 * @output Interactive six-level, theme, shape, and pointer QA
 * @position Package-owned native Elevation gallery fixture
 */

import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Elevation} from '../dist/Elevation/index.js';

type Level = 0 | 1 | 2 | 3 | 4 | 5;
const levels: Level[] = [0, 1, 2, 3, 4, 5];
const dp = [0, 1, 3, 6, 8, 12];

function App() {
  const [scheme, setScheme] = useState('light');
  const [level, setLevel] = useState<Level>(3);
  const [radius, setRadius] = useState('16px');
  const [color, setColor] = useState('default');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [presses, setPresses] = useState(0);
  const [revision, setRevision] = useState('Loading revision…');
  useEffect(() => {
    fetch('../revision.json')
      .then(response => response.json())
      .then(data =>
        setRevision(
          data.revision + (data.dirty ? ' (working tree changed)' : ''),
        ),
      )
      .catch(() => setRevision('Revision unavailable'));
  }, []);
  document.body.dataset.mdScheme = scheme;
  document.documentElement.dir = direction;
  const ownerStyle = {
    '--sample-radius': radius,
    ...(color === 'custom' ? {'--md-sys-color-shadow': '#2549aa'} : {}),
  } as React.CSSProperties;
  return (
    <main>
      <p className="eyebrow">Native Material 3</p>
      <h1>Elevation</h1>
      <p className="intro">
        Six static Compose levels with separate key and ambient shadows. The
        visual owner supplies surface color, shape and interaction.
      </p>
      <p className="source-line">
        <span>
          Status: native package preview; 24 matched shadow crops have zero
          changed pixels.
        </span>
        <a
          href="https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Surface.kt"
          target="_blank"
          rel="noreferrer">
          Pinned Compose Surface
        </a>
        <a
          href="https://github.com/material-components/material-web/blob/cbd34a8921915af94d5ef65c2a69eece41d5b4f3/elevation/elevation.ts"
          target="_blank"
          rel="noreferrer">
          Web browser layer
        </a>
      </p>
      <p className="revision">Revision: {revision}</p>
      <fieldset>
        <legend>Live Elevation controls</legend>
        <label>
          Scheme
          <select
            value={scheme}
            onChange={event => setScheme(event.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="expressive-light">Expressive light</option>
          </select>
        </label>
        <label>
          Action shadow level
          <select
            id="level"
            value={level}
            onChange={event => setLevel(Number(event.target.value) as Level)}>
            {levels.map(value => (
              <option key={value} value={value}>
                Level {value} · {dp[value]} dp
              </option>
            ))}
          </select>
        </label>
        <label>
          Owner shape
          <select
            value={radius}
            onChange={event => setRadius(event.target.value)}>
            <option value="4px">4 px</option>
            <option value="16px">16 px</option>
            <option value="28px">28 px</option>
            <option value="999px">Full</option>
          </select>
        </label>
        <label>
          Scoped shadow color
          <select
            value={color}
            onChange={event => setColor(event.target.value)}>
            <option value="default">Material token</option>
            <option value="custom">Custom blue token</option>
          </select>
        </label>
        <label>
          Direction
          <select
            value={direction}
            onChange={event =>
              setDirection(event.target.value as 'ltr' | 'rtl')
            }>
            <option value="ltr">LTR</option>
            <option value="rtl">RTL</option>
          </select>
        </label>
      </fieldset>
      <section aria-labelledby="levels-title">
        <h2 id="levels-title">All six levels</h2>
        <div className="levels" style={ownerStyle}>
          {levels.map(value => (
            <div className="sample" key={value}>
              <div className="visual-owner">
                <Elevation level={value} data-testid={`elevation-${value}`} />
                <span>Surface</span>
              </div>
              <p>
                Level {value} · {dp[value]} dp
              </p>
            </div>
          ))}
        </div>
      </section>
      <section
        className="action-zone"
        aria-labelledby="interaction-title"
        style={ownerStyle}>
        <h2 id="interaction-title">Pointer and keyboard ownership</h2>
        <p>
          The button remains the sole action and focus target. Its Elevation
          adds no transition.
        </p>
        <button type="button" onClick={() => setPresses(value => value + 1)}>
          <Elevation level={level} data-testid="action-elevation" />
          <span>Press or focus this owner</span>
        </button>
        <div className="counter" aria-live="polite">
          Owner activations: {presses}
        </div>
      </section>
      <p className="note">
        Tonal elevation is separate and remains with native Surface or the
        visual owner.
      </p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
