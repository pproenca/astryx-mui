// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file VerticalDivider.tsx
 * @input Compose divider thickness and color
 * @output Public native vertical rule with decorative or explicit separator semantics
 * @position Material 3 vertical Divider entry point
 */

import type {DividerRuleProps} from './DividerRule.js';
import {DividerRule} from './DividerRule.js';

export type VerticalDividerProps = Omit<
  DividerRuleProps,
  'orientation' | 'inset'
>;

/** A native Material 3 vertical rule. */
export function VerticalDivider(props: VerticalDividerProps) {
  return <DividerRule {...props} orientation="vertical" />;
}
