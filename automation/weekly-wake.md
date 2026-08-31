# Weekly Wake task

This file is the standing contract for the scheduled **Weekly Wake** task. Run it every Sunday at 7:00 AM in `America/Phoenix`, after that morning's Daily Soundings run has completed. Work in the `roughatsea/roughatseablog` repository and push validated changes directly to `main`.

## Purpose

The Wake follows a deliberately small set of signals after Rough at Sea first notices them. Its primary product is an append-only longitudinal dataset. The public `/wake/` interface, record pages, latest-run summary, and downloads are generated from that dataset.

A weekly run must discover what changed without manufacturing a development merely because the schedule fired. “No material change” is valid data when a real review occurred.

## Required reading

Before doing any research:

1. Read `src/data/wake/README.md`.
2. Read `src/data/wake/wake-observation.schema.json`.
3. Read `src/data/wake/wake-record.schema.json`.
4. Read `src/data/wake/wake-run.schema.json`.
5. Read the most recent file in `src/data/wake/runs/`.
6. Read every active file in `src/data/wake/records/`.
7. Read every new packet in `src/data/wake/inbox/` after the previous run's `inputWindow.end`.
8. Read the corresponding Morning Soundings articles for any packet considered for admission.

Never infer the current state from page prose alone when the structured records can answer it.

## Establish the run window

Use the calendar dates after the previous successful run through the current Sunday, inclusive. A packet already included in an earlier run must not be treated as new intake, though it may reveal a continuation of an active subject.

Create one run log at:

`src/data/wake/runs/YYYY-MM-DD-weekly.json`

Use actual ISO timestamps with the Arizona offset. If a run must be repeated after a failure, do not overwrite a completed run. Use a clear suffix and explain the relationship.

## Intake and continuity

For every new inbox signal:

1. Search active records by canonical subject, aliases, tracking terms, entities, and the substance of the claim—not merely exact wording.
2. When it continues an active subject, connect it to that record. Do not create a duplicate record.
3. When it is new, evaluate it for admission.
4. Preserve every decision in the run log: admission, deferral, continuation, or failure.

A Soundings disposition of `active-candidate` is a recommendation, not an automatic admission. `passive` and `unsuitable` signals ordinarily remain in the inbox, but genuinely new evidence may justify reconsideration; explain any such exception.

## Admission policy

Editorial importance still outranks ease of measurement. Ordinarily admit no more than **one to three** new records per weekly run. Keep the active collection small enough for honest follow-up.

Prefer a candidate with:

- a consequential unresolved question;
- a stable, identifiable subject;
- observable future evidence or milestones;
- durable primary sources;
- a claim that can be confirmed, contradicted, revised, replicated, implemented, abandoned, restored, reattributed, released, or forgotten;
- a plausible trajectory over weeks, months, or years;
- distinct value not already supplied by an active record.

Do not fill a quota. Zero admissions is acceptable. When capacity is the reason for deferral, say so; the signal must remain discoverable in the run history.

For an admission:

1. Create `src/data/wake/records/<wakeId>.json` conforming to the record schema.
2. Reference the immutable inbox signal with `originSignalIds` rather than copying and silently revising its point-zero facts.
3. Add a `point-zero` observation and an `admission` observation.
4. Add the admission to the run log.
5. Choose the narrowest defensible current lifecycle, evidence state, cadence, review date, and event trigger.

## Review active records

Review a record when any of these is true:

- `current.nextReviewAfter` is on or before the run date;
- a new Soundings signal appears to continue it;
- a stored event trigger has fired;
- credible new evidence is discovered during intake;
- a correction is required.

Do not deeply research every record every Sunday. Respect the cadence and event triggers so the collection can grow without the workload growing linearly.

For each reviewed record:

1. Re-run stable tracking terms and search for named milestones.
2. Prefer primary documents, peer-reviewed work, official filings, public datasets, direct release artifacts, and first-hand evidence.
3. Seek independent reporting or analysis where interpretation, performance, or impact is at issue.
4. Distinguish a truly new source lineage from repetition of an old one.
5. Check whether a source disappeared, changed, was corrected, or was retracted.
6. Decide whether the new material changes the current assessment.

Append exactly one or more dated observations for the review. Never edit an older observation to make it agree with current knowledge.

A meaningful scheduled review with no new evidence may append a `review` observation with `materialChange: false`. Say what was checked and why the state remains unchanged. Do not create empty public drama around it.

When evidence materially changes the interpretation:

- set `materialChange: true`;
- update lifecycle, evidence, and attention independently;
- update the record's `current` object to mirror the latest observation;
- update open questions and watch conditions explicitly;
- add the observation ID to the run log's `updates` and `reviews` entries.

## Lifecycle discipline

Use only the states defined by the schema:

- `emerging`: meaningful future evidence is expected;
- `corroborated`: important parts gained independent support;
- `disputed`: material evidence or interpretation remains contested;
- `implemented`: a promised program, product, policy, or design was deployed;
- `stalled`: expected progress stopped without clear resolution;
- `contradicted`: later evidence substantially weakened the original claim;
- `resolved`: the central open question has a defensible answer;
- `dormant`: no useful update is expected soon;
- `retracted`: the source or claim was formally withdrawn.

Do not use lifecycle as a quality score. A disputed record may be more valuable than a corroborated one.

## Evidence and source lineage

For every source, record its role and lineage. Sources that ultimately derive from one paper, press release, wire report, interview, or announcement share a lineage. Repetition can indicate attention; it is not independent corroboration.

Keep first-party, promotional, and institutional claims labeled. Keep allegations labeled as allegations. Do not infer censorship, conspiracy, suppression, or deliberate neglect from sparse coverage. Missing values remain `null` or `unmeasured`; never invent precision.

When reliable sources disagree, preserve the disagreement and cite the strongest source for each material position. When making an inference, label it as an inference.

## Attention measurements

Until a reproducible attention methodology is formally added to the schemas and methodology page, keep attention at `unmeasured`.

Do not use ordinary search-engine result estimates. A future measurement must preserve its provider, exact query, date window, capture time, complete matching result set, and source-lineage deduplication method.

## Corrections

When an older observation contains a factual error:

1. Do not rewrite it silently.
2. Append a correction object pointing to the affected observation.
3. Append a `correction` observation explaining the effect on the current interpretation.
4. Include supporting sources.
5. Record the correction in the weekly run summary when it is material.

Typos that do not change meaning may be fixed normally, but note any ambiguity conservatively.

## Run log and public summary

The run log is the audit record. It must include:

- exact start and completion times;
- the intake window and packet filenames;
- every admission and its reason;
- every updated record and observation ID;
- every performed review and whether it found a material change;
- deferred candidates and reasons;
- failures, unavailable sources, or unresolved tool limitations;
- the active-record count after the run;
- the attention method in force;
- a concise summary and public highlights.

The public highlights should mention only meaningful developments, corrections, admissions, or unusually informative no-change findings. They are rendered automatically on `/wake/`; do not hand maintain a second summary page.

## Validation and publication

Before committing:

1. Run `npm run validate:wake`.
2. Run `npm run build:wake-exports`.
3. Run `npm run build`.
4. Fix every error without weakening validation to accommodate bad data.
5. Confirm that `/wake/`, each affected detail page, `/wake/methodology/`, `/wake/data.json`, and `/wake/data.csv` build successfully.
6. Commit records, the run log, and any necessary code or methodology changes together when the tooling permits.
7. Push directly to `main`.
8. Verify the deployment status.

Do not publish a confident status report when a required source, validation step, build, commit, or deployment failed. Record the failure plainly in the run log and report it to the user.
