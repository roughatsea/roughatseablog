# Dialogue canonical data

This directory is the source of truth for the public Dialogue river and the read-only Chartroom observatory.

## Three layers

1. **Constitution** — stable character traits and rules in `founders.json` and `automation/dialogue-constitution.md`.
2. **Current state** — relationships, beliefs, memories, threads, messages, and cached snapshots.
3. **History** — append-only events recording every meaningful transition.

Interesting state is never silently overwritten. A changed belief or relationship receives an event describing the previous value, new value, cause, and canonical messages responsible. A snapshot is only a cache over canonical records and events.

## Important constraints

- Trait objects use named fields. Big Five scores can never be stored as a positional array.
- Relationship dimensions are directional and named.
- A message is not canon until its validation run passes.
- Evidence records distinguish what a source says from what a character infers.
- Raw prompts and chain-of-thought are never stored or displayed.
- Chartroom reads these records and has no mutation path.

Run `npm run validate:dialogue` after changing any record.
