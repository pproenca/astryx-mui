// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file MaterialSymbol.tsx
 * @input Material Symbols ligature or codepoint, style, size, and variable-font axes
 * @output Released MaterialSymbol compatibility export with its existing props
 * @position Compatibility entry point delegating to the native Material 3 component
 *
 * SYNC: MaterialSymbol.doc.mjs, material3.spec.md, MaterialSymbol.test.tsx,
 * and the Material 3 consumer README describe this public contract.
 */

import React, {type HTMLAttributes, type Ref} from 'react';
import {MaterialSymbol as NativeMaterialSymbol} from '@astryxdesign/material3/MaterialSymbol';

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

/** Delegates the released font-glyph import to the native Material 3 owner. */
export function MaterialSymbol(props: MaterialSymbolProps) {
  return <NativeMaterialSymbol {...props} />;
}
