// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @input Product-owned native Material 3 gallery and Storybook mode/direction globals.
 * @output Interactive native foundation story with source comparisons and motion playback.
 * @position Storybook entry for native Material 3 foundations; components are separately gated.
 */
import type {Meta, StoryObj} from '@storybook/react';

const meta: Meta = {
  title: 'Material 3/Native foundations',
  globals: {astryxTheme: 'none'},
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The iframe runs the native Material 3 package. Source comparisons, the exact build revision, and watched motion are included. Native component previews remain pending until each component passes review.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {
  render: (_args, context) => {
    const scheme = context.globals.colorMode === 'dark' ? 'dark' : 'light';
    const direction = context.globals.direction === 'rtl' ? 'rtl' : 'ltr';
    const query = new URLSearchParams({scheme, direction});
    return (
      <iframe
        key={query.toString()}
        title="Interactive native Material 3 foundation gallery"
        src={`/material3-gallery/index.html?${query}`}
        style={{display: 'block', width: '100%', minHeight: 1100, border: 0}}
      />
    );
  },
};
