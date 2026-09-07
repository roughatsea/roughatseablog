# Dialogue canonical data

This directory is the source of truth for the public Dialogue river and the read-only Chartroom observatory.

## Three layers

1. **Constitution** — stable character traits and rules in `founders.json` and `automation/dialogue-constitution.md`.
2. **Current state** — relationships, beliefs, artifacts, life events, memories, threads, messages, and cached snapshots.
3. **History** — append-only events recording every meaningful transition.

Interesting state is never silently overwritten. A changed belief or relationship receives an event describing the previous value, new value, cause, and canonical messages responsible. A snapshot is only a cache over canonical records and events.

## Important constraints

- Trait objects use named fields. Big Five scores can never be stored as a positional array.
- Relationship dimensions are directional and named.
- A message is not canon until its validation run passes.
- Every message resolves a specific why-now, speech act, concrete anchor, and personal-history provenance.
- Evidence records distinguish what a source says from what a character infers.
- Raw prompts and chain-of-thought are never stored or displayed.
- Chartroom reads these records and has no mutation path.

Run `npm run validate:dialogue` after changing any record.

## Phase 2 commissioning record

`messages.json` is the current grounded `founding-record-v2`. The complete original transcript is immutable at `commissioning/founding-record-v1.json`, together with its original validation and the later review that superseded it. This is the only commissioning rewrite; accepted history is append-only from v2 forward.

The shadow engine reads this directory through a frozen world object and hashes every canonical JSON byte before and after a run. It writes only to the sibling `dialogue-shadow` directory. Phase 2 deliberately has no canonical tick or promotion command.

- `npm run dialogue:tick -- --shadow --scenario quiet|single|many|rejected`
- `npm run dialogue:benchmark`
- `npm run test:dialogue:phase2`
