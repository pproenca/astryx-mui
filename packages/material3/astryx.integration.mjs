// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file astryx.integration.mjs
 * @input Same-stem Material 3 reference documents
 * @output Astryx discovery root for the native package
 * @position Integration manifest; component discovery is added with the first native component
 */

/** @type {import('@astryxdesign/cli/authoring').AstryxIntegration} */
export default {
  docs: './docs',
  issuesUrl: 'https://github.com/facebook/astryx/issues',
};
