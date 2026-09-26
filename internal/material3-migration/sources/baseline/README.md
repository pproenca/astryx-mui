# Compose-first foundation source baseline

[`compose-first.json`](compose-first.json) is the versioned source decision for
the native Material 3 foundation. It routes the eight foundation dimensions to
their pinned decisions and enumerates light/dark, narrow and RTL source scenarios
from the reproducible captures. The source captures remain evidence; they are not
screenshots of a native Astryx implementation. The workbook remains the only
task database.

Run `node internal/material3-migration/sources/baseline/generate-source-decision.mjs --check`
to validate every referenced source image hash and regenerate the decision.
The selected motion reference is a clip derived from the pinned Kotlin trace;
the official guidance clips were separately watched and are retained by hash
in [motion observations](../motion/README.md) rather than redistributed.

The foundation baseline includes owner-approved motion tolerances and a
Chrome/macOS performance profile from native browser measurements on 2026-09-26.
It includes separate start, intermediate and settled light/dark motion panels,
cropped from the pinned source contact sheets. The native browser captures and
their exact RGBA diffs are under `internal/material3-migration/actual/M3-NAT-002`.
This approval is for the foundation measurement profile; component-specific
motion and browser behavior still need their own acceptance.
