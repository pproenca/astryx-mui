// Copyright (c) Meta Platforms, Inc. and affiliates.

import {describe, expect, it} from 'vitest';
import {
  material3ColorValues,
  material3CornerShapes,
  material3ElevationLevels,
  material3ExpressiveShapes,
  material3FoundationGeometry,
  material3IconDefaults,
  material3KitModeNames,
  material3SpringSpecs,
  material3StateOpacity,
  material3TokenCss,
  material3TokenValues,
  material3TypeStyles,
  resolveMaterial3Token,
} from './foundation';
import {material3SystemColorRoles} from './tokens';

describe('pinned Compose-first native foundation', () => {
  it('resolves all 49 system roles in standard light/dark and Expressive light', () => {
    for (const scheme of ['light', 'dark', 'expressive-light'] as const) {
      const colors = material3ColorValues(scheme);
      expect(Object.keys(colors)).toHaveLength(49);
      for (const role of material3SystemColorRoles)
        {expect(colors[role]).toMatch(/^#[a-f0-9]{3,8}$/i);}
    }
    expect(material3ColorValues('light')['on-primary-container']).toBe(
      '#21005d',
    );
    expect(
      material3ColorValues('expressive-light')['on-primary-container'],
    ).toBe('#4f378b');
    expect(material3ColorValues('dark')['on-primary-container']).toBe(
      '#eaddff',
    );
    expect(material3KitModeNames).toHaveLength(32);
    for (const mode of material3KitModeNames)
      {expect(Object.keys(material3ColorValues(mode))).toHaveLength(49);}
  });

  it('keeps Compose-only values outside public Material CSS names', () => {
    const graph = material3TokenValues('light');
    expect(Object.keys(material3TypeStyles)).toHaveLength(30);
    expect(material3TypeStyles['body-large-emphasized'].letterSpacingPx).toBe(
      0.15,
    );
    expect(material3TypeStyles['label-small-emphasized'].fontWeight).toBe(700);
    expect(Object.keys(material3CornerShapes)).toHaveLength(10);
    expect(Object.keys(material3ExpressiveShapes)).toHaveLength(35);
    expect(material3ExpressiveShapes.ClamShell.path).toMatch(/^M /);
    expect(material3ElevationLevels).toHaveLength(6);
    expect(material3StateOpacity).toEqual({
      hover: 0.08,
      focus: 0.1,
      pressed: 0.1,
      dragged: 0.16,
    });
    expect(material3SpringSpecs.expressive.default.spatial).toEqual([0.8, 380]);
    expect(material3FoundationGeometry.textField.minHeightPx).toBe(56);
    expect(material3IconDefaults.unsizedFallbackPx).toBe(24);
    expect(
      Object.keys(graph).some(name => name.startsWith('--md-sys-motion-')),
    ).toBe(false);
    expect(Object.keys(graph).some(name => name.includes('emphasized'))).toBe(
      false,
    );
  });

  it('resolves component defaults through scoped system overrides', () => {
    expect(resolveMaterial3Token('--md-divider-color')).toBe('#cac4d0');
    expect(
      resolveMaterial3Token('--md-divider-color', {
        overrides: {'--md-sys-color-outline-variant': '#123456'},
      }),
    ).toBe('#123456');
    expect(resolveMaterial3Token('--md-badge-large-label-text-size')).toBe(
      '0.6875rem',
    );
    expect(material3TokenValues('light')['--md-sys-shape-corner-full']).toBe(
      '50%',
    );
    expect(
      material3TokenValues('light', 'web-compat')['--md-sys-shape-corner-full'],
    ).toBe('9999px');
  });

  it('emits the same values for standard, Expressive and kit CSS scopes', () => {
    const css = material3TokenCss();
    for (const scheme of [
      'light',
      'dark',
      'expressive-light',
      ...material3KitModeNames,
    ] as const) {
      expect(css).toContain(`[data-md-scheme='${scheme}']`);
      for (const [name, value] of Object.entries(
        material3TokenValues(scheme),
      )) {
        if (name.startsWith('--md-badge-') || name.startsWith('--md-divider-'))
          {continue;}
        expect(css).toContain(`${name}: ${value};`);
      }
    }
  });
});
