// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ReferenceDoc} */
export default {
  type: 'generic',
  name: 'material3-native',
  title: 'Native Material 3',
  description:
    'Material 3 CSS role names and native component imports in the Astryx Material 3 package.',
  category: 'guide',
  sections: [
    {
      title: 'Token references',
      content: [
        {
          type: 'prose',
          text: 'The package exports material3Var for supported Material CSS custom properties. It returns a var() reference and leaves value resolution to the nearest Material token provider. The package does not require the Astryx Core theme or portable Core token names.',
        },
        {
          type: 'code',
          lang: 'tsx',
          code: "import {material3Var} from '@astryxdesign/material3';\n\nconst foreground = material3Var('--md-sys-color-on-surface');",
        },
      ],
    },
    {
      title: 'Component imports',
      content: [
        {
          type: 'prose',
          text: 'Native components will use @astryxdesign/material3/{Component} imports as each component is released. The existing @astryxdesign/theme-material3 package remains the compatibility theme for Core components during the migration.',
        },
      ],
    },
  ],
};
