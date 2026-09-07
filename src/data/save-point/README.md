# Save Point coverage ledger

`coverage-ledger.json` is the durable editorial memory for **Save Point**. The
daily task reads it before research and appends one edition after publication.
The public archive is rendered from the article collection; the ledger exists
to prevent accidental repetition, preserve source lineage, and make later
search and filtering possible without reconstructing editorial history from
prose.

## What one edition records

Every edition contains exactly three sections:

- `final-fantasy`
- `final-fantasy-xiv`
- `beyond-final-fantasy`

The edition identifies its rotating feature lane, article slug, hero artwork,
and publication time. Each section records its game, headline, source type,
spoiler scope, subject keys, and the source IDs that support it.

`subjectKeys` are short normalized phrases used for similarity checks. They are
not public tags. Record the substance of the subject, not only its title. For
example, `final-fantasy-viii-junction-tutorial-design` is more useful than
`final-fantasy-viii`.

## Sources and lineage

Each source has a stable ID within the edition and records:

- the exact URL and title;
- creator or publisher when known;
- publication date when established;
- source role;
- lineage;
- video ID when applicable;
- the date on which the source was accessed.

`lineage` identifies the underlying origin of a claim. Reports that repeat one
announcement share a lineage; they do not become independent confirmation
merely because several sites published them.

Use these source roles:

- `primary`: official material, direct creator testimony, game text, or the
  original video being summarized;
- `independent`: reporting or analysis with its own verification;
- `context`: background that helps interpret a claim;
- `transcription`: a transcript or game-dialogue transcription whose hosting
  source must be identified accurately.

## Corrections and revisits

Do not silently remove a published edition from the ledger. Correct factual or
metadata errors in place and explain consequential corrections in the article
or commit. A subject may return only when new evidence or a materially
different question justifies it. Set `revisitOf` to the earlier edition and
make the new angle explicit in `subjectKeys`.

The same YouTube video ID must never appear twice. A source URL may reappear
only when it is a durable reference—such as an official game page—and the new
section asks a different question.

## Validation

Run:

```sh
npm run validate:save-point
```

Validation checks edition identity, lane coverage, source references, duplicate
video IDs, article and hero paths, and the required metadata. Do not weaken the
validator to accommodate an incomplete edition.
