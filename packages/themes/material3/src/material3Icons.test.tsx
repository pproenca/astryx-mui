// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file material3Icons.test.tsx
 * @input Pinned Material Symbols source and theme-scoped icon registry
 * @output Exhaustive semantic key, source revision, and SVG accessibility checks
 * @position Material 3 icon foundation verification
 */

import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {defaultIcons} from '../../../core/src/Icon/defaultIcons';
import source from './material3IconSource.json';
import {material3IconRegistry} from './material3Icons';

describe('Material 3 icon source', () => {
  it('covers every released shared semantic icon name from pinned official artwork', () => {
    expect(source.sourceRepository).toBe('google/material-design-icons');
    expect(source.sourceCommit).toBe(
      'bd8cb85bd4bad964fe6918f79665bb40c3a8efef',
    );
    expect(source.license).toBe('Apache-2.0');
    const sharedNames = Object.keys(defaultIcons)
      .filter(name => !name.includes(':'))
      .sort();
    expect(Object.keys(material3IconRegistry).sort()).toEqual(sharedNames);
    expect(Object.keys(source.artwork).sort()).toEqual(sharedNames);
  });

  it('renders theme SVGs as decorative current-color glyphs without an icon font', () => {
    for (const artwork of Object.values(material3IconRegistry)) {
      const html = renderToStaticMarkup(artwork);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('fill="currentColor"');
      expect(html).toContain('width="1em"');
      expect(html).toContain('<path');
    }
    for (const name of ['success', 'error', 'warning', 'info'] as const) {
      expect(source.artwork[name].variant).toBe('filled');
    }
  });
});
