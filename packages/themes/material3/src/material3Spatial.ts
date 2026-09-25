// Copyright (c) Meta Platforms, Inc. and affiliates.
// Source component geometry: Copyright 2023 Google LLC, Apache-2.0.

/**
 * @file material3Spatial.ts
 * @input Pinned Material Web v0.192 component geometry values
 * @output Theme-owned component geometry lookup
 * @position Material 3 theme foundation; no system spacing or density tokens
 *
 * Material Web exposes these through component wrappers. Astryx's portable
 * spacing, size, and density contracts remain unchanged until each component
 * maps its own geometry and interaction target.
 */

import source from './material3SpatialSource.json';

export const material3ComponentGeometry = source.components;
