// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file Icon.tsx
 * @input Consumer-supplied SVG component, optional accessible name and size
 * @output Presentational native Material 3 Icon using the supported icon size role
 * @position Native glyph channel; interactive parents own targets, focus and motion
 *
 * SYNC: Icon.doc.mjs and the Material 3 Icon source decision describe this contract.
 */

import React, {
  type ComponentType,
  type HTMLAttributes,
  type Ref,
  type SVGProps,
} from 'react';
import * as stylex from '@stylexjs/stylex';

export interface IconProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'color' | 'style'
> {
  /** SVG component supplied by the consumer. */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Square size in CSS pixels; otherwise uses --md-icon-size, then 24px. */
  size?: number;
  /** Accessible name for a meaningful standalone glyph. Omit for decoration. */
  label?: string;
  /** Ref forwarded to the glyph wrapper. */
  ref?: Ref<HTMLSpanElement>;
}

const styles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--md-icon-size, 24px)',
    height: 'var(--md-icon-size, 24px)',
    color: 'inherit',
    lineHeight: 1,
    flexShrink: 0,
    verticalAlign: 'middle',
  },
  size: (pixels: number) => ({
    width: `${pixels}px`,
    height: `${pixels}px`,
  }),
});

/** Renders a supplied SVG with Material 3 sizing and accessible naming. */
export function Icon({
  icon: Glyph,
  size,
  label,
  className,
  ref,
  ...rest
}: IconProps) {
  if (size !== undefined && (!Number.isFinite(size) || size <= 0)) {
    throw new RangeError('Icon size must be a positive finite number.');
  }

  const stylexProps = stylex.props(
    styles.root,
    size !== undefined && styles.size(size),
  );
  const a11y = label
    ? {role: 'img' as const, 'aria-label': label}
    : {'aria-hidden': true};

  return (
    <span
      {...stylexProps}
      {...a11y}
      {...rest}
      className={[stylexProps.className, className].filter(Boolean).join(' ')}
      ref={ref}>
      <Glyph width="100%" height="100%" aria-hidden="true" focusable="false" />
    </span>
  );
}
