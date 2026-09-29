// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Native FilledField and caller-owned semantic inputs.
 * @output Form ownership, focus observation, affix phases, controlled visual states, and hydration checks.
 * @position Native field boundary regression before browser motion and pixel acceptance.
 */

import React, {createRef} from 'react';
import {act, render, screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FilledField, type FilledFieldProps} from './FilledField';

describe('native FilledField', () => {
  it('server renders and hydrates one caller-owned input and native label', () => {
    const content = (
      <form>
        <FilledField
          label={<label htmlFor="field-email">Email</label>}
          supportingText={<span id="field-help">Used for receipts</span>}>
          <input
            id="field-email"
            name="email"
            aria-describedby="field-help"
            defaultValue="a@example.com"
          />
        </FilledField>
      </form>
    );
    const host = document.createElement('div');
    host.innerHTML = renderToString(content);
    document.body.append(host);
    const {container} = render(content, {container: host, hydrate: true});
    const input = screen.getByRole('textbox', {name: 'Email'});
    const shell = container.querySelector('[data-md-filled-field]');
    expect(container.querySelectorAll('input')).toHaveLength(1);
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('aria-describedby', 'field-help');
    expect(input).toHaveValue('a@example.com');
    expect(shell).not.toHaveAttribute('role');
    expect(shell).not.toHaveAttribute('tabindex');
    expect(shell).not.toHaveAttribute('aria-hidden');
    host.remove();
  });

  it('observes nested focus and lets an explicit value override only the visual phase', () => {
    const ref = createRef<HTMLDivElement>();
    const {rerender} = render(
      <FilledField ref={ref} label="Name">
        <input aria-label="Name" />
      </FilledField>,
    );
    const input = screen.getByRole('textbox', {name: 'Name'});
    const shell = ref.current;
    expect(shell).toBeTruthy();
    expect(shell).not.toHaveAttribute('data-md-field-focused');
    act(() => input.focus());
    expect(shell).toHaveAttribute('data-md-field-focused');
    rerender(
      <FilledField ref={ref} label="Name" focused={false}>
        <input aria-label="Name" />
      </FilledField>,
    );
    expect(input).toHaveFocus();
    expect(shell).not.toHaveAttribute('data-md-field-focused');
    rerender(
      <FilledField ref={ref} label="Name" focused>
        <input aria-label="Name" />
      </FilledField>,
    );
    expect(shell).toHaveAttribute('data-md-field-focused');
  });

  it('keeps caller-owned disabled and validity semantics separate from visual flags', () => {
    const {rerender} = render(
      <FilledField label="Code" disabled error populated>
        <input aria-label="Code" aria-invalid="false" defaultValue="42" />
      </FilledField>,
    );
    const input = screen.getByRole('textbox', {name: 'Code'});
    const shell = document.querySelector('[data-md-filled-field]');
    expect(shell).toHaveAttribute('data-md-field-disabled');
    expect(shell).toHaveAttribute('data-md-field-error');
    expect(shell).toHaveAttribute('data-md-field-populated');
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    rerender(
      <FilledField label="Code" disabled focused>
        <input aria-label="Code" />
      </FilledField>,
    );
    expect(shell).not.toHaveAttribute('data-md-field-focused');
  });

  it('hides affixes while an empty inside label is expanded', () => {
    const field = (props: {label?: string; populated?: boolean}) => (
      <FilledField {...props} prefix="$" suffix=".00">
        <input aria-label="Amount" />
      </FilledField>
    );
    const empty = render(field({label: 'Amount'}));
    expect(
      empty.container.querySelector('[data-md-field-affix-position]'),
    ).toHaveAttribute('data-md-field-affix-position', '0');
    expect(
      empty.container.querySelector('[data-md-field-prefix]'),
    ).toHaveAttribute('aria-hidden', 'true');
    expect(
      empty.container.querySelector('[data-md-field-suffix]'),
    ).toHaveAttribute('aria-hidden', 'true');
    empty.unmount();

    for (const props of [{label: 'Amount', populated: true}, {}]) {
      const visible = render(field(props));
      expect(
        visible.container.querySelector('[data-md-field-affix-position]'),
      ).toHaveAttribute('data-md-field-affix-position', '1');
      expect(
        visible.container.querySelector('[data-md-field-prefix]'),
      ).not.toHaveAttribute('aria-hidden');
      expect(
        visible.container.querySelector('[data-md-field-suffix]'),
      ).not.toHaveAttribute('aria-hidden');
      visible.unmount();
    }
  });

  it('rejects semantic role and tab stop injection on the shell', () => {
    const unsafe = {
      role: 'textbox',
      tabIndex: 0,
      'aria-hidden': 'true',
    } as unknown as FilledFieldProps;
    render(
      <FilledField {...unsafe}>
        <input aria-label="Real control" />
      </FilledField>,
    );
    const shell = document.querySelector('[data-md-filled-field]');
    expect(shell).not.toHaveAttribute('role');
    expect(shell).not.toHaveAttribute('tabindex');
    expect(shell).not.toHaveAttribute('aria-hidden');
    expect(
      screen.getByRole('textbox', {name: 'Real control'}),
    ).toBeInTheDocument();
  });
});
