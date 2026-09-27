// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Material 3 Divider gallery fixture. @output Interactive native horizontal and vertical Divider story. @position Native Material 3 Divider review surface. */
import type {Meta, StoryObj} from '@storybook/react';

const meta: Meta = {
  title: 'Material 3/Native Divider',
  tags: ['no-visual'],
  globals: {astryxTheme: 'none'},
  parameters: {layout: 'fullscreen'},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <iframe
      title="Interactive native Material 3 Divider preview"
      src="/material3-gallery/fixtures/divider.html"
      style={{display: 'block', width: '100%', minHeight: 850, border: 0}}
    />
  ),
};
