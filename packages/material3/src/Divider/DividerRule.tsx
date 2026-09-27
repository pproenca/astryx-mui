// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file DividerRule.tsx
 * @input Pinned Compose orientation, thickness and color plus the recorded Web inset gap
 * @output Internal static rule with a zero-layout hairline and native Material tokens
 * @position Shared paint for the native Divider entry points; no Core dependency
 */

import {useEffect, useState, type HTMLAttributes, type Ref} from 'react';
import * as stylex from '@stylexjs/stylex';

export interface DividerRuleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'color' | 'role' | 'style' | 'tabIndex'
> {
  orientation: 'horizontal' | 'vertical';
  thickness?: number | 'hairline';
  color?: string;
  inset?: 'both' | 'start' | 'end';
  role?: 'separator';
  ref?: Ref<HTMLDivElement>;
}

const styles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'block',
    position: 'relative',
    pointerEvents: 'none',
    color: 'var(--md-divider-color, var(--md-sys-color-outline-variant))',
    backgroundColor: 'currentColor',
    '@media (forced-colors: active)': {
      color: 'CanvasText',
      backgroundColor: 'CanvasText',
      forcedColorAdjust: 'none',
    },
  },
  horizontal: {
    width: '100%',
    height: 'var(--md-divider-thickness, 1px)',
  },
  vertical: {
    width: 'var(--md-divider-thickness, 1px)',
    height: '100%',
  },
  horizontalThickness: (value: number) => ({height: `${value}px`}),
  verticalThickness: (value: number) => ({width: `${value}px`}),
  color: (value: string) => ({color: value}),
  insetBoth: {
    marginInlineStart: '16px',
    marginInlineEnd: '16px',
    width: 'max(0px, calc(100% - 32px))',
  },
  insetStart: {
    marginInlineStart: '16px',
    width: 'max(0px, calc(100% - 16px))',
  },
  insetEnd: {
    marginInlineEnd: '16px',
    width: 'max(0px, calc(100% - 16px))',
  },
  horizontalHairline: {
    height: 0,
    backgroundColor: 'transparent',
    transformOrigin: 'center top',
    '::after': {
      content: "''",
      position: 'absolute',
      insetInline: 0,
      top: 0,
      height: '1px',
      backgroundColor: 'currentColor',
    },
  },
  verticalHairline: {
    width: 0,
    backgroundColor: 'transparent',
    transformOrigin: 'left center',
    '::after': {
      content: "''",
      position: 'absolute',
      insetBlock: 0,
      insetInlineStart: 0,
      width: '1px',
      backgroundColor: 'currentColor',
    },
  },
  horizontalHairlineScale: (ratio: number) => ({
    transform: `scaleY(${1 / ratio})`,
  }),
  verticalHairlineScale: (ratio: number) => ({
    transform: `scaleX(${1 / ratio})`,
  }),
});

function useDevicePixelRatio(active: boolean) {
  const [ratio, setRatio] = useState(1);
  useEffect(() => {
    if (!active) {return;}
    let query: MediaQueryList | undefined;
    const update = () => {
      query?.removeEventListener('change', update);
      const next = window.devicePixelRatio || 1;
      setRatio(next);
      query = window.matchMedia(`(resolution: ${next}dppx)`);
      query.addEventListener('change', update);
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      query?.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, [active]);
  return ratio;
}

/** Internal paint shared by native Divider exports. */
export function DividerRule({
  orientation,
  thickness,
  color,
  inset,
  className,
  role,
  ref,
  ...rest
}: DividerRuleProps) {
  if (
    thickness !== undefined &&
    thickness !== 'hairline' &&
    (!Number.isFinite(thickness) || thickness <= 0)
  )
    {throw new RangeError('Divider thickness must be positive or hairline.');}
  const hairline = thickness === 'hairline';
  const ratio = useDevicePixelRatio(hairline);
  const horizontal = orientation === 'horizontal';
  const paint = stylex.props(
    styles.root,
    horizontal ? styles.horizontal : styles.vertical,
    typeof thickness === 'number' &&
      (horizontal
        ? styles.horizontalThickness(thickness)
        : styles.verticalThickness(thickness)),
    color !== undefined && styles.color(color),
    horizontal && inset === 'both' && styles.insetBoth,
    horizontal && inset === 'start' && styles.insetStart,
    horizontal && inset === 'end' && styles.insetEnd,
    hairline &&
      (horizontal ? styles.horizontalHairline : styles.verticalHairline),
    hairline &&
      (horizontal
        ? styles.horizontalHairlineScale(ratio)
        : styles.verticalHairlineScale(ratio)),
  );
  return (
    <div
      {...rest}
      {...paint}
      className={[paint.className, className].filter(Boolean).join(' ')}
      role={role}
      tabIndex={undefined}
      aria-hidden={role === 'separator' ? undefined : true}
      aria-orientation={role === 'separator' ? orientation : undefined}
      ref={ref}
    />
  );
}
