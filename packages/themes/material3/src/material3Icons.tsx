// Copyright (c) Meta Platforms, Inc. and affiliates.
// Source artwork: Copyright Google LLC, Apache-2.0.

/**
 * @file material3Icons.tsx
 * @input Pinned Google Material Symbols outlined and filled SVG paths
 * @output Complete theme-scoped Astryx shared icon registry
 * @position Material 3 theme artwork; Core icon names and sizes remain stable
 *
 * SVG paths avoid an external icon-font dependency. Icon owns the accessible
 * name and sizing; each registry glyph is decorative and scales to 1em.
 */

import React from 'react';
import source from './material3IconSource.json';

type Material3IconName = keyof typeof source.artwork;

function icon(name: Material3IconName) {
  const artwork = source.artwork[name];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="1em"
      height="1em"
      viewBox={artwork.viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg">
      {artwork.paths.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}

export const material3IconRegistry = {
  close: icon('close'),
  chevronDown: icon('chevronDown'),
  chevronLeft: icon('chevronLeft'),
  chevronRight: icon('chevronRight'),
  chevronsLeft: icon('chevronsLeft'),
  chevronsRight: icon('chevronsRight'),
  check: icon('check'),
  success: icon('success'),
  error: icon('error'),
  warning: icon('warning'),
  info: icon('info'),
  calendar: icon('calendar'),
  clock: icon('clock'),
  externalLink: icon('externalLink'),
  menu: icon('menu'),
  moreHorizontal: icon('moreHorizontal'),
  search: icon('search'),
  arrowUp: icon('arrowUp'),
  arrowDown: icon('arrowDown'),
  arrowsUpDown: icon('arrowsUpDown'),
  funnel: icon('funnel'),
  eyeSlash: icon('eyeSlash'),
  viewColumns: icon('viewColumns'),
  copy: icon('copy'),
  checkDouble: icon('checkDouble'),
  wrench: icon('wrench'),
  stop: icon('stop'),
  microphone: icon('microphone'),
};
