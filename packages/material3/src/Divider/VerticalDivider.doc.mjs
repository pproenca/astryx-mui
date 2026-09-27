// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'VerticalDivider',
  displayName: 'Material 3 Vertical Divider',
  category: 'Layout',
  keywords: ['material', 'divider', 'vertical', 'separator'],
  props: [
    {
      name: 'thickness',
      type: "number | 'hairline'",
      description:
        'Positive CSS-pixel thickness. Hairline paints one device pixel without taking layout width. Defaults to the Material divider thickness token, then 1px.',
    },
    {
      name: 'color',
      type: 'string',
      description:
        'CSS color overriding the Material divider color token, which defaults to OutlineVariant.',
    },
    {
      name: 'role',
      type: "'separator'",
      description:
        'Opt into a semantic separator when the boundary carries meaning. Otherwise the rule is decorative.',
    },
  ],
  usage: {
    description:
      'Render a native Material 3 vertical rule inside a container with a definite height and import components.css and tokens.css. It is decorative by default.',
    anatomy: [{name: 'Rule', required: true, description: 'One visual line.'}],
    bestPractices: [
      {
        guidance: true,
        description: 'Give the containing row a definite height.',
      },
      {
        guidance: true,
        description: 'Use role="separator" for a meaningful boundary.',
      },
      {
        guidance: false,
        description: 'Use a decorative rule as a focus or action target.',
      },
    ],
  },
};
