// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file MaterialBadge.tsx
 * @input Optional notification value, accessible label, and Material 3 badge roles
 * @output Presentational Material 3 dot or count badge
 * @position Opt-in Material Web Labs badge surface; Core Badge keeps tag semantics
 *
 * SYNC: MaterialBadge.doc.mjs, MaterialBadge.test.tsx, material3.spec.md,
 * and the Material 3 consumer README describe this public contract.
 */

import type {HTMLAttributes, Ref} from 'react';
import * as stylex from '@stylexjs/stylex';

export interface MaterialBadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'color'
> {
  /** Count or short text. Omit or pass an empty string for the small dot. */
  value?: string | number;
  /** Accessible name when the badge conveys meaning on its own. */
  label?: string;
  /** Ref forwarded to the badge surface. */
  ref?: Ref<HTMLSpanElement>;
}

const styles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--md-badge-size, 6px)',
    height: 'var(--md-badge-size, 6px)',
    borderRadius:
      'var(--md-badge-shape, var(--md-sys-shape-corner-full, 9999px))',
    backgroundColor:
      'var(--md-badge-color, var(--md-sys-color-error, var(--color-error)))',
    flexShrink: 0,
    pointerEvents: 'none',
    '@media (forced-colors: active)': {
      backgroundColor: 'CanvasText',
    },
  },
  large: {
    width: 'auto',
    minWidth: 'var(--md-badge-large-size, 16px)',
    height: 'var(--md-badge-large-size, 16px)',
    paddingInline: '4px',
    borderRadius:
      'var(--md-badge-large-shape, var(--md-sys-shape-corner-full, 9999px))',
    backgroundColor:
      'var(--md-badge-large-color, var(--md-sys-color-error, var(--color-error)))',
    color:
      'var(--md-badge-large-label-text-color, var(--md-sys-color-on-error, var(--color-on-error)))',
    fontFamily:
      'var(--md-badge-large-label-text-font, var(--md-sys-typescale-label-small-font, var(--font-family-body)))',
    fontSize:
      'var(--md-badge-large-label-text-size, var(--md-sys-typescale-label-small-size, var(--font-size-xs)))',
    lineHeight:
      'var(--md-badge-large-label-text-line-height, var(--md-sys-typescale-label-small-line-height, 16px))',
    fontWeight:
      'var(--md-badge-large-label-text-weight, var(--md-sys-typescale-label-small-weight, 500))',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    '@media (forced-colors: active)': {
      color: 'Canvas',
    },
  },
});

/**
 * Renders the Material 3 small dot or large value badge. Place the surface
 * beside or over its owner with CSS; include the count in the owner's
 * accessible name when the badge is decorative.
 *
 * @example
 * ```
 * <MaterialBadge />
 * <MaterialBadge value={3} />
 * <MaterialBadge value="99+" label="More than 99 notifications" />
 * ```
 */
export function MaterialBadge({
  value,
  label,
  className,
  ref,
  ...rest
}: MaterialBadgeProps) {
  const isLarge = value !== undefined && value !== '';
  const stylexProps = stylex.props(styles.root, isLarge && styles.large);
  const accessibility = label
    ? {role: 'img' as const, 'aria-label': label}
    : {'aria-hidden': true};

  return (
    <span
      {...stylexProps}
      {...rest}
      {...accessibility}
      className={[stylexProps.className, className].filter(Boolean).join(' ')}
      ref={ref}>
      {isLarge ? value : null}
    </span>
  );
}
