// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Material 3 FilledField gallery fixture. @output Interactive native filled shell story. @position Native Material 3 field review surface. */
import type {Meta, StoryObj} from '@storybook/react';

const meta: Meta = {
  title: 'Material 3/Native FilledField',
  tags: ['no-visual'],
  globals: {astryxTheme: 'none'},
  parameters: {layout: 'fullscreen'},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <iframe
      title="Interactive native Material 3 FilledField preview"
      src="/material3-gallery/fixtures/filled-field.html"
      style={{display: 'block', width: '100%', minHeight: 850, border: 0}}
    />
  ),
};
