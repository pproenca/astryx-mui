// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */
export const docs = {
  name: 'FilledField',
  displayName: 'Material 3 Filled Field',
  category: 'Inputs',
  keywords: ['material', 'field', 'filled', 'custom input'],
  props: [
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description:
        'One control that owns its input value, keyboard behavior, and form semantics.',
    },
    {
      name: 'label',
      type: 'ReactNode',
      description:
        'Visual floating label. Supply an associated native label when the child is an input.',
    },
    {
      name: 'supportingText',
      type: 'ReactNode',
      description: 'Text below the filled container.',
    },
    {
      name: 'leadingIcon',
      type: 'ReactNode',
      description: 'Visual leading icon.',
    },
    {
      name: 'trailingIcon',
      type: 'ReactNode',
      description: 'Visual trailing icon.',
    },
    {
      name: 'prefix',
      type: 'ReactNode',
      description: 'Content before the control.',
    },
    {
      name: 'suffix',
      type: 'ReactNode',
      description: 'Content after the control.',
    },
    {
      name: 'focused',
      type: 'boolean',
      description:
        'Optional visual focus override. Focus inside is observed otherwise.',
    },
    {
      name: 'populated',
      type: 'boolean',
      description:
        'True when the child has a value; keeps the label floating after blur.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      description:
        'Selects disabled paint. Disable the semantic child separately.',
    },
    {
      name: 'error',
      type: 'boolean',
      description:
        'Selects error paint. Set validity and error association on the child separately.',
    },
  ],
  usage: {
    description:
      'Use FilledField for a custom control that needs Material 3 filled decoration. Import components.css and tokens.css. Ordinary Material text input usage will use a complete native text field.',
    anatomy: [
      {
        name: 'Filled container',
        required: true,
        description:
          '56px minimum height with Compose container and indicator roles.',
      },
      {
        name: 'Control',
        required: true,
        description: 'Caller-owned semantic input or custom control.',
      },
      {name: 'Label', required: false, description: 'Optional floating label.'},
      {
        name: 'Supporting text',
        required: false,
        description: 'Optional text below the container.',
      },
    ],
    bestPractices: [
      {
        guidance: true,
        description:
          'Associate a native label and supporting text with the child input.',
      },
      {
        guidance: true,
        description:
          'Pass populated when the input has a value, and mirror disabled and error state on the child.',
      },
      {
        guidance: false,
        description:
          'Use the visual shell as a replacement for an input or its form semantics.',
      },
    ],
  },
};
