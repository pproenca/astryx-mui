// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Material3Icons.stories.tsx
 * @input Built native Material 3 Icon gallery and Storybook review surface
 * @output Dedicated interactive native Icon and MaterialSymbol story
 * @position Native Material 3 component review outside Core theme previews
 */
import type {Meta, StoryObj} from '@storybook/react';

const meta: Meta = {
  title: 'Material 3/Native Icon',
  tags: ['no-visual'],
  globals: {astryxTheme: 'none'},
  parameters: {layout: 'fullscreen'},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: () => (
    <iframe
      title="Interactive native Material 3 Icon preview"
      src="/material3-gallery/fixtures/icons.html"
      style={{display: 'block', width: '100%', minHeight: 1150, border: 0}}
    />
  ),
};
