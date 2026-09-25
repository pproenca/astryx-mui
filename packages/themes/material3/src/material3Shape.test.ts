// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file material3Shape.test.ts
 * @input Material 3 shape source artifact and corner exports
 * @output Pinned-value, Sass-only classification, and RTL geometry checks
 * @position Material 3 shape foundation verification
 */

import {describe, expect, it} from 'vitest';
import source from './material3ShapeSource.json';
import {
  material3CornerListCss,
  material3CssCorners,
  material3SassOnlyCornerLists,
} from './material3Shape';

describe('Material 3 shape source', () => {
  it('keeps the seven public CSS corners separate from five Sass-only lists', () => {
    expect(source.sourceCommit).toBe(
      'cbd34a8921915af94d5ef65c2a69eece41d5b4f3',
    );
    expect(material3CssCorners).toEqual(source.cssCorners);
    expect(material3SassOnlyCornerLists).toEqual(source.sassOnlyCornerLists);
    expect(Object.keys(material3CssCorners)).toHaveLength(7);
    expect(Object.keys(material3SassOnlyCornerLists)).toHaveLength(5);
    expect(material3CssCorners['corner-extra-small']).toBe('4px');
    expect(material3CssCorners['corner-small']).toBe('8px');
    expect(material3CssCorners['corner-full']).toBe('9999px');
  });

  it('projects directional Sass lists to valid border-radius values in LTR and RTL', () => {
    expect(material3CornerListCss('corner-large-end')).toBe(
      '0px 16px 16px 0px',
    );
    expect(material3CornerListCss('corner-large-end', 'rtl')).toBe(
      '16px 0px 0px 16px',
    );
    expect(material3CornerListCss('corner-large-start', 'rtl')).toBe(
      '0px 16px 16px 0px',
    );
    expect(material3CornerListCss('corner-large-top', 'rtl')).toBe(
      '16px 16px 0px 0px',
    );
  });
});
