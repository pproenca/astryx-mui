// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native Ripple, pinned Compose state-layer layout, tokens and licensed Roboto. @output Source-matched native state transition surface. @position Package-owned visual regression fixture. */
import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Ripple} from '../dist/Ripple/Ripple.js';

function App() {
  const [dragged, setDragged] = useState(false);
  useEffect(() => {
    const onDragged = (event: Event) =>
      flushSync(() => setDragged((event as CustomEvent<boolean>).detail));
    window.addEventListener('set-dragged', onDragged);
    return () => window.removeEventListener('set-dragged', onDragged);
  }, []);
  return (
    <main>
      <h1>{`Compose Ripple state layer · ${document.body.dataset.mdScheme === 'dark' ? 'dark' : 'light'}`}</h1>
      <p id="stage">
        Source-value browser rendering · most recent active interaction
      </p>
      <div className="row">
        <div className="sample">
          <div id="generic" className="target generic" tabIndex={0}>
            <Ripple dragged={dragged} data-testid="generic-ripple" />
          </div>
          <div className="label">OnSurface over Surface</div>
        </div>
        <div className="sample">
          <div id="button" className="target button" tabIndex={0}>
            <Ripple dragged={dragged} data-testid="button-ripple" />
            <span className="button-label">Filled Button</span>
          </div>
          <div className="label">OnPrimary over Primary</div>
        </div>
      </div>
      <div className="legend">
        Hover 8% · focus 10% · drag 16% · drag cancel and return-to-hover · DPR
        1
      </div>
    </main>
  );
}

const query = new URLSearchParams(location.search);
document.body.dataset.mdScheme =
  query.get('scheme') === 'dark' ? 'dark' : 'light';
createRoot(document.getElementById('root')!).render(<App />);
