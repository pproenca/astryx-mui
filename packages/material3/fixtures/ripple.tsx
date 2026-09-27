// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Ripple, Material tokens and browser interaction. @output Live bounded/unbounded, proxy, disabled, drag and reduced-motion QA. @position Package-owned native Ripple gallery fixture. */
import React, {useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Ripple} from '../dist/Ripple/Ripple.js';

function App() {
  const [scheme, setScheme] = useState('light');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [disabled, setDisabled] = useState(false);
  const [dragged, setDragged] = useState(false);
  const [proxy, setProxy] = useState(true);
  const [activationCount, setActivationCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  document.body.dataset.mdScheme = scheme;
  document.documentElement.dir = direction;
  return (
    <main>
      <h1>Native Material 3 Ripple</h1>
      <p>
        Press and release at different points, then try rapid re-press, Tab,
        Enter, Space, drag, disabled, proxy input, light/dark and Expressive.
        Use the browser reduced-motion and forced-colors settings to check
        accessibility behavior.
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
          Disable bounded control
        </label>
        <label>
          <input
            id="drag-toggle"
            type="checkbox"
            checked={dragged}
            onChange={event => setDragged(event.target.checked)}
          />{' '}
          Supply dragged state
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
        <h2>Press and state indication</h2>
        <div className="samples">
          <button
            id="bounded-owner"
            className="owner"
            type="button"
            disabled={disabled}
            onClick={() => setActivationCount(count => count + 1)}>
            <span>Bounded press</span>
            <Ripple data-testid="bounded-ripple" dragged={dragged} />
          </button>
          <button
            id="unbounded-owner"
            className="owner unbounded"
            type="button"
            onClick={() => setActivationCount(count => count + 1)}>
            <span>Unbounded press</span>
            <Ripple data-testid="unbounded-ripple" unbounded />
          </button>
        </div>
        <p className="notes">
          The owner handles activation. Activations:{' '}
          <output id="activation-count">{activationCount}</output>. Ripple only
          paints, and the control retains its focus indicator.
        </p>
      </section>
      <section>
        <h2>Separate semantic target</h2>
        <label className="proxy">
          {proxy && <input ref={inputRef} id="proxy-input" type="checkbox" />}
          <span className="indicator" id="proxy-owner">
            Pin
            <Ripple controlRef={inputRef} data-testid="proxy-ripple" />
          </span>
          Pin item
        </label>
        <p className="notes">
          The input owns the checked state and keyboard action. The indicator
          carries only its visual Ripple.
        </p>
      </section>
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
