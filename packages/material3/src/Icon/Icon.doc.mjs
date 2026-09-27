// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'Icon',
  displayName: 'Material 3 Icon',
  category: 'Content',
  keywords: ['material', 'icon', 'svg', 'glyph'],
  props: [
    {
      name: 'icon',
      type: 'ComponentType<SVGProps<SVGSVGElement>>',
      required: true,
      description:
        'Consumer-supplied SVG component. The glyph scales inside the resolved dimensions.',
    },
    {
      name: 'size',
      type: 'number',
      description:
        'Explicit square size in CSS pixels. Overrides intrinsicSize.',
    },
    {
      name: 'intrinsicSize',
      type: '{width: number; height: number}',
      description:
        'Supplied vector dimensions when size is absent; otherwise uses --md-icon-size, then 24px.',
    },
    {
      name: 'label',
      type: 'string',
      description:
        'Accessible name for a meaningful standalone glyph. Omit beside named content.',
    },
  ],
  usage: {
    description:
      'Render a supplied SVG through the native Material 3 glyph channel. Import components.css and tokens.css. The interactive parent owns focus, state layers, target size and motion.',
    anatomy: [
      {
        name: 'Glyph',
        required: true,
        description: 'The supplied SVG inside the Material icon box.',
      },
    ],
    bestPractices: [
      {
        guidance: true,
        description:
          'Supply a viewBox-based SVG that follows currentColor for theme tint.',
      },
      {
        guidance: true,
        description:
          'Give a meaningful standalone icon a label; leave an icon beside named text decorative.',
      },
      {
        guidance: false,
        description: 'Use the standalone Icon as a button or focus target.',
      },
    ],
  },
};
