// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file HorizontalDivider.tsx
 * @input Compose divider thickness and color, plus the selected Web inset gap
 * @output Public native horizontal rule with decorative or explicit separator semantics
 * @position Material 3 horizontal Divider entry point
 */

import type {DividerRuleProps} from './DividerRule.js';
import {DividerRule} from './DividerRule.js';

export type HorizontalDividerProps = Omit<DividerRuleProps, 'orientation'>;

/** A native Material 3 horizontal rule. */
export function HorizontalDivider(props: HorizontalDividerProps) {
  return <DividerRule {...props} orientation="horizontal" />;
}
