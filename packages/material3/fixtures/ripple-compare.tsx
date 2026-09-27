// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native Ripple and pinned source viewport, font, Material roles and geometry. @output Source-matched native press comparison surface. @position Package-owned visual regression fixture. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Ripple} from '../dist/Ripple/Ripple.js';

function App() {
  return (
    <main>
      <h1>
        Compose Ripple press ·{' '}
        {document.body.dataset.mdScheme === 'dark' ? 'Dark' : 'Light'}
      </h1>
      <p id="stage">
        Source-value browser rendering · early release and repeated press
      </p>
      <div className="row">
        <div className="sample">
          <div id="bounded" className="target bounded">
            <Ripple data-testid="bounded-ripple" />
          </div>
          <div className="label">Bounded · starts at press point</div>
        </div>
        <div className="sample">
          <div id="unbounded" className="target unbounded">
            <Ripple unbounded data-testid="unbounded-ripple" />
          </div>
          <div className="label">Unbounded · starts at center</div>
        </div>
      </div>
      <div className="legend">
        OnSurface at 10% · release 50ms · press 160ms · press 300ms · release
        400ms · DPR 1
      </div>
    </main>
  );
}

const query = new URLSearchParams(location.search);
document.body.dataset.mdScheme =
  query.get('scheme') === 'dark' ? 'dark' : 'light';
createRoot(document.getElementById('root')!).render(<App />);
