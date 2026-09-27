// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native FocusRing public contract and React server rendering. @output Decorative DOM, ref, API and hydration invariant checks. @position FocusRing unit regression beside browser interaction checks. */
import React, {createRef} from 'react';
import {render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FocusRing, type FocusRingProps} from './FocusRing';

describe('native FocusRing', () => {
  it('keeps the same hidden decorative structure on server and first client render', () => {
    const markup = renderToString(
      <button style={{position: 'relative'}}>
        Custom control
        <FocusRing placement="inset" data-testid="ring" />
      </button>,
    );
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('tabindex="-1"');
    const {container} = render(
      <button style={{position: 'relative'}}>
        Custom control
        <FocusRing placement="inset" data-testid="ring" />
      </button>,
    );
    const ring = screen.getByTestId('ring');
    expect(container.querySelectorAll('span')).toHaveLength(1);
    expect(ring).toHaveAttribute('aria-hidden', 'true');
    expect(ring).toHaveAttribute('tabindex', '-1');
    expect(ring).not.toHaveAttribute('role');
  });

  it('targets the decorative span and protects its accessibility attributes', () => {
    const ref = createRef<HTMLSpanElement>();
    const unsafeProps = {
      'aria-hidden': 'false',
      tabIndex: 0,
      role: 'button',
    } as unknown as FocusRingProps;
    render(
      <button>
        <FocusRing
          {...unsafeProps}
          placement="outward"
          ref={ref}
          className="consumer"
          data-testid="ring"
        />
      </button>,
    );
    const ring = screen.getByTestId('ring');
    expect(ref.current).toBe(ring);
    expect(ring).toHaveAttribute('aria-hidden', 'true');
    expect(ring).toHaveAttribute('tabindex', '-1');
    expect(ring).not.toHaveAttribute('role');
    expect(ring).toHaveClass('consumer');
  });

  it('rejects an unsupported placement', () => {
    expect(() => render(<FocusRing placement={'other' as 'inset'} />)).toThrow(
      /placement must be inset or outward/,
    );
  });
});
