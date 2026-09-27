// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'MaterialSymbol',
  displayName: 'Material Symbol',
  category: 'Content',
  keywords: ['material', 'symbol', 'icon', 'ligature', 'font'],
  playground: {defaults: {name: 'settings'}},
  props: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Material Symbols ligature or Unicode codepoint.',
    },
    {
      name: 'variant',
      type: "'outlined' | 'rounded' | 'sharp'",
      default: "'outlined'",
      description: 'Font family; load the selected font in the app.',
    },
    {
      name: 'size',
      type: 'number',
      description:
        'Square size in CSS pixels. Defaults to --md-icon-size, then 24px.',
    },
    {name: 'fill', type: 'number', description: 'FILL font axis from 0 to 1.'},
    {
      name: 'weight',
      type: 'number',
      description: 'wght font axis from 100 to 700.',
    },
    {
      name: 'grade',
      type: 'number',
      description: 'GRAD font axis from -50 to 200.',
    },
    {
      name: 'opticalSize',
      type: 'number',
      description: 'opsz font axis from 20 to 48.',
    },
    {
      name: 'label',
      type: 'string',
      description:
        'Accessible name for a meaningful standalone glyph. Omit for decoration.',
    },
  ],
  usage: {
    description:
      'Render a Material Symbols ligature or codepoint in the native Material 3 package. Import components.css and tokens.css, and load the licensed font in the app.',
    anatomy: [
      {
        name: 'Glyph',
        required: true,
        description: 'The font glyph in the Material icon box.',
      },
    ],
    bestPractices: [
      {
        guidance: true,
        description:
          'Use Icon for supplied SVG artwork and MaterialSymbol for the opt-in font channel.',
      },
      {
        guidance: true,
        description:
          'Label meaningful standalone symbols; leave symbols beside named controls decorative.',
      },
      {
        guidance: false,
        description:
          'Assume the Material Symbols font is bundled with the package.',
      },
    ],
  },
};
