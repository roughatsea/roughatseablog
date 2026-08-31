# The Wake data

The Wake is a longitudinal record of what happened after Rough at Sea first noticed a signal. It preserves two different kinds of history:

1. **Point-zero observations** created for every Morning Soundings section.
2. **Active records** selected from that intake and followed through dated, append-only observations.

The public `/wake/` interface, detail pages, methodology page, and downloadable exports are generated from these files. The structured record is the source of truth; the site is not maintained as a second editorial copy.

## Directory layout

```text
src/data/wake/
├── README.md
├── wake-observation.schema.json
├── wake-record.schema.json
├── wake-run.schema.json
├── inbox/
│   └── YYYY-MM-DD.json
├── records/
│   └── <wake-id>.json
└── runs/
    └── YYYY-MM-DD-<mode>.json
```

Generated public exports are written during the build to:

```text
public/wake/data.json
public/wake/data.csv
```

## Daily intake

`inbox/` contains one immutable point-zero packet per Morning Soundings edition. Each packet contains every signal and deep sounding from that edition, not merely the subjects likely to receive follow-up.

The Daily Soundings task follows `automation/daily-soundings-wake-addendum.md`. It records:

- a narrow canonical claim;
- facts supported at publication time;
- uncertainties and open questions;
- source roles and evidentiary lineages;
- future evidence that would materially move the record;
- stable tracking terms;
- a recommended disposition.

A disposition is a recommendation, not admission to active monitoring:

- `active-candidate`: suitable for weekly consideration;
- `passive`: worth retaining but not presently worth active monitoring;
- `unsuitable`: editorially valuable but lacking a coherent longitudinal subject or observable future evidence.

## Capture modes

- `contemporaneous`: generated during the same run that publishes the article.
- `reconstructed`: backfilled from an already-published article and its cited sources.

The first six packets, covering August 25–30, 2026, are reconstructed. They are close in time to publication but must not be mistaken for data captured by the original daily runs.

## Active records

`records/` contains the deliberately small set of subjects being followed. Each record has:

- a stable `wakeId` and canonical subject;
- links to one or more immutable origin signals;
- an independently stated lifecycle, evidence state, and attention state;
- a current assessment and review cadence;
- unresolved questions and event triggers;
- an append-only observation timeline;
- explicit corrections.

The first observation is always `point-zero`. The second records admission to The Wake. Later observations may be reviews, developments, corrections, or resolutions.

Earlier observations are never silently rewritten to agree with hindsight. The `current` object mirrors the most recent observation while the timeline preserves every prior state.

## Weekly runs

`runs/` is the audit trail for the weekly process. Each run records:

- its exact intake window and packet filenames;
- admissions and their reasons;
- continuing-record updates;
- completed reviews and whether they found a material change;
- deferred candidates and reasons;
- failures and unavailable evidence;
- the active-record count after the run;
- the attention methodology in force;
- a concise public summary.

The weekly task follows `automation/weekly-wake.md`. It ordinarily admits no more than one to three new records and may admit none. Not every active record is researched every week; cadence and event triggers keep the collection sustainable.

A performed review with no material change is valid data. The task must not manufacture drama merely because the schedule fired.

## Lifecycle states

Lifecycle describes what is happening to the subject or claim. It is not a quality score.

- `emerging`: meaningful future evidence is expected;
- `corroborated`: important parts gained independent support;
- `disputed`: material evidence or interpretation remains contested;
- `implemented`: a promised program, product, policy, or design was deployed;
- `stalled`: expected progress stopped without clear resolution;
- `contradicted`: later evidence substantially weakened the original claim;
- `resolved`: the central open question has a defensible answer;
- `dormant`: no useful update is expected soon;
- `retracted`: the source or claim was formally withdrawn.

## Evidence and lineage

Evidence strength and public attention are separate dimensions. Multiple publications that ultimately derive from the same paper, press release, wire report, interview, or announcement share one `lineage`. Repetition within a lineage may demonstrate attention; it is not independent corroboration.

First-party, promotional, and institutional claims remain labeled as such until independent evidence exists. Allegations remain allegations. Sparse coverage does not establish censorship, suppression, conspiracy, or deliberate neglect.

## Attention measurements

The pilot uses `unmeasured` for attention. Ordinary search-engine result estimates are unstable, personalized, poorly deduplicated, and unsuitable for longitudinal measurement.

A future attention system must preserve:

- the provider or corpus;
- the exact query;
- the date window;
- the capture timestamp;
- the complete matching result set;
- source-lineage deduplication rules.

Until such a method is formally adopted, the weekly task must not invent coverage counts or attention states.

## Methodological rules

1. Editorial importance comes before ease of measurement.
2. Evidence strength and attention remain separate.
3. Repetition from one evidentiary lineage is not corroboration.
4. First-party and promotional claims remain labeled.
5. Sparse coverage does not establish suppression.
6. Missing values remain `null` or `unmeasured`; they are never replaced with invented precision.
7. Point-zero packets are not silently updated to agree with hindsight.
8. Corrections and later interpretations are appended explicitly.
9. The collection is curated, not exhaustive.
10. Admission is not endorsement; uncertainty can be the reason a record deserves to be followed.

## Validation

Run:

```bash
npm run validate:wake
```

This runs both validators:

- `scripts/validate-wake-data.mjs` checks daily observation packets;
- `scripts/validate-wake-records.mjs` checks active records and weekly run logs.

Among other invariants, validation checks dates, source URLs, enumerated values, ordering, globally unique signal and observation IDs, origin references, record admissions, chronology, and agreement between each record's `current` state and its latest observation.

Build the public downloads with:

```bash
npm run build:wake-exports
```

The normal production build runs validation and export generation before Astro checks and rendering.

## Schema changes

All three schemas use integer `schemaVersion` values. Additive changes should preserve old data when practical. Breaking changes require a new version and an explicit migration. No migration may erase the historical distinction between contemporaneous and reconstructed observations or collapse the append-only timeline into a rewritten present.
