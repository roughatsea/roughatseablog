# The Wake data

The Wake is a longitudinal record of what happened after Rough at Sea first
noticed a signal. This directory currently implements only **phase one**:
preserving the state of each Morning Soundings subject at the moment it entered
the publication.

No public `/wake/` experience or weekly promotion workflow is implied by the
presence of these files. Those layers can be built on top of this evidence
without rewriting it.

## Directory layout

```text
src/data/wake/
├── README.md
├── wake-observation.schema.json
├── inbox/
│   └── YYYY-MM-DD.json
└── records/                 # added when weekly monitoring begins
```

`inbox/` contains one immutable point-zero packet per Morning Soundings
edition. Each packet contains every signal and deep sounding from that edition,
not merely the subjects likely to receive follow-up.

A future weekly task will inspect the inbox, connect continuing subjects,
promote only the strongest candidates into `records/`, and append dated
observations to those records.

## Capture modes

- `contemporaneous`: generated during the same run that publishes the article.
- `reconstructed`: backfilled from an already-published article and its cited
  sources. Reconstructed packets must say when and from what they were rebuilt.

The first six packets, covering August 25–30, 2026, are reconstructed. They are
close in time to publication but must not be mistaken for data captured by the
original daily runs.

## Dispositions

A disposition is a recommendation, not an admission decision.

- `active-candidate`: suitable for consideration by the weekly task.
- `passive`: worth retaining but not presently worth active monitoring.
- `unsuitable`: valuable editorially but not coherent or observable enough for
  longitudinal tracking.

The daily process may produce many active candidates. The weekly process should
promote only a small number.

## Methodological rules

1. Editorial importance comes before ease of measurement.
2. Evidence strength and attention are separate dimensions.
3. Repetition from one evidentiary lineage is not corroboration.
4. First-party and promotional claims remain labeled.
5. Sparse coverage does not establish suppression.
6. Missing values remain `null`; they are never replaced with invented
   precision.
7. Point-zero packets are not silently updated to agree with hindsight.
8. Corrections and later interpretations belong in appended weekly
   observations.
9. Attention measurements require a reproducible provider, exact query, date
   window, capture time, and result set.
10. The collection is curated, not exhaustive.

## Validation

Run:

```bash
npm run validate:wake
```

The validator checks packet structure, dates, source URLs, article references,
enumerated values, ordering, and globally unique signal IDs. The formal schema
is in `wake-observation.schema.json`; both the scheduled task and future code
should read it rather than re-inventing the format.

## Schema changes

`schemaVersion` is an integer. Additive changes should preserve old packets
when practical. Breaking changes require a new version and an explicit
migration; they must never erase the historical distinction between
contemporaneous and reconstructed observations.
