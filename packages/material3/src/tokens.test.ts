// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file tokens.test.ts
 * @input Pinned Material wrapper inventories and native token names
 * @output Regression checks for public CSS role names and typed references
 * @position Native package token API contract test
 */

import {describe, expect, it} from 'vitest';
import colorSource from '../../themes/material3/src/material3ColorSource.json';
import typeSource from '../../themes/material3/src/material3TypographySource.json';
import shapeSource from '../../themes/material3/src/material3ShapeSource.json';
import {
  material3ComponentTokens,
  material3ShapeRoles,
  material3SystemColorRoles,
  material3TypeRoles,
  material3TypefaceRoles,
  material3Var,
} from './tokens';
import type {Material3TokenName} from './tokens';

type PublicRole<Name extends Material3TokenName> = Name;
type PublicPrimary = PublicRole<'--md-sys-color-primary'>;
// @ts-expect-error Generated palette data is not a public CSS role.
type _PrivatePalette = PublicRole<'--md-ref-palette-primary40'>;
// @ts-expect-error Material Web component CSS names have no comp segment.
type _InventedComponent = PublicRole<'--md-comp-divider-color'>;
void (0 as unknown as PublicPrimary);

describe('native Material CSS role names', () => {
  it('matches every currently supported system color, typeface, typescale, and shape CSS role', () => {
    expect([...material3SystemColorRoles]).toEqual(
      Object.keys(colorSource.lightRolePaletteKeys),
    );
    expect([...material3TypefaceRoles]).toEqual(
      Object.keys(typeSource.typeface),
    );
    expect([...material3ShapeRoles]).toEqual(
      Object.keys(shapeSource.cssCorners),
    );
    const typescale = material3TypeRoles.flatMap(role =>
      ['font', 'line-height', 'size', 'weight'].map(part => `${role}-${part}`),
    );
    typescale.push(
      'label-large-weight-prominent',
      'label-medium-weight-prominent',
    );
    expect(typescale.sort()).toEqual(Object.keys(typeSource.typescale).sort());
  });

  it('uses actual CSS property spellings without inventing a comp segment', () => {
    expect(material3Var('--md-sys-color-outline-variant')).toBe(
      'var(--md-sys-color-outline-variant)',
    );
    expect(material3Var('--md-divider-color')).toBe('var(--md-divider-color)');
    expect(material3ComponentTokens).toContain('--md-badge-size');
    expect(
      material3ComponentTokens.every(name => !name.includes('--md-comp-')),
    ).toBe(true);
  });
});
