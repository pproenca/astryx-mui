// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file MaterialSymbol.stories.tsx
 * @input Material 3 MaterialSymbol, the app-loaded Material Symbols font, and Storybook controls
 * @output Interactive font-glyph review across families, axes, accessibility, and sizes
 * @position Material 3 component QA gallery for M3-CMP-027
 */

import type {Meta, StoryObj} from '@storybook/react';
import {MaterialSymbol} from '@astryxdesign/theme-material3/MaterialSymbol';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';

const fontStylesheet =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL,GRAD,opsz,wght@0..1,-50..200,20..48,100..700&family=Material+Symbols+Rounded:FILL,GRAD,opsz,wght@0..1,-50..200,20..48,100..700&family=Material+Symbols+Sharp:FILL,GRAD,opsz,wght@0..1,-50..200,20..48,100..700&display=block';

const meta: Meta<typeof MaterialSymbol> = {
  title: 'Material 3/MaterialSymbol',
  component: MaterialSymbol,
  tags: ['autodocs'],
  argTypes: {
    variant: {control: 'select', options: ['outlined', 'rounded', 'sharp']},
    fill: {control: {type: 'range', min: 0, max: 1, step: 0.1}},
    weight: {control: {type: 'range', min: 100, max: 700, step: 100}},
    grade: {control: {type: 'range', min: -50, max: 200, step: 25}},
    opticalSize: {control: {type: 'range', min: 20, max: 48, step: 4}},
  },
};

export default meta;
type Story = StoryObj<typeof MaterialSymbol>;

export const Material3Review: Story = {
  name: 'Material 3 Review',
  globals: {astryxTheme: 'material3'},
  args: {
    name: 'settings',
    variant: 'outlined',
    label: 'Settings',
    size: 24,
    fill: 0,
    weight: 400,
    grade: 0,
    opticalSize: 24,
  },
  render: args => (
    <VStack gap={6}>
      <link rel="stylesheet" href={fontStylesheet} />
      <VStack gap={2}>
        <h2>Interactive Material Symbol</h2>
        <MaterialSymbol {...args} />
        <Text type="supporting">
          Try a ligature, family, exact size, or any font axis in Controls. The
          app loads the font from Google Fonts for this preview.
        </Text>
      </VStack>
      <VStack gap={2}>
        <h2>Font families and codepoint</h2>
        <HStack gap={6} wrap="wrap" vAlign="center">
          {(['outlined', 'rounded', 'sharp'] as const).map(variant => (
            <VStack key={variant} gap={1} hAlign="center">
              <MaterialSymbol name="favorite" variant={variant} size={32} />
              <Text type="supporting">{variant}</Text>
            </VStack>
          ))}
          <VStack gap={1} hAlign="center">
            <MaterialSymbol name={'\ue87d'} label="Favorite" size={32} />
            <Text type="supporting">Codepoint</Text>
          </VStack>
        </HStack>
      </VStack>
      <VStack gap={2}>
        <h2>Size and variable axes</h2>
        <HStack gap={6} wrap="wrap" vAlign="center">
          <MaterialSymbol name="home" />
          <MaterialSymbol name="home" size={20} />
          <MaterialSymbol name="home" size={32} />
          <MaterialSymbol name="home" size={48} />
          <MaterialSymbol
            name="home"
            size={32}
            fill={1}
            weight={700}
            grade={200}
            opticalSize={48}
          />
        </HStack>
        <Text type="supporting">
          Default 24px, explicit 20/32/48px, then a filled heavy grade profile.
        </Text>
      </VStack>
    </VStack>
  ),
};
