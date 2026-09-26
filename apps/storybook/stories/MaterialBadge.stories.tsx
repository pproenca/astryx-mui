// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file MaterialBadge.stories.tsx
 * @input Material 3 badge surface, Core IconButton, and pinned Labs badge roles
 * @output Interactive review of dot, count, anchor, RTL, and narrow layouts
 * @position Material 3 component QA gallery for M3-CMP-004
 */

import type {Meta, StoryObj} from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {MaterialBadge} from '@astryxdesign/theme-material3/MaterialBadge';

const styles = stylex.create({
  gallery: {
    maxWidth: '680px',
    padding: '24px',
  },
  anchor: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    margin: '8px',
  },
  dotOverlay: {
    position: 'absolute',
    insetBlockStart: '0px',
    insetInlineEnd: '0px',
  },
  countOverlay: {
    position: 'absolute',
    insetBlockStart: '-4px',
    insetInlineEnd: '-4px',
  },
  narrow: {
    width: '220px',
    maxWidth: '100%',
  },
});

const meta: Meta<typeof MaterialBadge> = {
  title: 'Material 3/MaterialBadge',
  component: MaterialBadge,
  tags: ['autodocs'],
  argTypes: {
    value: {control: 'text'},
    label: {control: 'text'},
  },
};

export default meta;
type Story = StoryObj<typeof MaterialBadge>;

export const Material3Review: Story = {
  name: 'Material 3 Review',
  globals: {astryxTheme: 'material3'},
  args: {value: 3, label: '3 notifications'},
  render: args => (
    <VStack gap={6} xstyle={styles.gallery}>
      <VStack gap={2}>
        <h2>Interactive badge</h2>
        <Text type="supporting">
          Edit the value or accessible label in Controls. Clear the value for
          the 6px dot. Light, dark, and RTL are in the toolbar.
        </Text>
        <HStack>
          <MaterialBadge {...args} />
        </HStack>
      </VStack>
      <VStack gap={2}>
        <h2>Material Web Labs surfaces</h2>
        <HStack gap={6} wrap="wrap" vAlign="center">
          <MaterialBadge label="New activity" />
          <MaterialBadge value={0} label="No unread items" />
          <MaterialBadge value={3} label="3 unread items" />
          <MaterialBadge value="99+" label="More than 99 unread items" />
        </HStack>
      </VStack>
      <VStack gap={2}>
        <h2>Anchored notification states</h2>
        <Text type="supporting">
          The caller owns badge placement and includes the notification state in
          the button name. The badge cannot intercept pointer input.
        </Text>
        <HStack gap={6} wrap="wrap" vAlign="center">
          <span {...stylex.props(styles.anchor)}>
            <IconButton
              icon={<Icon icon="menu" />}
              label="Menu, new activity"
              tooltip="Menu"
              variant="ghost"
            />
            <MaterialBadge
              className={stylex.props(styles.dotOverlay).className}
            />
          </span>
          <span {...stylex.props(styles.anchor)}>
            <IconButton
              icon={<Icon icon="menu" />}
              label="Menu, 3 new items"
              tooltip="Menu"
              variant="ghost"
            />
            <MaterialBadge
              value={3}
              className={stylex.props(styles.countOverlay).className}
            />
          </span>
        </HStack>
      </VStack>
      <VStack gap={2} xstyle={styles.narrow}>
        <h2>Narrow layout</h2>
        <HStack gap={4} wrap="wrap" vAlign="center">
          <MaterialBadge />
          <MaterialBadge value="99+" />
          <Text type="supporting">Notification count</Text>
        </HStack>
      </VStack>
    </VStack>
  ),
};
