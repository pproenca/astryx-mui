// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file material3Typography.test.ts
 * @input Material 3 typography source artifact and type-role exports
 * @output Active Sass parity, role completeness, and fallback checks
 * @position Material 3 typography foundation verification
 */

import {describe, expect, it} from 'vitest';
import source from './material3TypographySource.json';
import {
  material3SourceOnlyTracking,
  material3Typeface,
  material3TypeRoles,
  material3Typescale,
  material3TypeStyle,
} from './material3Typography';

describe('Material 3 typography source', () => {
  it('preserves the pinned active Sass values and the source-only tracking roles', () => {
    expect(source.sourceCommit).toBe(
      'cbd34a8921915af94d5ef65c2a69eece41d5b4f3',
    );
    expect(material3Typeface).toEqual(source.typeface);
    expect(material3Typescale).toEqual(source.typescale);
    expect(material3SourceOnlyTracking).toEqual(source.sourceOnlyTracking);
    expect(Object.keys(material3Typeface)).toHaveLength(5);
    expect(Object.keys(material3Typescale)).toHaveLength(62);
    expect(Object.keys(material3SourceOnlyTracking)).toHaveLength(15);
  });

  it('provides all 15 size-specific roles with an explicit font fallback', () => {
    expect(material3TypeRoles).toHaveLength(15);
    for (const role of material3TypeRoles) {
      const style = material3TypeStyle(role);
      expect(style.fontFamily).toBe('Roboto, Arial, sans-serif');
      expect(style.fontSize).toMatch(/^\d+(?:\.\d+)?rem$/);
      expect(style.lineHeight).toMatch(/^\d+(?:\.\d+)?rem$/);
      expect(Number.parseFloat(style.lineHeight)).toBeGreaterThan(
        Number.parseFloat(style.fontSize),
      );
      expect(style.fontWeight).toMatch(/^(400|500|700)$/);
      expect(style.letterSpacing).toMatch(/^-?\d+(?:\.\d+)?rem$/);
    }
    expect(
      material3TypeStyle('label-large', {prominent: true}).fontWeight,
    ).toBe('700');
    expect(
      material3TypeStyle('label-medium', {prominent: true}).fontWeight,
    ).toBe('700');
  });
});
