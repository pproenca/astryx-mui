// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native Ripple public API and React server rendering. @output Decorative ownership, ref, accessibility and hydration regression. @position Native Ripple unit test; interaction and pixels are browser verified. */
import React, {createRef} from 'react';
import {render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {Ripple, type RippleProps} from './Ripple';

describe('native Ripple', () => {
  it('keeps the hidden structure stable through hydration', () => {
    const content = (
      <button style={{position: 'relative'}}>
        Custom control
        <Ripple data-testid="ripple" />
      </button>
    );
    const markup = renderToString(content);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('tabindex="-1"');
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);
    const {container} = render(content, {container: host, hydrate: true});
    expect(container.querySelectorAll('span')).toHaveLength(3);
    expect(screen.getByTestId('ripple')).toHaveAttribute('aria-hidden', 'true');
    host.remove();
  });

  it('keeps the ref on the decorative span and cannot be made focusable', () => {
    const ref = createRef<HTMLSpanElement>();
    const unsafeProps = {
      role: 'button',
      tabIndex: 0,
      'aria-hidden': 'false',
    } as unknown as RippleProps;
    render(
      <button style={{position: 'relative'}}>
        <Ripple
          {...unsafeProps}
          ref={ref}
          className="consumer"
          data-testid="ripple"
        />
      </button>,
    );
    const ripple = screen.getByTestId('ripple');
    expect(ref.current).toBe(ripple);
    expect(ripple).toHaveAttribute('aria-hidden', 'true');
    expect(ripple).toHaveAttribute('tabindex', '-1');
    expect(ripple).not.toHaveAttribute('role');
    expect(ripple).toHaveClass('consumer');
  });
});
