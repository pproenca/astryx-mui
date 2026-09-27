// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native Icon, React rendering and supplied SVG component. @output Default, accessibility and parent-ownership regression checks. @position Native Material 3 Icon tests. */

import React, {type SVGProps} from 'react';
import {render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import {Icon} from './Icon';

function CheckSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" data-testid="glyph" {...props}>
      <path d="m4 12 5 5 11-11" fill="none" stroke="currentColor" />
    </svg>
  );
}

function ColoredSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M0 0h24v24H0z" fill="#ff0000" />
    </svg>
  );
}

describe('native Icon', () => {
  it('renders a supplied SVG at the Material default while remaining decorative', () => {
    render(<Icon icon={CheckSvg} data-testid="icon" />);
    const icon = screen.getByTestId('icon');
    const glyph = screen.getByTestId('glyph');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).not.toHaveAttribute('role');
    expect(icon.className).not.toBe('');
    expect(glyph).toHaveAttribute('width', '100%');
    expect(glyph).toHaveAttribute('height', '100%');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph).toHaveAttribute('focusable', 'false');
  });

  it('names a meaningful standalone glyph without exposing its SVG twice', () => {
    render(<Icon icon={CheckSvg} label="Completed" />);
    const icon = screen.getByRole('img', {name: 'Completed'});
    expect(icon).not.toHaveAttribute('aria-hidden');
    expect(screen.getByTestId('glyph')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps a caller-supplied localized accessible name', () => {
    render(<Icon icon={CheckSvg} label="完成" />);
    expect(screen.getByRole('img', {name: '完成'})).toBeInTheDocument();
  });

  it('respects explicit size, CSS class and DOM attributes', () => {
    render(
      <Icon
        icon={CheckSvg}
        size={32}
        className="custom-icon"
        data-testid="icon"
      />,
    );
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveClass('custom-icon');
    expect(icon.style.getPropertyValue('--x-width')).toBe('32px');
    expect(icon.style.getPropertyValue('--x-height')).toBe('32px');
  });

  it('uses supplied intrinsic vector dimensions unless explicit size wins', () => {
    const {rerender} = render(
      <Icon
        icon={CheckSvg}
        intrinsicSize={{width: 35, height: 83}}
        data-testid="icon"
      />,
    );
    const icon = screen.getByTestId('icon');
    expect(icon.style.getPropertyValue('--x-width')).toBe('35px');
    expect(icon.style.getPropertyValue('--x-height')).toBe('83px');
    rerender(
      <Icon
        icon={CheckSvg}
        intrinsicSize={{width: 35, height: 83}}
        size={50}
        data-testid="icon"
      />,
    );
    expect(icon.style.getPropertyValue('--x-width')).toBe('50px');
    expect(icon.style.getPropertyValue('--x-height')).toBe('50px');
  });

  it('preserves source artwork color or inherits a selected currentColor tint', () => {
    const {rerender} = render(<Icon icon={ColoredSvg} data-testid="icon" />);
    expect(screen.getByTestId('icon').querySelector('path')).toHaveAttribute(
      'fill',
      '#ff0000',
    );
    rerender(<Icon icon={CheckSvg} data-testid="icon" />);
    expect(screen.getByTestId('icon').querySelector('path')).toHaveAttribute(
      'stroke',
      'currentColor',
    );
  });

  it('leaves interaction with the owning control and renders on the server', () => {
    const activate = vi.fn();
    render(
      <button type="button" onClick={activate}>
        <Icon icon={CheckSvg} />
        Complete
      </button>,
    );
    screen.getByRole('button', {name: 'Complete'}).click();
    expect(activate).toHaveBeenCalledOnce();
    expect(
      renderToString(<Icon icon={CheckSvg} label="Completed" />),
    ).toContain('aria-label="Completed"');
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid size %s',
    size => {
      expect(() => render(<Icon icon={CheckSvg} size={size} />)).toThrow(
        /positive finite/,
      );
    },
  );

  it('rejects invalid intrinsic vector dimensions', () => {
    expect(() =>
      render(<Icon icon={CheckSvg} intrinsicSize={{width: 35, height: 0}} />),
    ).toThrow(/intrinsic dimensions/);
  });
});
