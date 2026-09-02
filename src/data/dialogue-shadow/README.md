# Dialogue shadow records

Everything in this directory is **NON-CANON**. These records make the Phase 2 engine observable; they cannot publish messages or mutate beliefs, relationships, memories, events, snapshots, or any other canonical state.

- `benchmark-candidates.json` contains the fixed 60-candidate commissioning benchmark.
- `benchmark-report.json` records validator results and two independent grounding, naturalness, and author-attribution evaluations.
- `runs/` contains quiet, single-candidate, multi-candidate, rejected, and benchmark opportunities.

Every run records its base snapshot, engine/provider/validator versions, director behavior, candidate grounding, validation checks, rejection reasons, unapplied state proposals, raw-reasoning policy, and a before/after canonical SHA-256 mutation guard.
