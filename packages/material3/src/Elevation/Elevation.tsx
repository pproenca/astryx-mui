// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material shadow values: Copyright Google LLC, Apache-2.0.

'use client';

/**
 * @file Elevation.tsx
 * @input A positioned visual owner, one of six pinned Compose levels, and the Material shadow color role
 * @output Two decorative CSS shadow layers with no tonal color, semantics, or motion
 * @position Opt-in native Material 3 Elevation primitive for custom visual owners
 *
 * SYNC: Elevation.spec.md, Elevation.doc.mjs, and the Compose-first source baseline.
 */

import type {HTMLAttributes, Ref} from 'react';
import * as stylex from '@stylexjs/stylex';
import {material3ElevationCssShadowLayers} from '../foundation.js';

export interface ElevationProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'style' | 'color' | 'role' | 'tabIndex' | 'aria-hidden'
> {
  /** Pinned Material level. Zero is a shadow-free visual layer. */
  level?: 0 | 1 | 2 | 3 | 4 | 5;
  /** Ref to the decorative layer, never the semantic owner. */
  ref?: Ref<HTMLSpanElement>;
}

const styles = stylex.create({
  root: {
    position: 'absolute',
    inset: 0,
    display: 'block',
    borderRadius: 'inherit',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  layer: {
    position: 'absolute',
    inset: 0,
    display: 'block',
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
  shadow: (boxShadow: string, opacity: number) => ({
    boxShadow,
    opacity,
  }),
});

/** Paint one static shadow level inside a positioned custom owner. */
export function Elevation({
  level = 0,
  className,
  ref,
  ...rest
}: ElevationProps) {
  if (!Number.isInteger(level) || level < 0 || level > 5) {
    throw new RangeError('Elevation level must be an integer from 0 to 5.');
  }
  const layers = material3ElevationCssShadowLayers(level);
  const paint = stylex.props(styles.root);
  return (
    <span
      {...rest}
      {...paint}
      className={[paint.className, className].filter(Boolean).join(' ')}
      ref={ref}
      role={undefined}
      aria-hidden="true"
      tabIndex={-1}>
      <span
        {...stylex.props(
          styles.layer,
          styles.shadow(layers.key.boxShadow, layers.key.opacity),
        )}
      />
      <span
        {...stylex.props(
          styles.layer,
          styles.shadow(layers.ambient.boxShadow, layers.ambient.opacity),
        )}
      />
    </span>
  );
}
