// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file Material3Divider.stories.tsx
 * @input Core Divider, maintained Material 3 theme, and pinned md-divider geometry
 * @output Interactive review of full-width, inset, semantic, and Astryx extension states
 * @position Material 3 component QA gallery for M3-CMP-003
 */

import type {Meta, StoryObj} from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import {Divider} from '@astryxdesign/core/Divider';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';

const styles = stylex.create({
  gallery: {
    maxWidth: '680px',
    padding: '24px',
  },
  specimen: {
    paddingBlock: '12px',
    backgroundColor: 'var(--md-sys-color-surface-container-low)',
  },
  vertical: {
    height: '96px',
  },
});

const meta: Meta<typeof Divider> = {
  title: 'Material 3/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    inset: {control: 'select', options: [undefined, 'both', 'start', 'end']},
    isDecorative: {control: 'boolean'},
    variant: {control: 'select', options: ['subtle', 'strong']},
    label: {control: 'text'},
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Material3Review: Story = {
  name: 'Material 3 Review',
  globals: {astryxTheme: 'material3'},
  args: {
    isDecorative: true,
    variant: 'subtle',
  },
  render: args => (
    <VStack gap={6} xstyle={styles.gallery}>
      <VStack gap={2}>
        <h2>Interactive divider</h2>
        <Text type="supporting">
          Try insets, a meaningful separator, the strong Astryx extension, or a
          label in Controls. Light, dark, and RTL are in the toolbar.
        </Text>
        <div {...stylex.props(styles.specimen)}>
          <Divider {...args} />
        </div>
      </VStack>
      <VStack gap={3}>
        <h2>Material Web variants</h2>
        {(
          [
            ['Full width', undefined],
            ['Inset both', 'both'],
            ['Inset start', 'start'],
            ['Inset end', 'end'],
          ] as const
        ).map(([name, inset]) => (
          <VStack key={name} gap={1}>
            <Text type="supporting">{name}</Text>
            <div {...stylex.props(styles.specimen)}>
              <Divider inset={inset} isDecorative />
            </div>
          </VStack>
        ))}
      </VStack>
      <VStack gap={2}>
        <h2>Astryx extensions</h2>
        <Text type="supporting">
          Strong weight, visible labels, and vertical rules keep their Core
          behavior under this theme.
        </Text>
        <Divider variant="strong" />
        <Divider label="Section" />
        <HStack gap={3} vAlign="center" xstyle={styles.vertical}>
          <Text type="body">Start</Text>
          <Divider orientation="vertical" />
          <Text type="body">End</Text>
        </HStack>
      </VStack>
    </VStack>
  ),
};
