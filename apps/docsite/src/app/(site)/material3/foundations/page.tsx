// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Product-owned native gallery build and the docsite theme shell. @output Native Material 3 foundation review route. @position Docsite catalog; component previews remain separately gated. */
import type {Metadata} from 'next';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Section} from '@astryxdesign/core/Section';
import {pageMetadata} from '../../../../lib/pageMetadata';
import styles from './page.module.css';

export const metadata: Metadata = pageMetadata({
  title: 'Native Material 3 foundations',
  description:
    'Inspect the native Material 3 foundation graph beside pinned source captures, with light and dark modes and motion playback.',
  path: '/material3/foundations',
});

export default function Material3FoundationsPage() {
  return (
    <Section maxWidth="lg" padding={6}>
      <div className={styles.intro}>
        <Heading level={1}>Native Material 3 foundations</Heading>
        <Text type="body">
          The gallery below runs the native Material 3 package. Component
          previews will appear as their native implementations pass review.
        </Text>
        <Button
          variant="secondary"
          label="View Core compatibility theme"
          href="/themes?theme=material3"
        />
      </div>
      <iframe
        className={styles.gallery}
        title="Interactive native Material 3 foundation gallery"
        src="/material3-gallery/index.html"
        sandbox="allow-scripts allow-same-origin"
      />
    </Section>
  );
}
