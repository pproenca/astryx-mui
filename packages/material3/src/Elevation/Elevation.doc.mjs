// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'Elevation',
  displayName: 'Material 3 Elevation',
  category: 'Layout',
  keywords: ['material', 'elevation', 'shadow', 'surface'],
  props: [
    {
      name: 'level',
      type: '0 | 1 | 2 | 3 | 4 | 5',
      description:
        'Static shadow level. Defaults to 0. The owner supplies its own tonal color and state changes.',
    },
  ],
  usage: {
    description:
      'Place Elevation as a direct child of a positioned visual owner and import components.css and tokens.css. It is decorative and inherits the owner shape. The Material shadow color token can be overridden on that owner.',
    anatomy: [
      {
        name: 'Key and ambient shadow layers',
        required: true,
        description: 'Independent source-backed shadows within one inert span.',
      },
    ],
    bestPractices: [
      {
        guidance: true,
        description: 'Use one Elevation inside a custom positioned surface.',
      },
      {
        guidance: true,
        description: 'Keep tonal color, focus, actions, and transitions on the owner.',
      },
      {
        guidance: false,
        description: 'Use Elevation as a focus target or accessible surface.',
      },
    ],
  },
};
