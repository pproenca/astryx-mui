// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Native Divider public exports and React server rendering. @output Hydration, ref and decorative-semantic boundary checks. @position Native Divider unit regression beside browser pixel and density checks. */
import React, {createRef} from 'react';
import {render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {
  HorizontalDivider,
  type HorizontalDividerProps,
} from './HorizontalDivider';
import {VerticalDivider} from './VerticalDivider';

describe('native Divider', () => {
  it('hydrates decorative horizontal and semantic vertical rules with stable structure', () => {
    const content = (
      <div>
        <HorizontalDivider data-testid="horizontal" />
        <VerticalDivider role="separator" data-testid="vertical" />
      </div>
    );
    const markup = renderToString(content);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('aria-orientation="vertical"');
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);
    const {container} = render(content, {container: host, hydrate: true});
    expect(container.querySelectorAll('[data-testid]')).toHaveLength(2);
    expect(screen.getByTestId('horizontal')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByTestId('vertical')).toHaveAttribute('role', 'separator');
    host.remove();
  });

  it('keeps refs on visual rules and blocks an accidental action role or tab stop', () => {
    const ref = createRef<HTMLDivElement>();
    const unsafeProps = {
      role: 'button',
      tabIndex: 0,
      'aria-hidden': 'false',
    } as unknown as HorizontalDividerProps;
    render(<HorizontalDivider {...unsafeProps} ref={ref} data-testid="rule" />);
    const rule = screen.getByTestId('rule');
    expect(ref.current).toBe(rule);
    expect(rule).toHaveAttribute('aria-hidden', 'true');
    expect(rule).not.toHaveAttribute('role');
    expect(rule).not.toHaveAttribute('tabindex');
  });

  it('rejects nonpositive numeric thickness', () => {
    expect(() => render(<HorizontalDivider thickness={0} />)).toThrow(
      /positive or hairline/,
    );
  });
});
