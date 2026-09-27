// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Built native Material 3 FocusRing gallery fixture. @output Interactive keyboard and pointer FocusRing story. @position Native Material 3 FocusRing review surface. */
import type {Meta, StoryObj} from '@storybook/react';

const meta: Meta = {
  title: 'Material 3/Native FocusRing',
  tags: ['no-visual'],
  globals: {astryxTheme: 'none'},
  parameters: {layout: 'fullscreen'},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <iframe
      title="Interactive native Material 3 FocusRing preview"
      src="/material3-gallery/fixtures/focus-ring.html"
      style={{display: 'block', width: '100%', minHeight: 1050, border: 0}}
    />
  ),
};
