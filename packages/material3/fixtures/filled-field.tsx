// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file filled-field.tsx
 * @input Built native FilledField export, Material roles, and a caller-owned input
 * @output Interactive filled field state, focus, form, theme, direction, and opt-in affix QA
 * @position Package-owned native field gallery fixture
 */

import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {FilledField} from '../dist/FilledField/index.js';

function App() {
  const [scheme, setScheme] = useState('light');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [focus, setFocus] = useState<'auto' | 'on' | 'off'>('auto');
  const [revision, setRevision] = useState('Loading revision…');
  const [affixValue, setAffixValue] = useState('');
  const showAffixCheck = new URLSearchParams(location.search).has('affixes');
  const input = useRef<HTMLInputElement>(null);
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
  const focused = focus === 'auto' ? undefined : focus === 'on';
  return (
    <main>
      <span className="eyebrow">Native Material 3 · custom control shell</span>
      <h1>FilledField</h1>
      <p className="intro">
        A caller-owned input inside Compose filled decoration. Focus, error,
        disabled, populated, light/dark, Expressive and RTL states are live.
      </p>
      <p className="revision" id="revision">
        Revision: {revision}
      </p>
      <div className="controls">
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
        <label>
          Visual focus
          <select
            value={focus}
            onChange={event =>
              setFocus(event.target.value as 'auto' | 'on' | 'off')
            }>
            <option value="auto">Observe input</option>
            <option value="on">Force on</option>
            <option value="off">Force off</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={error}
            onChange={event => setError(event.target.checked)}
          />
          Error
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={disabled}
            onChange={event => setDisabled(event.target.checked)}
          />
          Disabled
        </label>
        <button type="button" onClick={() => input.current?.focus()}>
          Focus input
        </button>
        <button type="button" onClick={() => input.current?.blur()}>
          Blur input
        </button>
      </div>
      <div className="samples">
        <section className="sample">
          <h2>Filled input</h2>
          <form onSubmit={event => event.preventDefault()}>
            <FilledField
              className="field"
              label={<label htmlFor="native-email">Email address</label>}
              supportingText={
                <span id="email-help">
                  {error ? 'Enter a valid email address' : 'Supporting text'}
                </span>
              }
              focused={focused}
              populated={value.length > 0}
              disabled={disabled}
              error={error}>
              <input
                ref={input}
                id="native-email"
                name="email"
                type="email"
                value={value}
                placeholder="name@example.com"
                aria-describedby="email-help"
                aria-invalid={error}
                disabled={disabled}
                onChange={event => setValue(event.target.value)}
              />
            </FilledField>
          </form>
          <p className="note">
            The input owns its value, keyboard, validation and form behavior.
            The shell paints only Material decoration.
          </p>
        </section>
        <section className="sample">
          <h2>State checks</h2>
          <p className="note">
            Tab to the input, type, blur, refocus and reverse quickly. Toggle
            Expressive and reduced motion in browser settings. At narrow width
            and RTL, the label and input should remain aligned. Disabled and
            error flags must also be set on the input.
          </p>
        </section>
        {showAffixCheck && (
          <section className="sample">
            <h2>Affix phase</h2>
            <FilledField
              className="field"
              label={<label htmlFor="affix-value">Amount</label>}
              prefix="$"
              suffix=".00"
              populated={affixValue.length > 0}>
              <input
                id="affix-value"
                value={affixValue}
                onChange={event => setAffixValue(event.target.value)}
              />
            </FilledField>
          </section>
        )}
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
