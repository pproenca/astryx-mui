// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Pinned-size focus comparison page and native FocusRing build. @output Standard and Expressive ring targets sharing one semantic focus driver. @position Native browser pixel comparison fixture. */
import React from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {FocusRing} from '../dist/FocusRing/FocusRing.js';

const driver = document.getElementById('driver')!;
const controlRef = {current: driver};
const outward = document.getElementById('outward-target');
if (outward) {
  flushSync(() => {
    createRoot(outward).render(
      <FocusRing
        placement="outward"
        controlRef={controlRef}
        data-testid="outward-ring"
      />,
    );
  });
} else {
  const expressive = document.getElementById('expressive-target')!;
  for (const token of [
    '--md-sys-color-secondary',
    '--md-sys-color-on-secondary',
    '--md-sys-color-surface-container-low',
  ]) {
    expressive.style.setProperty(
      token,
      getComputedStyle(document.body).getPropertyValue(token),
    );
  }
  flushSync(() => {
    createRoot(document.getElementById('standard-target')!).render(
      <FocusRing
        placement="inset"
        controlRef={controlRef}
        data-testid="standard-ring"
      />,
    );
    createRoot(expressive).render(
      <FocusRing
        placement="inset"
        controlRef={controlRef}
        data-testid="expressive-ring"
      />,
    );
  });
}
