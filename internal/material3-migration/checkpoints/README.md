# Migration workbook handoff checkpoint

`astryx-material3-migration-inventory.xlsx` is a byte-for-byte checkpoint of the
sole active migration workbook, captured on 28 September 2026 for agent handoff.
The adjacent SHA-256 file identifies the exact workbook bytes. All worksheets,
formulas, task states, approvals and historical evidence are preserved.

This is a frozen recovery artifact, not a second editable task database. Continue
using the active workbook selected by `M3_WORKBOOK`; do not point migration
commands at this checkpoint while that active workbook exists. Refresh the
checkpoint from the active workbook at a handoff with no workbook transaction
running, and commit the workbook and checksum together.

If the active workbook is unavailable on a new machine, restore this checkpoint
to one designated writable location and set `M3_WORKBOOK` to that restored file.
Historical worktree paths and local preview URLs are provenance, not portable
checkout instructions. Recheck Git, task preparation and source evidence before
resuming. The adjacent receipt archive is separate and is not included here.

This checkpoint records work in progress. A committed task row does not establish
native acceptance; the workbook's verification, human QA and merge gates apply.
