// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file astryx.integration.mjs
 * @input Same-stem Material 3 reference and component documents
 * @output Astryx discovery roots for the native package
 * @position Integration manifest; item metadata remains beside each source
 */

/** @type {import('@astryxdesign/cli/authoring').AstryxIntegration} */
export default {
  components: './src',
  docs: './docs',
  issuesUrl: 'https://github.com/facebook/astryx/issues',
};
