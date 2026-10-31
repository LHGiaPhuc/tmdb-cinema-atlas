# Validation record

Validated on 2026-10-31.

- `npm test`: six tests pass, covering missing values, financial population alignment, inclusive combined filters, unknown years, empty selections, overlapping genres, sorting, safe CSV export and the real dataset's invariants.
- `node --check docs/assets/app.js`: syntax passes.
- Snapshot: 4,803 distinct movie IDs, one unknown release year, 1,037 missing budgets, 1,427 missing revenues, and 3,229 complete financial pairs.
- Spot check: Avatar, TMDB ID 19995, budget 237,000,000 and revenue 2,787,965,087, matches the original CSV.
- The local HTTP server starts successfully.

Browser preview permission was declined. No rendered desktop/mobile inspection, click-through verification, download interaction test or screenshot is claimed. The CSS includes responsive layouts and keyboard-focus styles, but these still need a manual browser review. Unit tests do not establish visual correctness.
