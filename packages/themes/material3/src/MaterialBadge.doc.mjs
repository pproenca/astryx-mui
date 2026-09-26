// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'MaterialBadge',
  displayName: 'Material Badge',
  category: 'Feedback & Status',
  keywords: ['material', 'badge', 'notification', 'count', 'dot'],
  playground: {defaults: {value: 3}},
  props: [
    {
      name: 'value',
      type: 'string | number',
      description:
        'Short notification value. Omit it or pass an empty string for the 6px dot; any value, including zero, uses the 16px large badge.',
    },
    {
      name: 'label',
      type: 'string',
      description:
        'Accessible name for a meaningful standalone badge. Omit when the owner already announces the same information.',
    },
  ],
  usage: {
    description:
      'Render a Material 3 notification dot or short count. Import material-badge.css and place the badge beside or over its owner with CSS. Core Badge remains the Astryx status and category label.',
    anatomy: [
      {
        name: 'Surface',
        required: true,
        description: 'The 6px dot or 16px minimum pill.',
      },
      {
        name: 'Value',
        required: false,
        description: 'Short text in the large badge.',
      },
    ],
    bestPractices: [
      {
        guidance: true,
        description:
          'When a badge overlays an icon button, include the notification state in the button accessible name; the badge can stay decorative.',
      },
      {
        guidance: true,
        description:
          'Use a short count such as 3 or 99+. Let the owner control placement and reserve room so the badge is not clipped.',
      },
      {
        guidance: false,
        description:
          'Use MaterialBadge for standalone status words or category tags; use Core Badge for those meanings.',
      },
    ],
  },
};
