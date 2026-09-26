// Copyright (c) Meta Platforms, Inc. and affiliates.

/** @input Migration source and harness tests. @output Focused source-task regression selection. @position Disposable M3-SRC-001 verification configuration. */
export default {
  test: {
    include: [
      'internal/material3-migration/tests/source-*.test.mjs',
      'internal/material3-migration/tests/harness.test.mjs',
    ],
  },
};
