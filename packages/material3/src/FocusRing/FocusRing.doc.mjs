// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'FocusRing',
  displayName: 'Material 3 Focus Ring',
  category: 'Feedback',
  keywords: ['material', 'focus', 'keyboard', 'indicator'],
  props: [
    {
      name: 'placement',
      type: "'inset' | 'outward'",
      required: true,
      description:
        'Select the Compose two-stroke inset ring or the separately sourced outward ring.',
    },
    {
      name: 'controlRef',
      type: 'RefObject<HTMLElement | null>',
      description:
        'Pass a ref when a separate focusable element, such as a hidden input, controls the visible ring.',
    },
  ],
  usage: {
    description:
      'Place one FocusRing directly inside a positioned visual owner and import components.css and tokens.css. The owner remains responsible for focus, accessible name, disabled state, activation and target size. Outward placement needs an unclipped owner and ancestor chain.',
    anatomy: [
      {
        name: 'Decorative ring',
        required: true,
        description: 'One visual indicator with no independent focus target.',
      },
    ],
    bestPractices: [
      {
        guidance: true,
        description:
          'Use inset placement when the ring should follow the visual owner shape.',
      },
      {
        guidance: true,
        description:
          'Use controlRef to associate a visible indicator with a separate semantic input.',
      },
      {
        guidance: false,
        description:
          'Add FocusRing to a native Material control that already provides its default focus indication.',
      },
    ],
  },
};
