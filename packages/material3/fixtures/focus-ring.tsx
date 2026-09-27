// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native FocusRing, Material tokens and browser focus controls. @output Interactive inset, outward and proxy native preview. @position Package-owned FocusRing QA fixture. */
import React, {useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {FocusRing} from '../dist/FocusRing/FocusRing.js';

function App() {
  const [scheme, setScheme] = useState('light');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [disabled, setDisabled] = useState(false);
  const [proxy, setProxy] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const invalid = new URLSearchParams(location.search).has('invalid');
  document.body.dataset.mdScheme = scheme;
  document.documentElement.dir = direction;

  return (
    <main>
      <h1>Native Material 3 FocusRing</h1>
      <p>
        Opt-in visual focus for custom controls. Use Tab and Shift+Tab, then
        compare pointer focus, blur, rapid refocus, and scheme changes.
      </p>
      <p id="revision" className="revision" />
      <div className="controls">
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
          <input
            id="disabled-toggle"
            type="checkbox"
            checked={disabled}
            onChange={event => setDisabled(event.target.checked)}
          />{' '}
          Disable inset button
        </label>
        <label>
          <input
            id="proxy-toggle"
            type="checkbox"
            checked={proxy}
            onChange={event => setProxy(event.target.checked)}
          />{' '}
          Mount proxy input
        </label>
      </div>
      <section>
        <h2>Selected geometry</h2>
        <div className="samples">
          <button
            className="owner"
            id="inset-owner"
            type="button"
            disabled={disabled}>
            Compose inset
            <FocusRing placement="inset" data-testid="inset-ring" />
          </button>
          <button className="owner outward" id="outward-owner" type="button">
            Web outward
            <FocusRing placement="outward" data-testid="outward-ring" />
          </button>
        </div>
        <p className="notes">
          Inset follows the owner shape with Secondary and OnSecondary strokes.
          Outward uses the explicit 3→8→3 px Web motion and needs visible
          overflow.
        </p>
      </section>
      <section>
        <h2>Separate focus target</h2>
        <label className="proxy">
          {proxy && <input ref={inputRef} id="proxy-input" type="checkbox" />}
          <span className="indicator" id="proxy-owner">
            <FocusRing
              placement="inset"
              controlRef={inputRef}
              data-testid="proxy-ring"
            />
          </span>
          Pin item
        </label>
        <p className="notes">
          The input owns keyboard, name and checked state; the ring paints on
          its visible indicator.
        </p>
      </section>
      {invalid && (
        <section>
          <h2>Invalid placement diagnostics</h2>
          <div className="samples">
            <button
              className="owner"
              id="static-owner"
              style={{position: 'static'}}
              type="button">
              Unpositioned owner
              <FocusRing placement="inset" data-testid="static-ring" />
            </button>
            <button
              className="owner outward"
              id="clipped-owner"
              style={{overflow: 'hidden'}}
              type="button">
              Clipped outward owner
              <FocusRing placement="outward" data-testid="clipped-ring" />
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
fetch('../revision.json')
  .then(response => response.json())
  .then(({revision, dirty}) => {
    document.getElementById('revision')!.textContent =
      `Current native build: ${revision}${dirty ? ' (working tree changed)' : ''}`;
  });
