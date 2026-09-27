// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material motion values: Copyright The Android Open Source Project and Google LLC, Apache-2.0.

'use client';

/**
 * @file FocusRing.tsx
 * @input A positioned visual parent, selected placement and optional semantic target ref
 * @output One decorative Material 3 focus indicator with browser focus modality
 * @position Opt-in native FocusRing; controls retain their own semantic focus and default indication
 *
 * SYNC: FocusRing.spec.md, FocusRing.doc.mjs and the pinned focus source baseline.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type Ref,
  type RefObject,
} from 'react';
import * as stylex from '@stylexjs/stylex';
import {material3SpringSpecs} from '../foundation.js';
import {sampleMaterial3Spring, type Material3SpringFrame} from '../motion.js';

export interface FocusRingProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'style' | 'color' | 'tabIndex' | 'role' | 'aria-hidden'
> {
  /** Compose two-stroke inset ring or the explicitly selected Web outward ring. */
  placement: 'inset' | 'outward';
  /** A distinct semantic target, such as a hidden input beside the visual owner. */
  controlRef?: RefObject<HTMLElement | null>;
  /** Ref to the decorative span, never the semantic target. */
  ref?: Ref<HTMLSpanElement>;
}

const outwardPulse = stylex.keyframes({
  '0%': {outlineWidth: '3px'},
  '25%': {outlineWidth: '8px'},
  '100%': {outlineWidth: '3px'},
});

const styles = stylex.create({
  root: {
    position: 'absolute',
    inset: 0,
    display: 'block',
    pointerEvents: 'none',
    userSelect: 'none',
    boxSizing: 'border-box',
    borderRadius: 'inherit',
  },
  inset: {
    '::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      boxSizing: 'border-box',
      borderStyle: 'solid',
      borderColor: 'var(--md-sys-color-secondary)',
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: 1,
    },
    '::after': {
      content: '""',
      position: 'absolute',
      boxSizing: 'border-box',
      borderStyle: 'solid',
      borderColor: 'var(--md-sys-color-on-secondary)',
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: 0,
    },
  },
  insetFrame: (progress: number) => ({
    '::before': {borderWidth: `${Math.ceil(2 * Math.max(0, progress))}px`},
    '::after': {
      inset: `${Math.ceil(Math.max(0, progress))}px`,
      borderWidth: `${Math.ceil(3 * Math.max(0, progress))}px`,
    },
  }),
  outward: {
    inset: '-2px',
    borderRadius: '9999px',
    outline: '3px solid var(--md-sys-color-secondary)',
    visibility: 'hidden',
  },
  outwardFocused: {
    visibility: 'visible',
    animationName: outwardPulse,
    animationDuration: '600ms',
    animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    animationIterationCount: 1,
    '@media (prefers-reduced-motion: reduce)': {animationName: 'none'},
  },
  forcedColors: {
    '@media (forced-colors: active)': {
      '::before': {borderColor: 'Highlight'},
      '::after': {borderColor: 'Canvas'},
      outlineColor: 'Highlight',
    },
  },
});

function disabled(target: HTMLElement, owner: HTMLElement): boolean {
  return (
    target.matches(':disabled,[aria-disabled="true"]') ||
    owner.matches(':disabled,[aria-disabled="true"]')
  );
}

function commonAncestor(a: HTMLElement, b: HTMLElement): HTMLElement {
  let ancestor: HTMLElement | null = a;
  while (ancestor && !ancestor.contains(b)) {
    ancestor = ancestor.parentElement;
  }
  return ancestor ?? a.ownerDocument.documentElement;
}

function ownerCanPaint(
  owner: HTMLElement,
  placement: 'inset' | 'outward',
): boolean {
  if (getComputedStyle(owner).position === 'static') {
    console.warn('FocusRing visual parent must be positioned.');
    return false;
  }
  if (placement === 'outward') {
    let ancestor: HTMLElement | null = owner;
    while (ancestor && ancestor !== owner.ownerDocument.body) {
      const style = getComputedStyle(ancestor);
      if (
        ['hidden', 'clip'].includes(style.overflowX) ||
        ['hidden', 'clip'].includes(style.overflowY)
      ) {
        console.warn(
          'FocusRing outward placement requires an unclipped visual parent and ancestors.',
        );
        return false;
      }
      ancestor = ancestor.parentElement;
    }
  }
  return true;
}

/** An opt-in visual focus primitive for one positioned custom-control owner. */
export function FocusRing({
  placement,
  controlRef,
  className,
  ref,
  ...rest
}: FocusRingProps) {
  if (placement !== 'inset' && placement !== 'outward') {
    throw new RangeError('FocusRing placement must be inset or outward.');
  }
  const safeRest = {...rest} as HTMLAttributes<HTMLSpanElement>;
  delete safeRest.role;

  const elementRef = useRef<HTMLSpanElement>(null);
  const motionRef = useRef<{
    startMs: number;
    initial: Material3SpringFrame;
    target: number;
    spec: readonly [number, number];
    frame: number;
  } | null>(null);
  const [springFrame, setSpringFrame] = useState<Material3SpringFrame>({
    position: 0,
    velocity: 0,
  });
  const springFrameRef = useRef<Material3SpringFrame>({
    position: 0,
    velocity: 0,
  });
  const [focused, setFocused] = useState(false);
  const focusedRef = useRef(false);
  const assignRef = useCallback(
    (node: HTMLSpanElement | null) => {
      elementRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  useEffect(() => {
    const element = elementRef.current;
    const owner = element?.parentElement;
    if (!element || !owner) {
      return;
    }
    if (!ownerCanPaint(owner, placement)) {
      return;
    }
    const media = owner.ownerDocument.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    let target: HTMLElement | null = null;
    let labels: HTMLLabelElement[] = [];
    let observer: MutationObserver | null = null;
    let pointerSuppressed = false;
    let disposed = false;

    const sampleCurrent = (now: number): Material3SpringFrame => {
      const motion = motionRef.current;
      if (!motion) {
        return springFrameRef.current;
      }
      return sampleMaterial3Spring(
        motion.spec,
        [{timeMs: 0, target: motion.target}],
        Math.max(0, now - motion.startMs),
        motion.initial,
      );
    };

    const stopMotion = () => {
      if (motionRef.current) {
        cancelAnimationFrame(motionRef.current.frame);
      }
      motionRef.current = null;
    };

    const setVisible = (visible: boolean, immediate = false) => {
      if (focusedRef.current === visible && !immediate) {
        return;
      }
      const now = performance.now();
      const initial = sampleCurrent(now);
      stopMotion();
      focusedRef.current = visible;
      setFocused(visible);
      const next = visible ? 1 : 0;
      if (placement !== 'inset' || immediate || media?.matches) {
        springFrameRef.current = {position: next, velocity: 0};
        setSpringFrame(springFrameRef.current);
        return;
      }
      const expressive =
        owner.closest('[data-md-scheme="expressive-light"]') !== null;
      const spring =
        material3SpringSpecs[expressive ? 'expressive' : 'standard'].fast;
      const sourceSpec = visible ? spring.spatial : spring.effects;
      const spec: readonly [number, number] = [sourceSpec[0], sourceSpec[1]];
      const motion = {
        startMs: now,
        initial,
        target: next,
        spec,
        frame: 0,
      };
      motionRef.current = motion;
      const tick = (time: number) => {
        if (disposed || motionRef.current !== motion) {
          return;
        }
        const current = sampleCurrent(time);
        if (
          Math.abs(current.position - next) <= 0.0001 &&
          Math.abs(current.velocity) <= 0.0001
        ) {
          springFrameRef.current = {position: next, velocity: 0};
          setSpringFrame(springFrameRef.current);
          motionRef.current = null;
          return;
        }
        springFrameRef.current = current;
        setSpringFrame(current);
        motion.frame = requestAnimationFrame(tick);
      };
      motion.frame = requestAnimationFrame(tick);
    };

    const validTarget = (): HTMLElement | null => {
      const resolved = controlRef ? controlRef.current : owner;
      return resolved?.isConnected ? resolved : null;
    };
    const syncVisible = (immediate = false) => {
      const resolved = validTarget();
      const visible =
        !!resolved &&
        !pointerSuppressed &&
        !disabled(resolved, owner) &&
        resolved.ownerDocument.activeElement === resolved &&
        resolved.matches(':focus-visible');
      setVisible(visible, immediate);
    };
    const onFocus = () => syncVisible();
    const onBlur = () => {
      pointerSuppressed = false;
      syncVisible();
    };
    const onPointerDown = () => {
      pointerSuppressed = true;
      setVisible(false, true);
    };
    const onKeyDown = () => {
      pointerSuppressed = false;
      queueMicrotask(() => {
        if (!disposed) {
          syncVisible();
        }
      });
    };
    const reconnect = (records?: MutationRecord[]) => {
      const next = validTarget();
      if (target === next) {
        if (
          target &&
          records?.some(
            record =>
              record.type === 'attributes' &&
              (record.target === target || record.target === owner),
          )
        ) {
          syncVisible(true);
        }
        return;
      }
      target?.removeEventListener('focus', onFocus);
      target?.removeEventListener('blur', onBlur);
      target?.removeEventListener('pointerdown', onPointerDown);
      target?.removeEventListener('keydown', onKeyDown);
      labels.forEach(label =>
        label.removeEventListener('pointerdown', onPointerDown),
      );
      target = next;
      labels = target
        ? Array.from(owner.ownerDocument.querySelectorAll('label')).filter(
            label => label.control === target,
          )
        : [];
      target?.addEventListener('focus', onFocus);
      target?.addEventListener('blur', onBlur);
      target?.addEventListener('pointerdown', onPointerDown);
      target?.addEventListener('keydown', onKeyDown);
      labels.forEach(label =>
        label.addEventListener('pointerdown', onPointerDown),
      );
      pointerSuppressed = false;
      syncVisible(true);
      observer?.disconnect();
      observer = new MutationObserver(reconnect);
      const scope = target
        ? commonAncestor(owner, target)
        : owner.ownerDocument.documentElement;
      observer.observe(scope, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled'],
      });
    };
    reconnect();
    owner.addEventListener('pointerdown', onPointerDown);
    const onMotionPreference = () => syncVisible(true);
    media?.addEventListener('change', onMotionPreference);
    return () => {
      disposed = true;
      stopMotion();
      observer?.disconnect();
      target?.removeEventListener('focus', onFocus);
      target?.removeEventListener('blur', onBlur);
      target?.removeEventListener('pointerdown', onPointerDown);
      target?.removeEventListener('keydown', onKeyDown);
      labels.forEach(label =>
        label.removeEventListener('pointerdown', onPointerDown),
      );
      owner.removeEventListener('pointerdown', onPointerDown);
      media?.removeEventListener('change', onMotionPreference);
    };
  }, [controlRef, placement]);

  const stylexProps = stylex.props(
    styles.root,
    placement === 'inset' && styles.inset,
    placement === 'inset' && styles.insetFrame(springFrame.position),
    placement === 'outward' && styles.outward,
    placement === 'outward' && focused && styles.outwardFocused,
    styles.forcedColors,
  );
  return (
    <span
      {...safeRest}
      {...stylexProps}
      aria-hidden="true"
      tabIndex={-1}
      data-md-focus-progress={springFrame.position}
      data-md-focus-velocity={springFrame.velocity}
      className={[stylexProps.className, className].filter(Boolean).join(' ')}
      ref={assignRef}
    />
  );
}
