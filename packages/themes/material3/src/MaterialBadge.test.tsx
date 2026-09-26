// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file MaterialBadge.test.tsx
 * @input MaterialBadge React component and test renderer
 * @output Small/large, value, accessibility, and ref regression evidence
 * @position Focused Material 3 badge behavior verification
 */

import {createRef} from 'react';
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {MaterialBadge} from './MaterialBadge';

describe('MaterialBadge', () => {
  it('renders an assistive-technology-hidden dot without a value', () => {
    const {container} = render(<MaterialBadge data-testid="badge" />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toBeEmptyDOMElement();
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders zero and short text as large badges', () => {
    const {rerender} = render(<MaterialBadge value={0} />);
    expect(screen.getByText('0')).toHaveAttribute('aria-hidden', 'true');
    rerender(<MaterialBadge value="99+" label="More than 99 notifications" />);
    expect(
      screen.getByRole('img', {name: 'More than 99 notifications'}),
    ).toHaveTextContent('99+');
  });

  it('treats an empty value as a small dot and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<MaterialBadge value="" label="New activity" ref={ref} />);
    expect(
      screen.getByRole('img', {name: 'New activity'}),
    ).toBeEmptyDOMElement();
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('preserves the caller class and data attributes', () => {
    render(<MaterialBadge value={3} className="custom" data-testid="count" />);
    expect(screen.getByTestId('count')).toHaveClass('custom');
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });
});
