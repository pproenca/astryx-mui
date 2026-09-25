// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file MaterialSymbol.test.tsx
 * @input MaterialSymbol source and React testing-library
 * @output Regression checks for font glyph, axes, size, and accessibility behavior
 * @position Focused tests for the opt-in Material 3 font channel
 */

import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MaterialSymbol} from './MaterialSymbol';

describe('MaterialSymbol', () => {
  it('renders a font ligature as decorative by default', () => {
    render(<MaterialSymbol name="settings" data-testid="symbol" />);
    const symbol = screen.getByTestId('symbol');
    expect(symbol.tagName).toBe('SPAN');
    expect(symbol).toHaveTextContent('settings');
    expect(symbol).toHaveAttribute('aria-hidden', 'true');
    expect(symbol).not.toHaveAttribute('role');
  });

  it('exposes a meaningful codepoint with an accessible name', () => {
    render(<MaterialSymbol name={'\ue834'} label="Select date" />);
    const symbol = screen.getByRole('img', {name: 'Select date'});
    expect(symbol).toHaveTextContent('\ue834');
    expect(symbol).not.toHaveAttribute('aria-hidden');
  });

  it('preserves explicit ARIA and DOM attributes while composing class names', () => {
    render(
      <MaterialSymbol
        name="home"
        label="Home"
        aria-hidden="true"
        className="consumer-symbol"
        data-testid="symbol"
      />,
    );
    const symbol = screen.getByTestId('symbol');
    expect(symbol).toHaveAttribute('aria-hidden', 'true');
    expect(symbol).toHaveClass('consumer-symbol');
    expect(symbol.className.split(' ').length).toBeGreaterThan(1);
  });

  it('applies one explicit size and complete variable-axis profile', () => {
    render(
      <MaterialSymbol
        name="check_box"
        variant="rounded"
        size={32}
        fill={1}
        weight={500}
        grade={-25}
        opticalSize={32}
        data-testid="symbol"
      />,
    );
    const symbol = screen.getByTestId('symbol');
    const style = getComputedStyle(symbol);
    expect(symbol.style.getPropertyValue('--x-width')).toBe('32px');
    expect(symbol.style.getPropertyValue('--x-height')).toBe('32px');
    expect(symbol.style.getPropertyValue('--x-fontSize')).toBe('32px');
    expect(style.fontFamily).toContain('Material Symbols Rounded');
    const axes = symbol.style.getPropertyValue('--x-fontVariationSettings');
    expect(axes).toContain('"FILL" 1');
    expect(axes).toContain('"wght" 500');
    expect(axes).toContain('"GRAD" -25');
    expect(axes).toContain('"opsz" 32');
  });

  it.each([
    [{name: ''}, /nonempty/],
    [{name: 'home', size: 0}, /positive finite/],
    [{name: 'home', fill: 2}, /fill/],
    [{name: 'home', weight: 0}, /weight/],
    [{name: 'home', grade: -51}, /grade/],
    [{name: 'home', opticalSize: 49}, /opticalSize/],
  ] as const)('rejects invalid glyph or axis input %o', (props, message) => {
    expect(() => render(<MaterialSymbol {...props} />)).toThrow(message);
  });
});
