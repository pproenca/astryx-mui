// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material indication values and motion: Copyright The Android Open Source Project and Google LLC, Apache-2.0.

'use client';

/**
 * @file Ripple.tsx
 * @input A positioned visual owner, optional semantic control ref, and caller-owned drag state
 * @output One decorative Compose-timed Material 3 press and state indication
 * @position Native Ripple for custom controls; the owner retains action, form and focus semantics
 *
 * SYNC: Ripple.spec.md, Ripple.doc.mjs and the pinned Ripple source baseline.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  type HTMLAttributes,
  type Ref,
  type RefObject,
} from 'react';
import * as stylex from '@stylexjs/stylex';
import {material3StateOpacity} from '../foundation.js';

export interface RippleProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'style' | 'color' | 'tabIndex' | 'role' | 'aria-hidden'
> {
  /** Select center-origin outward paint; bounded paint is the default. */
  unbounded?: boolean;
  /** A distinct semantic target, such as a hidden input beside the visual owner. */
  controlRef?: RefObject<HTMLElement | null>;
  /** Caller-owned semantic drag state; pointer movement alone does not identify dragging. */
  dragged?: boolean;
  /** Ref to the decorative span, never the semantic target. */
  ref?: Ref<HTMLSpanElement>;
}

type Interaction = 'hover' | 'focus' | 'drag';
type Press = {
  node: HTMLSpanElement;
  circle: HTMLSpanElement;
  entry: Animation;
  growth: Animation;
  position: Animation;
  exit?: Animation;
  timer?: number;
  started: number;
  released: boolean;
};

const PRESS_ENTRY_MS = 75;
const PRESS_GROWTH_MS = 225;
const PRESS_EXIT_MS = 150;
const START_RADIUS_FRACTION = 0.3;
const BOUNDED_RADIUS_EXTENSION = 10;
const FAST_OUT_SLOW_IN = 'cubic-bezier(0.4, 0, 0.2, 1)';

const styles = stylex.create({
  root: {
    position: 'absolute',
    inset: 0,
    display: 'block',
    overflow: 'hidden',
    borderRadius: 'inherit',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  unbounded: {overflow: 'visible'},
  state: {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    backgroundColor: 'currentColor',
    opacity: 0,
    pointerEvents: 'none',
    '@media (forced-colors: active)': {
      backgroundColor: 'Highlight',
      forcedColorAdjust: 'none',
    },
  },
  pressLayer: {position: 'absolute', inset: 0, pointerEvents: 'none'},
  moving: {position: 'absolute', top: 0, left: 0, pointerEvents: 'none'},
  circle: (radius: number) => ({
    position: 'absolute',
    top: `${-radius}px`,
    left: `${-radius}px`,
    width: `${radius * 2}px`,
    height: `${radius * 2}px`,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    opacity: 0,
    pointerEvents: 'none',
    '@media (forced-colors: active)': {
      backgroundColor: 'Highlight',
      forcedColorAdjust: 'none',
    },
  }),
});

function applyStylex(
  node: HTMLElement,
  props: ReturnType<typeof stylex.props>,
) {
  node.className = props.className || '';
  for (const [name, value] of Object.entries(props.style || {}))
    {node.style.setProperty(name, String(value));}
}

function disabled(target: HTMLElement, owner: HTMLElement): boolean {
  return (
    target.matches(':disabled,[aria-disabled="true"],[inert]') ||
    owner.matches(':disabled,[aria-disabled="true"],[inert]') ||
    target.closest('[inert]') !== null
  );
}

function commonAncestor(a: HTMLElement, b: HTMLElement): HTMLElement {
  let ancestor: HTMLElement | null = a;
  while (ancestor && !ancestor.contains(b)) {ancestor = ancestor.parentElement;}
  return ancestor ?? a.ownerDocument.documentElement;
}

function canPaint(owner: HTMLElement, unbounded: boolean): boolean {
  if (getComputedStyle(owner).position === 'static') {
    console.warn('Ripple visual parent must be positioned.');
    return false;
  }
  if (!unbounded) {return true;}
  let ancestor: HTMLElement | null = owner;
  while (ancestor && ancestor !== owner.ownerDocument.body) {
    const css = getComputedStyle(ancestor);
    if (
      ['hidden', 'clip'].includes(css.overflowX) ||
      ['hidden', 'clip'].includes(css.overflowY)
    ) {
      console.warn(
        'Unbounded Ripple requires an unclipped visual parent and ancestors.',
      );
      return false;
    }
    ancestor = ancestor.parentElement;
  }
  return true;
}

function stateDuration(next: Interaction | null, previous: Interaction | null) {
  if (next === 'hover') {return 15;}
  if (next === 'focus' || next === 'drag') {return 45;}
  return previous === 'drag' ? 150 : 15;
}

/** A decorative Compose-first indication for one positioned custom-control owner. */
export function Ripple({
  unbounded = false,
  controlRef,
  dragged = false,
  className,
  ref,
  ...rest
}: RippleProps) {
  const safeRest = {...rest} as HTMLAttributes<HTMLSpanElement>;
  delete safeRest.role;
  const rootRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const pressesRef = useRef<HTMLSpanElement>(null);
  const draggedRef = useRef(dragged);
  const syncDragRef = useRef<(() => void) | null>(null);
  const assignRef = useCallback(
    (node: HTMLSpanElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') {ref(node);}
      else if (ref) {ref.current = node;}
    },
    [ref],
  );

  useEffect(() => {
    const root = rootRef.current;
    const state = stateRef.current;
    const pressLayer = pressesRef.current;
    const owner = root?.parentElement;
    if (!root || !state || !pressLayer || !owner || !canPaint(owner, unbounded))
      {return;}
    const doc = owner.ownerDocument;
    const media = doc.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const interactions = new Map<Interaction, number>();
    const presses = new Set<Press>();
    let sequence = 0;
    let target: HTMLElement | null = null;
    let labels: HTMLLabelElement[] = [];
    let observer: MutationObserver | null = null;
    let currentState: Interaction | null = null;
    let stateAnimation: Animation | null = null;
    let activePress: Press | null = null;
    let activePointer: number | null = null;
    let keyboardPress = false;
    let hoverOwner = false;
    let hoverTarget = false;
    let disposed = false;

    const removePress = (press: Press) => {
      if (press.timer !== undefined) {clearTimeout(press.timer);}
      for (const animation of [
        press.entry,
        press.growth,
        press.position,
        press.exit,
      ])
        {animation?.cancel();}
      press.node.remove();
      presses.delete(press);
      if (activePress === press) {activePress = null;}
    };
    const clearPresses = () => {
      for (const press of [...presses]) {removePress(press);}
      activePointer = null;
      keyboardPress = false;
      doc.removeEventListener('pointerup', onPointerUp);
      doc.removeEventListener('pointercancel', onPointerCancel);
    };
    const selectedState = () => {
      let selected: Interaction | null = null;
      let newest = -1;
      for (const [kind, order] of interactions) {
        if (order > newest) {
          selected = kind;
          newest = order;
        }
      }
      return selected;
    };
    const paintState = (immediate = false) => {
      const next = selectedState();
      if (next === currentState && (!immediate || !stateAnimation)) {return;}
      const from = Number(getComputedStyle(state).opacity);
      stateAnimation?.cancel();
      const opacity = next
        ? material3StateOpacity[next === 'drag' ? 'dragged' : next]
        : 0;
      const duration =
        immediate || media?.matches ? 0 : stateDuration(next, currentState);
      stateAnimation = state.animate([{opacity: from}, {opacity}], {
        duration,
        easing: 'linear',
        fill: 'forwards',
      });
      currentState = next;
      root.dataset.mdRippleState = next ?? 'rest';
    };
    const setInteraction = (kind: Interaction, active: boolean) => {
      if (active === interactions.has(kind)) {return;}
      if (active) {interactions.set(kind, ++sequence);}
      else {interactions.delete(kind);}
      paintState();
    };
    const resolveTarget = () => {
      const resolved = controlRef ? controlRef.current : owner;
      return resolved?.isConnected ? resolved : null;
    };
    const enabled = () => !!target && !disabled(target, owner);
    const syncDrag = () =>
      setInteraction('drag', draggedRef.current && enabled());
    syncDragRef.current = syncDrag;
    const syncHover = () =>
      setInteraction('hover', (hoverOwner || hoverTarget) && enabled());
    const syncFocus = () =>
      setInteraction(
        'focus',
        enabled() &&
          doc.activeElement === target &&
          !!target?.matches(':focus-visible'),
      );
    const clearInteractions = () => {
      interactions.clear();
      paintState(true);
    };
    const startPress = (x: number, y: number) => {
      if (!enabled()) {return;}
      if (activePress) {finishPress(activePress);}
      const width = owner.clientWidth;
      const height = owner.clientHeight;
      const largest = Math.max(width, height);
      if (largest <= 0) {return;}
      const startRadius = largest * START_RADIUS_FRACTION;
      const endRadius =
        Math.hypot(width, height) / 2 +
        (unbounded ? 0 : BOUNDED_RADIUS_EXTENSION);
      const centerX = width / 2;
      const centerY = height / 2;
      const originX = unbounded ? centerX : x;
      const originY = unbounded ? centerY : y;
      const moving = doc.createElement('span');
      const circle = doc.createElement('span');
      applyStylex(moving, stylex.props(styles.moving));
      applyStylex(circle, stylex.props(styles.circle(startRadius)));
      moving.append(circle);
      pressLayer.append(moving);
      const reduced = !!media?.matches;
      const position = moving.animate(
        [
          {left: `${originX}px`, top: `${originY}px`},
          {left: `${centerX}px`, top: `${centerY}px`},
        ],
        {
          duration: reduced ? 0 : PRESS_GROWTH_MS,
          easing: 'linear',
          fill: 'forwards',
        },
      );
      const growth = circle.animate(
        [
          {
            left: `${-startRadius}px`,
            top: `${-startRadius}px`,
            width: `${startRadius * 2}px`,
            height: `${startRadius * 2}px`,
          },
          {
            left: `${-endRadius}px`,
            top: `${-endRadius}px`,
            width: `${endRadius * 2}px`,
            height: `${endRadius * 2}px`,
          },
        ],
        {
          duration: reduced ? 0 : PRESS_GROWTH_MS,
          easing: FAST_OUT_SLOW_IN,
          fill: 'forwards',
        },
      );
      const entry = circle.animate(
        [{opacity: 0}, {opacity: material3StateOpacity.pressed}],
        {
          duration: reduced ? 0 : PRESS_ENTRY_MS,
          easing: 'linear',
          fill: 'forwards',
        },
      );
      const press: Press = {
        node: moving,
        circle,
        entry,
        growth,
        position,
        started: performance.now(),
        released: false,
      };
      presses.add(press);
      activePress = press;
    };
    const finishPress = (press: Press) => {
      if (press.released || !presses.has(press)) {return;}
      press.released = true;
      if (activePress === press) {activePress = null;}
      if (media?.matches) {
        removePress(press);
        return;
      }
      press.entry.finish();
      const remaining = Math.max(
        0,
        PRESS_GROWTH_MS - (performance.now() - press.started),
      );
      press.timer = doc.defaultView?.setTimeout(() => {
        if (disposed || !presses.has(press)) {return;}
        press.exit = press.circle.animate(
          [{opacity: material3StateOpacity.pressed}, {opacity: 0}],
          {duration: PRESS_EXIT_MS, easing: 'linear', fill: 'forwards'},
        );
        press.exit.finished.then(() => removePress(press)).catch(() => {});
      }, remaining);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        !enabled() ||
        (activePointer !== null && activePointer !== event.pointerId)
      )
        {return;}
      if (activePointer === event.pointerId) {return;}
      const rect = owner.getBoundingClientRect();
      activePointer = event.pointerId;
      startPress(event.clientX - rect.left, event.clientY - rect.top);
      doc.addEventListener('pointerup', onPointerUp);
      doc.addEventListener('pointercancel', onPointerCancel);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) {return;}
      activePointer = null;
      doc.removeEventListener('pointerup', onPointerUp);
      doc.removeEventListener('pointercancel', onPointerCancel);
      if (activePress) {finishPress(activePress);}
    };
    const onPointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) {return;}
      clearPresses();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key !== ' ' && event.key !== 'Enter') ||
        event.repeat ||
        keyboardPress
      )
        {return;}
      keyboardPress = true;
      startPress(owner.clientWidth / 2, owner.clientHeight / 2);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if ((event.key !== ' ' && event.key !== 'Enter') || !keyboardPress)
        {return;}
      keyboardPress = false;
      if (activePress) {finishPress(activePress);}
    };
    const onBlur = () => {
      keyboardPress = false;
      if (activePress) {finishPress(activePress);}
      syncFocus();
    };
    const onFocus = () => syncFocus();
    const onOwnerEnter = () => {
      hoverOwner = true;
      syncHover();
    };
    const onOwnerLeave = () => {
      hoverOwner = false;
      syncHover();
    };
    const onTargetEnter = () => {
      hoverTarget = true;
      syncHover();
    };
    const onTargetLeave = () => {
      hoverTarget = false;
      syncHover();
    };
    const reconnect = () => {
      const next = resolveTarget();
      if (next === target) {
        if (!enabled()) {
          clearPresses();
          clearInteractions();
        } else {
          syncDrag();
          syncFocus();
          syncHover();
        }
        return;
      }
      target?.removeEventListener('pointerdown', onPointerDown);
      target?.removeEventListener('pointerenter', onTargetEnter);
      target?.removeEventListener('pointerleave', onTargetLeave);
      target?.removeEventListener('focus', onFocus);
      target?.removeEventListener('blur', onBlur);
      target?.removeEventListener('keydown', onKeyDown);
      target?.removeEventListener('keyup', onKeyUp);
      for (const label of labels)
        {label.removeEventListener('pointerdown', onPointerDown);}
      clearPresses();
      clearInteractions();
      target = next;
      labels = target
        ? Array.from(doc.querySelectorAll('label')).filter(
            label => label.control === target,
          )
        : [];
      target?.addEventListener('pointerdown', onPointerDown);
      target?.addEventListener('pointerenter', onTargetEnter);
      target?.addEventListener('pointerleave', onTargetLeave);
      target?.addEventListener('focus', onFocus);
      target?.addEventListener('blur', onBlur);
      target?.addEventListener('keydown', onKeyDown);
      target?.addEventListener('keyup', onKeyUp);
      for (const label of labels)
        {label.addEventListener('pointerdown', onPointerDown);}
      hoverOwner = owner.matches(':hover');
      hoverTarget = !!target?.matches(':hover');
      syncHover();
      syncFocus();
      syncDrag();
      observer?.disconnect();
      observer = new MutationObserver(reconnect);
      observer.observe(
        target ? commonAncestor(owner, target) : doc.documentElement,
        {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['disabled', 'aria-disabled', 'inert'],
        },
      );
    };
    reconnect();
    owner.addEventListener('pointerdown', onPointerDown);
    owner.addEventListener('pointerenter', onOwnerEnter);
    owner.addEventListener('pointerleave', onOwnerLeave);
    const onMotionPreference = () => {
      if (media?.matches) {
        for (const press of [...presses]) {
          if (press.released) {removePress(press);}
          else {
            press.position.finish();
            press.growth.finish();
            press.entry.finish();
          }
        }
      }
      paintState(true);
    };
    media?.addEventListener('change', onMotionPreference);
    root.dataset.mdRippleReady = 'true';
    return () => {
      disposed = true;
      delete root.dataset.mdRippleReady;
      syncDragRef.current = null;
      observer?.disconnect();
      clearPresses();
      stateAnimation?.cancel();
      target?.removeEventListener('pointerdown', onPointerDown);
      target?.removeEventListener('pointerenter', onTargetEnter);
      target?.removeEventListener('pointerleave', onTargetLeave);
      target?.removeEventListener('focus', onFocus);
      target?.removeEventListener('blur', onBlur);
      target?.removeEventListener('keydown', onKeyDown);
      target?.removeEventListener('keyup', onKeyUp);
      for (const label of labels)
        {label.removeEventListener('pointerdown', onPointerDown);}
      owner.removeEventListener('pointerdown', onPointerDown);
      owner.removeEventListener('pointerenter', onOwnerEnter);
      owner.removeEventListener('pointerleave', onOwnerLeave);
      media?.removeEventListener('change', onMotionPreference);
    };
  }, [controlRef, unbounded]);

  useEffect(() => {
    draggedRef.current = dragged;
    syncDragRef.current?.();
  }, [dragged]);

  const rootStyles = stylex.props(styles.root, unbounded && styles.unbounded);
  return (
    <span
      {...safeRest}
      {...rootStyles}
      ref={assignRef}
      className={
        className
          ? `${rootStyles.className} ${className}`
          : rootStyles.className
      }
      aria-hidden="true"
      tabIndex={-1}>
      <span ref={stateRef} {...stylex.props(styles.state)} />
      <span ref={pressesRef} {...stylex.props(styles.pressLayer)} />
    </span>
  );
}
