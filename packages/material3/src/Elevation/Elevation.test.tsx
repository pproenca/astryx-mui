// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native Elevation export, canonical source levels, and React server rendering. @output Decorative boundary and static source-value checks. @position Native Elevation unit regression. */
import React, {createRef} from 'react';
import {render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {
  material3ElevationCssShadowLayers,
  material3ElevationLevels,
} from '../foundation';
import {Elevation, type ElevationProps} from './Elevation';

describe('native Elevation', () => {
  it('server renders and hydrates two decorative layers', () => {
    const content = <Elevation data-testid="elevation" />;
    const markup = renderToString(content);
    expect(markup).toContain('aria-hidden="true"');
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);
    const {container} = render(content, {container: host, hydrate: true});
    const layer = screen.getByTestId('elevation');
    expect(layer.children).toHaveLength(2);
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).not.toHaveAttribute('role');
    expect(container.querySelectorAll('[data-testid]')).toHaveLength(1);
    host.remove();
  });

  it('keeps the visual ref and cannot become a semantic or pointer target', () => {
    const ref = createRef<HTMLSpanElement>();
    const unsafe = {
      role: 'button',
      tabIndex: 0,
      'aria-hidden': 'false',
    } as unknown as ElevationProps;
    render(<Elevation {...unsafe} ref={ref} data-testid="layer" />);
    const layer = screen.getByTestId('layer');
    expect(ref.current).toBe(layer);
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).not.toHaveAttribute('role');
    expect(layer).toHaveAttribute('tabindex', '-1');
  });

  it('uses all six pinned levels as separate token-colored shadows', () => {
    expect(material3ElevationLevels.map(item => item.dp)).toEqual([
      0, 1, 3, 6, 8, 12,
    ]);
    for (const item of material3ElevationLevels) {
      const layers = material3ElevationCssShadowLayers(
        item.level as 0 | 1 | 2 | 3 | 4 | 5,
      );
      expect(layers.key.boxShadow).toContain('var(--md-sys-color-shadow)');
      expect(layers.ambient.boxShadow).toContain('var(--md-sys-color-shadow)');
      expect(layers.key.opacity).toBe(0.3);
      expect(layers.ambient.opacity).toBe(0.15);
    }
  });

  it('rejects levels outside the pinned set', () => {
    expect(() => render(<Elevation level={6 as 5} />)).toThrow(/0 to 5/);
  });
});
