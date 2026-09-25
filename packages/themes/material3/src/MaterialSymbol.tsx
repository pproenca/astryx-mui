// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file MaterialSymbol.tsx
 * @input Material Symbols ligature or codepoint, style, size, and variable-font axes
 * @output Opt-in font-backed MaterialSymbol component for the Material 3 package
 * @position Material Web md-icon font channel; Core Icon keeps semantic SVG ownership
 *
 * SYNC: MaterialSymbol.doc.mjs, material3.spec.md, MaterialSymbol.test.tsx,
 * and the Material 3 consumer README describe this public contract.
 */

import React, {type HTMLAttributes, type Ref} from 'react';
import * as stylex from '@stylexjs/stylex';

export type MaterialSymbolVariant = 'outlined' | 'rounded' | 'sharp';

export interface MaterialSymbolProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'style' | 'color'
> {
  /** Material Symbols ligature (such as "settings") or Unicode codepoint. */
  name: string;
  /** Font family style. @default 'outlined' */
  variant?: MaterialSymbolVariant;
  /** Square icon size in CSS pixels. Omit to use --md-icon-size or 24px. */
  size?: number;
  /** FILL axis, from 0 (outline) to 1 (filled). */
  fill?: number;
  /** wght axis, from 100 to 700. */
  weight?: number;
  /** GRAD axis, from -50 to 200. */
  grade?: number;
  /** opsz axis, from 20 to 48. */
  opticalSize?: number;
  /** Accessible name for a meaningful standalone symbol. Omit for decoration. */
  label?: string;
  /** Ref forwarded to the span. */
  ref?: Ref<HTMLSpanElement>;
}

const styles = stylex.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--md-icon-size, 24px)',
    height: 'var(--md-icon-size, 24px)',
    fontSize: 'var(--md-icon-size, 24px)',
    fontFamily: 'var(--md-icon-font, "Material Symbols Outlined")',
    fontFeatureSettings: '"liga"',
    fontWeight: 400,
    fontStyle: 'normal',
    fontOpticalSizing: 'auto',
    lineHeight: 1,
    letterSpacing: 'normal',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
    userSelect: 'none',
    overflow: 'hidden',
    flexShrink: 0,
  },
  rounded: {
    fontFamily: 'var(--md-icon-font, "Material Symbols Rounded")',
  },
  sharp: {
    fontFamily: 'var(--md-icon-font, "Material Symbols Sharp")',
  },
  size: (pixels: number) => ({
    width: `${pixels}px`,
    height: `${pixels}px`,
    fontSize: `${pixels}px`,
  }),
  axes: (settings: string) => ({fontVariationSettings: settings}),
});

function validateAxis(
  name: string,
  value: number | undefined,
  min: number,
  max: number,
) {
  if (
    value !== undefined &&
    (!Number.isFinite(value) || value < min || value > max)
  ) {
    throw new RangeError(
      `${name} must be a finite number from ${min} to ${max}.`,
    );
  }
}

/**
 * Renders one glyph from a consumer-loaded Material Symbols font.
 *
 * @example
 * ```
 * <MaterialSymbol name="settings" label="Settings" />
 * <MaterialSymbol name="home" variant="rounded" fill={1} weight={500} />
 * ```
 */
export function MaterialSymbol({
  name,
  variant = 'outlined',
  size,
  fill,
  weight,
  grade,
  opticalSize,
  label,
  className,
  ref,
  ...rest
}: MaterialSymbolProps) {
  if (!name) {
    throw new Error(
      'MaterialSymbol name must be a nonempty ligature or codepoint.',
    );
  }
  if (size !== undefined && (!Number.isFinite(size) || size <= 0)) {
    throw new RangeError(
      'MaterialSymbol size must be a positive finite number.',
    );
  }
  validateAxis('fill', fill, 0, 1);
  validateAxis('weight', weight, 100, 700);
  validateAxis('grade', grade, -50, 200);
  validateAxis('opticalSize', opticalSize, 20, 48);

  const hasAxes = [fill, weight, grade, opticalSize].some(
    value => value !== undefined,
  );
  const axes = hasAxes
    ? `"FILL" ${fill ?? 0}, "wght" ${weight ?? 400}, "GRAD" ${grade ?? 0}, "opsz" ${opticalSize ?? 24}`
    : null;
  const stylexProps = stylex.props(
    styles.root,
    variant === 'rounded' && styles.rounded,
    variant === 'sharp' && styles.sharp,
    size !== undefined && styles.size(size),
    axes !== null && styles.axes(axes),
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
      {name}
    </span>
  );
}
