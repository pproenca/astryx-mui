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

Performance budgets and numeric browser trajectory tolerances require native
measurements and a human approval reference before implementation verification.
The baseline marks its initial browser profile as proposed and leaves the
trajectory tolerances unapproved. Source-task review can decide this proposed
profile; it cannot stand in for later native input and frame measurements.
