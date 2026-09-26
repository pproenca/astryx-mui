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
      description:
        'A Material Symbols ligature such as settings, or one Unicode codepoint.',
    },
    {
      name: 'variant',
      type: "'outlined' | 'rounded' | 'sharp'",
      default: "'outlined'",
      description:
        'Material Symbols font family. Load the selected family in the app.',
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
        'Accessible name for a meaningful standalone symbol. Omit for decoration.',
    },
  ],
  usage: {
    description:
      'Render an opt-in, font-backed Material Symbols glyph when a Material 3 interface needs a ligature or codepoint outside the semantic SVG Icon registry. Import material-symbol.css and load the chosen Material Symbols font in the app.',
    anatomy: [
      {
        name: 'Glyph',
        required: true,
        description: 'The ligature or codepoint rendered by the loaded font.',
      },
    ],
    bestPractices: [
      {
        guidance: true,
        description:
          'Use the semantic Core Icon for shared action meanings that should adapt across themes.',
      },
      {
        guidance: true,
        description:
          'Give a standalone meaningful symbol a label; leave symbols beside named controls decorative.',
      },
      {
        guidance: false,
        description: 'Assume the Material Symbols font is bundled with Astryx.',
      },
    ],
  },
};
