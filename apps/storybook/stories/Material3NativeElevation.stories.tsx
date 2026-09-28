// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Material 3 Elevation gallery fixture. @output Interactive six-level Elevation story. @position Native Material 3 Elevation review surface. */
import type {Meta, StoryObj} from '@storybook/react';

const meta: Meta = {
  title: 'Material 3/Native Elevation',
  tags: ['no-visual'],
  globals: {astryxTheme: 'none'},
  parameters: {layout: 'fullscreen'},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <iframe
      title="Interactive native Material 3 Elevation preview"
      src="/material3-gallery/fixtures/elevation.html"
      style={{display: 'block', width: '100%', minHeight: 850, border: 0}}
    />
  ),
};
