// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'HorizontalDivider',
  displayName: 'Material 3 Horizontal Divider',
  category: 'Layout',
  keywords: ['material', 'divider', 'horizontal', 'separator'],
  props: [
    {
      name: 'thickness',
      type: "number | 'hairline'",
      description:
        'Positive CSS-pixel thickness. Hairline paints one device pixel without taking layout height. Defaults to the Material divider thickness token, then 1px.',
    },
    {
      name: 'color',
      type: 'string',
      description:
        'CSS color overriding the Material divider color token, which defaults to OutlineVariant.',
    },
    {
      name: 'inset',
      type: "'both' | 'start' | 'end'",
      description:
        'Optional 16px logical gap on both sides or one side. Start and end follow text direction.',
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
      'Render a native Material 3 horizontal rule and import components.css and tokens.css. It is decorative by default. Add role="separator" only when the boundary conveys structure.',
    anatomy: [{name: 'Rule', required: true, description: 'One visual line.'}],
    bestPractices: [
      {
        guidance: true,
        description: 'Use inset for a list gap that follows writing direction.',
      },
      {
        guidance: true,
        description: 'Use hairline when a physical one-pixel rule is required.',
      },
      {
        guidance: false,
        description: 'Use a decorative rule as a focus or action target.',
      },
    ],
  },
};
