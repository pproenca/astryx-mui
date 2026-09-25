// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file IconDefaultSizeContext.ts
 * @input Uses React context, an optional Icon size prop, and theme or slot defaults
 * @output Resolves explicit size, nearest slot or theme default, then Core md
 * @position Internal Icon sizing context; consumed by Icon, Theme, and slot owners
 */

import {createContext, use} from 'react';
import type {IconSize} from './IconSize.stylex';

const IconDefaultSizeContext = createContext<IconSize | null>(null);
IconDefaultSizeContext.displayName = 'IconDefaultSizeContext';

export const IconDefaultSizeProvider = IconDefaultSizeContext.Provider;

export function useIconSize(size: IconSize | undefined): IconSize {
  const contextualSize = use(IconDefaultSizeContext);
  return size ?? contextualSize ?? 'md';
}
