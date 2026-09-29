// Copyright (c) Meta Platforms, Inc. and affiliates.
// Material field values: Copyright The Android Open Source Project and Google LLC, Apache-2.0.

'use client';

/**
 * @file FilledField.tsx
 * @input Caller-owned control and visual slots, Compose field state, Material roles, and shared field springs
 * @output Native filled field decoration without another semantic form control
 * @position Optional native Material 3 shell for advanced custom controls
 *
 * SYNC: FilledField.spec.md, FilledField.doc.mjs, and the shared field source decision.
 */

import React, {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import * as stylex from '@stylexjs/stylex';
import {useFieldMotion} from '../Field/useFieldMotion.js';

export interface FilledFieldProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'style' | 'role' | 'tabIndex' | 'aria-hidden' | 'prefix'
> {
  /** One caller-owned semantic control. */
  children: ReactNode;
  label?: ReactNode;
  supportingText?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Overrides observed focus for visual state only. */
  focused?: boolean;
  /** Caller-owned nonempty state; the shell never reads or changes the control value. */
  populated?: boolean;
  /** Visual state only; disable the child separately. */
  disabled?: boolean;
  /** Visual state only; set child validity semantics separately. */
  error?: boolean;
  ref?: Ref<HTMLDivElement>;
}

const styles = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'block',
    minWidth: 'min(280px, 100%)',
    width: '100%',
    color:
      'var(--md-filled-field-content-color, var(--md-sys-color-on-surface))',
    fontFamily: 'var(--md-sys-typescale-body-large-font)',
    fontSize: 'var(--md-sys-typescale-body-large-size)',
    lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
  },
  focusContent: {
    color:
      'var(--md-filled-field-focus-content-color, var(--md-sys-color-on-surface))',
  },
  disabledContent: {
    color:
      'color-mix(in srgb, var(--md-filled-field-disabled-content-color, var(--md-sys-color-on-surface)) 38%, transparent)',
  },
  container: {
    boxSizing: 'border-box',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: '56px',
    borderRadius: '4px 4px 0 0',
    backgroundColor:
      'var(--md-filled-field-container-color, var(--md-sys-color-surface-container-highest))',
    '::after': {
      content: '""',
      position: 'absolute',
      insetInline: 0,
      bottom: 0,
      height: 'var(--md-filled-field-active-indicator-height, 1px)',
      backgroundColor:
        'var(--md-filled-field-active-indicator-color, var(--md-sys-color-on-surface-variant))',
      pointerEvents: 'none',
    },
    '@media (forced-colors: active)': {
      backgroundColor: 'Canvas',
      '::after': {backgroundColor: 'CanvasText'},
    },
  },
  indicator: (progress: number, color: string) => ({
    '::after': {
      height: `max(0px, calc(var(--md-filled-field-active-indicator-height, 1px) * ${1 - progress} + var(--md-filled-field-focus-active-indicator-height, 2px) * ${progress}))`,
      backgroundColor: color,
    },
  }),
  hoverIndicator: {
    '@media (hover: hover)': {
      ':hover': {
        '::after': {
          backgroundColor:
            'var(--md-filled-field-hover-active-indicator-color, var(--md-sys-color-on-surface))',
        },
      },
    },
  },
  lane: {
    boxSizing: 'border-box',
    flex: '0 0 24px',
    width: '24px',
    height: '24px',
    color:
      'var(--md-filled-field-leading-content-color, var(--md-sys-color-on-surface-variant))',
  },
  leading: {marginInlineStart: '16px', marginInlineEnd: '16px'},
  trailing: {
    marginInlineStart: '16px',
    marginInlineEnd: '16px',
    color:
      'var(--md-filled-field-trailing-content-color, var(--md-sys-color-on-surface-variant))',
  },
  body: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 auto',
    minWidth: 0,
    minHeight: '56px',
    paddingInline: '16px',
  },
  bodyWithLeading: {paddingInlineStart: 0},
  bodyWithTrailing: {paddingInlineEnd: 0},
  content: {
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 auto',
    minWidth: 0,
  },
  contentWithLabel: {paddingBlockStart: '16px'},
  affix: (progress: number) => ({
    flex: '0 0 auto',
    color: 'var(--md-sys-color-on-surface-variant)',
    opacity: Math.max(0, Math.min(1, progress)),
    visibility: progress > 0 ? 'visible' : 'hidden',
  }),
  prefix: {marginInlineEnd: '2px'},
  suffix: {marginInlineStart: '2px'},
  label: (progress: number, color: string) => ({
    position: 'absolute',
    insetInlineStart: 0,
    top: `${16 - 13 * progress}px`,
    maxWidth: '100%',
    fontSize: `${16 - 4 * progress}px`,
    lineHeight: `${24 - 8 * progress}px`,
    color,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  labelWithoutLeading: {insetInlineStart: '16px'},
  supporting: {
    minHeight: '16px',
    marginBlockStart: '4px',
    paddingInline: '16px',
    color:
      'var(--md-filled-field-supporting-text-color, var(--md-sys-color-on-surface-variant))',
    fontFamily: 'var(--md-sys-typescale-body-small-font)',
    fontSize: 'var(--md-sys-typescale-body-small-size)',
    lineHeight: 'var(--md-sys-typescale-body-small-line-height)',
  },
  errorText: {
    color:
      'var(--md-filled-field-error-supporting-text-color, var(--md-sys-color-error))',
  },
  disabledText: {
    color:
      'color-mix(in srgb, var(--md-filled-field-disabled-supporting-text-color, var(--md-sys-color-on-surface)) 38%, transparent)',
  },
  control: {
    boxSizing: 'border-box',
    display: 'block',
    flex: '1 1 auto',
    minWidth: 0,
    width: '100%',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    borderStyle: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    caretColor: 'var(--md-sys-color-primary)',
    font: 'inherit',
    lineHeight: '24px',
  },
  placeholder: (opacity: number) => ({
    '::placeholder': {
      color:
        'var(--md-filled-field-label-text-color, var(--md-sys-color-on-surface-variant))',
      opacity: Math.max(0, Math.min(1, opacity)),
    },
  }),
});

function visualColor(
  progress: number,
  error: boolean,
  disabled: boolean,
): string {
  if (disabled) {
    return 'color-mix(in srgb, var(--md-filled-field-disabled-label-text-color, var(--md-sys-color-on-surface)) 38%, transparent)';
  }
  const base = error
    ? 'var(--md-filled-field-error-label-text-color, var(--md-sys-color-error))'
    : 'var(--md-filled-field-label-text-color, var(--md-sys-color-on-surface-variant))';
  const focus = error
    ? 'var(--md-filled-field-error-focus-label-text-color, var(--md-sys-color-error))'
    : 'var(--md-filled-field-focus-label-text-color, var(--md-sys-color-primary))';
  const percentage =
    Math.round(Math.max(0, Math.min(1, progress)) * 10000) / 100;
  return `color-mix(in srgb, ${focus} ${percentage}%, ${base})`;
}

function indicatorColor(progress: number, error: boolean, disabled: boolean) {
  if (disabled) {
    return 'color-mix(in srgb, var(--md-filled-field-disabled-active-indicator-color, var(--md-sys-color-on-surface)) 38%, transparent)';
  }
  const base = error
    ? 'var(--md-filled-field-error-active-indicator-color, var(--md-sys-color-error))'
    : 'var(--md-filled-field-active-indicator-color, var(--md-sys-color-on-surface-variant))';
  const focus = error
    ? 'var(--md-filled-field-error-focus-active-indicator-color, var(--md-sys-color-error))'
    : 'var(--md-filled-field-focus-active-indicator-color, var(--md-sys-color-primary))';
  const percentage =
    Math.round(Math.max(0, Math.min(1, progress)) * 10000) / 100;
  return `color-mix(in srgb, ${focus} ${percentage}%, ${base})`;
}

function decorateControl(children: ReactNode, placeholder: number): ReactNode {
  if (
    !isValidElement(children) ||
    (children.type !== 'input' && children.type !== 'textarea')
  ) {
    return children;
  }
  const control = children as ReactElement<{
    className?: string;
    style?: CSSProperties;
  }>;
  const paint = stylex.props(styles.control, styles.placeholder(placeholder));
  return cloneElement(control, {
    className: [control.props.className, paint.className]
      .filter(Boolean)
      .join(' '),
    style: {...control.props.style, ...paint.style},
  });
}

/** Paint a Compose filled decoration around one caller-owned control. */
export function FilledField({
  children,
  label,
  supportingText,
  leadingIcon,
  trailingIcon,
  prefix,
  suffix,
  focused,
  populated = false,
  disabled = false,
  error = false,
  className,
  onFocusCapture,
  onBlurCapture,
  ref,
  ...rest
}: FilledFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [observedFocus, setObservedFocus] = useState(false);
  const [expressive, setExpressive] = useState(false);
  const visualFocus = disabled ? false : (focused ?? observedFocus);
  const hasLabel = label !== undefined && label !== null;
  const motion = useFieldMotion(visualFocus, populated, hasLabel, expressive);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const update = () => {
      setObservedFocus(root.contains(root.ownerDocument.activeElement));
      setExpressive(
        Boolean(root.closest('[data-md-scheme="expressive-light"]')),
      );
    };
    update();
    const observer = new MutationObserver(update);
    for (let node: Element | null = root; node; node = node.parentElement) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['data-md-scheme'],
      });
    }
    return () => observer.disconnect();
  }, []);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    setObservedFocus(true);
    onFocusCapture?.(event);
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setObservedFocus(false);
    }
    onBlurCapture?.(event);
  };
  const color = visualColor(motion.color, error, disabled);
  const rootPaint = stylex.props(
    styles.root,
    visualFocus && styles.focusContent,
    disabled && styles.disabledContent,
  );
  const containerPaint = stylex.props(
    styles.container,
    !visualFocus && !error && !disabled && styles.hoverIndicator,
    styles.indicator(
      motion.indicator - 1,
      indicatorColor(motion.color, error, disabled),
    ),
  );
  return (
    <div
      {...rest}
      {...rootPaint}
      className={[rootPaint.className, className].filter(Boolean).join(' ')}
      ref={setRef}
      role={undefined}
      tabIndex={undefined}
      aria-hidden={undefined}
      onFocusCapture={onFocus}
      onBlurCapture={onBlur}
      data-md-filled-field=""
      data-md-field-focused={visualFocus ? '' : undefined}
      data-md-field-populated={populated ? '' : undefined}
      data-md-field-disabled={disabled ? '' : undefined}
      data-md-field-error={error ? '' : undefined}
      data-md-field-label-position={motion.label}
      data-md-field-label-velocity={motion.velocity.label}
      data-md-field-placeholder-position={motion.placeholder}
      data-md-field-placeholder-velocity={motion.velocity.placeholder}
      data-md-field-affix-position={motion.affix}
      data-md-field-affix-velocity={motion.velocity.affix}
      data-md-field-indicator-position={motion.indicator}
      data-md-field-indicator-velocity={motion.velocity.indicator}
      data-md-field-color-position={motion.color}
      data-md-field-color-velocity={motion.velocity.color}>
      <div {...containerPaint} data-md-field-container="">
        {leadingIcon != null && (
          <span
            {...stylex.props(styles.lane, styles.leading)}
            data-md-field-leading=""
            aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <div
          {...stylex.props(
            styles.body,
            leadingIcon != null && styles.bodyWithLeading,
            trailingIcon != null && styles.bodyWithTrailing,
          )}>
          {hasLabel && (
            <span
              {...stylex.props(
                styles.label(motion.label, color),
                leadingIcon == null && styles.labelWithoutLeading,
              )}
              data-md-field-label="">
              {label}
            </span>
          )}
          {prefix != null && (
            <span
              {...stylex.props(styles.affix(motion.affix), styles.prefix)}
              data-md-field-prefix=""
              aria-hidden={motion.affix <= 0 ? true : undefined}>
              {prefix}
            </span>
          )}
          <span
            {...stylex.props(
              styles.content,
              hasLabel && styles.contentWithLabel,
            )}
            data-md-field-content="">
            {decorateControl(children, motion.placeholder)}
          </span>
          {suffix != null && (
            <span
              {...stylex.props(styles.affix(motion.affix), styles.suffix)}
              data-md-field-suffix=""
              aria-hidden={motion.affix <= 0 ? true : undefined}>
              {suffix}
            </span>
          )}
        </div>
        {trailingIcon != null && (
          <span
            {...stylex.props(styles.lane, styles.trailing)}
            data-md-field-trailing=""
            aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </div>
      {supportingText != null && (
        <div
          {...stylex.props(
            styles.supporting,
            error && styles.errorText,
            disabled && styles.disabledText,
          )}
          data-md-field-supporting="">
          {supportingText}
        </div>
      )}
    </div>
  );
}
