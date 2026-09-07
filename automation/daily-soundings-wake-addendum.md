# Daily Soundings addendum: point-zero observations for The Wake

This file is a standing addendum to the scheduled **Daily Soundings** task. It
supplements the task's existing editorial, research, artwork, publication, and
scheduling instructions. When the two conflict, preserve the existing identity
and quality of Morning Soundings unless this file is specifically concerned
with factual provenance, longitudinal capture, or Wake data integrity.

## Purpose

Morning Soundings notices signals while their meaning is still unsettled. The
Wake will later follow a small number of those signals to learn what was
confirmed, contradicted, implemented, abandoned, forgotten, or transformed.

The daily task is responsible only for preserving a trustworthy **point-zero
observation**. It must not attempt the weekly Wake investigation.

## Editorial selection remains primary

Select the three signals and the deep sounding because they are important,
surprising, revealing, beautiful, under-covered, or unusually useful to the
reader today. Do not choose a weaker subject merely because it is easier to
track.

Use longitudinal value only as a tiebreaker between otherwise comparable
candidates. A candidate has longitudinal value when it has one or more of the
following:

- a consequential unresolved question;
- a named and persistent subject that can be identified later;
- observable future evidence or a concrete milestone;
- a claim that might later be confirmed, contradicted, revised, replicated,
  released, implemented, abandoned, restored, reattributed, or forgotten;
- durable primary sources;
- a plausible trajectory over weeks, months, or years.

Do not force a Wake candidate into an edition. Do not narrow Soundings to
conventional news, corporate announcements, legal processes, or events with
release dates. Art, games, science, preservation, intellectual history,
non-Western traditions, and unconventional forms of creativity remain fully in
scope.

When it fits the prose naturally, state what remains unknown and what future
evidence would materially change the interpretation. Do not add a repetitive
"What to watch" box or other formula to every article section.

## Required repository reading

Before researching the day's edition:

1. Read `src/data/wake/README.md`.
2. Read `src/data/wake/wake-observation.schema.json`.
3. Inspect existing files in `src/data/wake/inbox/`.
4. When `src/data/wake/records/` exists, inspect it for a continuing subject
   before assigning a new longitudinal identity.

## Coordination with Save Point

Save Point normally publishes at 2:00 AM in `America/Phoenix`, before Morning
Soundings begins. Before researching the day's Soundings edition, check for the
same-day article under `src/content/save-point/` and inspect the Save Point
coverage ledger.

Treat a source, claim, video, or near-identical angle already used by Save Point
as unavailable for routine Soundings selection. A consequential JRPG subject
may still appear in Soundings only when the Soundings section asks a genuinely
broader cultural, artistic, scientific, or technological question. Link to the
Save Point edition and do not reproduce its summary.

If the day's Save Point is absent because its run failed or was intentionally
paused, continue Morning Soundings normally. Do not allow one daily series to
block the other.

## Required point-zero packet

After writing the article, create exactly one sidecar file:

`src/data/wake/inbox/YYYY-MM-DD.json`

The date must match the Morning Soundings publication date. The packet must
conform to `wake-observation.schema.json` and contain one record for **every
editorial section** in the edition: each of the three signals and the deep
sounding. A signal may be marked `passive` or `unsuitable`; inclusion in the
packet does not admit it to active Wake monitoring.

For a normal daily run, set:

- `capture.mode` to `contemporaneous`;
- `capture.capturedAt` to the actual capture timestamp in America/Phoenix;
- `capture.sourceStateAsOf` to the publication date.

Do not rewrite an older packet merely because later evidence changed the
story. Point-zero packets are historical observations. Corrections must be
added explicitly by the future weekly workflow rather than silently changing
what was recorded.

## Evidence discipline

For each signal:

- State one narrow, neutral `canonicalClaim`.
- Separate supported `knownFacts` from `uncertainties` and `openQuestions`.
- Identify the evidentiary role of every source.
- Use the same `lineage` value for articles that ultimately derive from the
  same paper, press release, wire report, interview, or announcement.
- Do not treat repeated publication of one lineage as independent
  corroboration.
- Keep promotional or institutional claims labeled as such until independent
  evidence exists.
- Keep allegations labeled as allegations.
- Do not infer censorship, suppression, conspiracy, or deliberate neglect
  from sparse coverage.
- Keep evidence strength and public attention as separate dimensions.
- Never invent a publication date, access date, metric, quotation, milestone,
  or coverage count. Use `null` when the fact cannot be established.

`attentionSnapshot` must remain `null` unless the measurement is reproducible
and records the provider, exact query, date window, capture time, and matching
source set. Ordinary search-engine result estimates are not reproducible and
must not be used.

## Disposition is only a recommendation

Assign one of these values:

- `active-candidate`: a strong candidate for weekly admission review;
- `passive`: worth preserving but not presently worth active monitoring;
- `unsuitable`: valuable editorially but lacking a coherent longitudinal
  subject or observable future evidence.

The weekly Wake task—not Daily Soundings—will decide which records become
active. Do not perform that admission process during the morning run.

## Review timing

Set `reviewAfter` only when there is a defensible earliest date for a useful
follow-up. Use `null` when the next review should be triggered by an event
rather than a guessed date. Describe event-based triggers in `watchFor`.

## Validation and publication

Before committing:

1. Run `npm run validate:wake`.
2. Fix every reported error. Do not weaken the validator to accommodate a bad
   packet.
3. Commit the article, hero artwork, and Wake packet together whenever the
   available GitHub tooling permits an atomic commit.
4. Confirm that the site build succeeds.

A missing datum is acceptable. Fabricated precision is not.
