// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'Ripple',
  displayName: 'Material 3 Ripple',
  category: 'Feedback',
  keywords: ['material', 'ripple', 'press', 'state layer'],
  props: [
    {
      name: 'unbounded',
      type: 'boolean',
      description: 'Paint outward from the center instead of clipping the press to the visual owner.',
    },
    {
      name: 'controlRef',
      type: 'RefObject<HTMLElement | null>',
      description: 'Use a separate semantic target, such as an input inside a visible label.',
    },
    {
      name: 'dragged',
      type: 'boolean',
      description: 'Supply the custom control’s semantic drag state for its Material state layer.',
    },
  ],
  usage: {
    description:
      'Place Ripple directly inside a positioned visual owner and import tokens.css and components.css. The owner supplies its own accessible name, focus indicator, activation, disabled behavior, target size and form semantics. Bounded paint follows the owner shape; unbounded paint needs an unclipped ancestor chain.',
    anatomy: [
      {
        name: 'Decorative indication',
        required: true,
        description: 'A pointer-inert press circle and state layer with no independent focus target.',
      },
    ],
    bestPractices: [
      {
        guidance: true,
        description: 'Use the default bounded paint for controls whose surface should clip the press.',
      },
      {
        guidance: true,
        description: 'Pass controlRef when the visible surface is separate from the input that owns interaction.',
      },
      {
        guidance: false,
        description: 'Add this custom-control primitive to a native Material control that already renders its indication.',
      },
    ],
  },
};
