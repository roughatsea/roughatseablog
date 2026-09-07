# Daily Save Point task

This file is the standing contract for the scheduled **Daily Save Point** task.
Run it every day at 2:00 AM in `America/Phoenix`, before Daily Soundings. Work
in the `roughatsea/roughatseablog` repository and push validated changes
directly to `main`.

## Purpose

Save Point is Rough at Sea's daily JRPG corner. Each edition gives an
intelligent general reader three worthwhile discoveries:

1. one about Final Fantasy outside Final Fantasy XIV;
2. one specifically about Final Fantasy XIV;
3. one about a JRPG beyond Final Fantasy.

The three subjects may come from exceptional video essays, meaningful news,
overlooked lore, direct interviews, design and music analysis, translation,
preservation, development history, mods, fan scholarship, or another form that
rewards close attention. These are examples, not a closed list.

Save Point is not a gaming-news digest. Old material does not lose to new
material merely because it is old. Prefer an eight-year-old observation that
changes how a reader sees a game over routine news that will be forgotten next
week.

## Required reading

Before researching an edition:

1. Read this file completely.
2. Read `src/experiments/style_guide.md` completely and apply its nonfiction
   standards.
3. Read `src/data/save-point/README.md`.
4. Read `src/data/save-point/coverage-ledger.json`.
5. Inspect at least the previous fourteen Save Point editions when they exist.
6. Inspect the previous seven Morning Soundings editions for overlapping games,
   sources, and claims.
7. Inspect the current Save Point content schema and the most recent edition so
   the new frontmatter and components remain compatible.

Do not use conversational memory as a substitute for these repository files.

## Establish the publication date

Use the calendar date in `America/Phoenix`, not the executor's UTC date. Set:

- `date` and `edition` to that Arizona calendar date;
- `publishedAt` to 2:00 AM with the correct Arizona offset;
- the article slug and hero filename to the same date.

If an edition already exists for the date, do not create a duplicate. Inspect
the existing work and stop unless the task explicitly concerns a failed or
incomplete run.

## Candidate research

Build a real candidate pool for each of the three lanes. Search beyond the most
popular results and beyond the current news cycle. Smaller creators, archived
interviews, Japanese-language sources, preservation communities, and old
developer material are in scope when their provenance can be established.

Evaluate candidates on:

- novelty to the existing Save Point archive;
- specificity and intellectual substance;
- source quality and directness;
- whether the evidence can actually support the proposed claim;
- under-coverage or unusual usefulness;
- the possibility of adding a distinct Rough at Sea analysis;
- spoiler risk;
- whether a stronger or more direct source exists.

Reject generic listicles, routine recaps, low-information reactions, outrage
without consequence, fandom drama, fabricated mysteries, content-farm prose,
and material whose principal value is that it is recent.

The Beyond Final Fantasy lane may include Square Enix games such as Chrono
Cross, Xenogears, or NieR. Do not let it become a third Final Fantasy lane. In
each rolling seven-day window, cover several developers, eras, and platforms;
do not allow one publisher to occupy the lane by default.

## YouTube standard

Normally include at least one strong YouTube-derived section when a worthy
video with an accessible transcript is available. Two or three video sections
are acceptable when they independently clear the quality bar. Do not force a
weak video merely to satisfy the normal expectation.

Before summarizing a video:

1. Obtain and read its captions or transcript.
2. Confirm that the transcript belongs to the selected video.
3. Record the exact title, creator, URL, video ID, and publication date when
   available.
4. Identify the creator's actual thesis and supporting observations.
5. Distinguish the creator's argument from Save Point's additional analysis.
6. Preserve useful timestamps only when they can be verified.

Never infer a video's contents from its title, thumbnail, description, search
snippet, comments, or another person's summary. If the transcript cannot be
obtained reliably, select another source. Quote only brief, necessary phrases;
do not reproduce a transcript.

Credit the creator prominently in the source card and link to the original
video. The article must not absorb another person's discovery and quietly
present it as Rough at Sea's own.

## News, lore, and interpretation

For current news, verify the event date and publication date separately. Prefer
official announcements, direct interviews, filings, release artifacts, and
other primary evidence. Use independent reporting when interpretation,
performance, reception, or consequence is at issue. Do not multiply one press
release into several independent sources.

For lore, distinguish:

- `Canon`: directly established by a game or authoritative source;
- `Interpretation`: a reading supported by established material;
- `Fan theory`: interesting but unconfirmed;
- `Uncertain`: disputed, incomplete, or dependent on translation.

Do not elevate an interpretation to canon because it is persuasive. When a
translation matters, identify who translated it and whether the original text
is available.

## Edition architecture

Write one article with exactly three clearly marked sections in this order:

1. `Final Fantasy`
2. `Final Fantasy XIV`
3. `Beyond Final Fantasy`

Give one lane the rotating feature, normally 800–1,400 words. Give the other
two substantial briefs, normally 350–650 words each. These ranges guide
proportion; they are not quotas. Cut padding. Expand only when evidence or
explanation needs room.

Across a normal seven-day window, each lane should receive at least two
features. Give the seventh feature to the strongest remaining candidate. Read
the ledger before assigning the day's feature.

Do not invent a theme connecting the three selections. If a real relationship
emerges, the introduction may name it. Otherwise, introduce the three subjects
plainly. Never refer to a person, object, event, source, argument, or collection
as `the <noun>` before the article has established what that noun is and why it
matters.

Use a specific title that belongs to the feature rather than a generic numbered
edition. Keep the description and the three frontmatter summaries spoiler-safe.
At the top of the body, orient the reader without repeating the issue map that
the page renders from frontmatter.

## Spoilers

Titles, descriptions, frontmatter summaries, homepage cards, archive cards,
and introductory paragraphs must remain safe for a reader who has not finished
the named game.

Set a spoiler level and precise spoiler scope for every section. Use
`SavePointSpoiler.astro` to collapse major story revelations. The warning must
name the game and the affected chapter, expansion, quest, or ending when that
can be stated safely. Text before the collapsed block must not reveal the same
fact through conspicuous hints.

Seasonal-event spoilers, mechanical information, and old release dates are not
automatically major spoilers; label them according to their actual effect on a
first-time player.

## Article components and metadata

Create the edition as MDX under:

`src/content/save-point/save-point-YYYY-MM-DD.mdx`

Use the current content schema. Frontmatter must include exactly three section
records, one for each lane. The primary source in frontmatter should be the
source that most directly supports the section's central discovery.

Import and use `SavePointSource.astro` for a visible source card in every
section. Import `SavePointSpoiler.astro` whenever major spoilers appear. Give
the three body headings these exact IDs so the issue map works:

- `final-fantasy`
- `final-fantasy-xiv`
- `beyond-final-fantasy`

Append the new edition and all used sources to
`src/data/save-point/coverage-ledger.json`. Use subject keys that capture the
substance of the coverage. Record source lineage honestly. Do not invent a
creator, publication date, timestamp, video ID, access date, or independent
lineage; use `null` where the ledger permits it.

## Original artwork

Create one original 16:9 hero image under `public/images/save-point/`. Preserve
the recognizable Save Point visual system: a moment of pause during a strange
journey, dark maritime space, and controlled cyan, magenta, and electric-lime
accents. Vary the setting and composition from day to day.

Do not copy characters, logos, UI, named locations, weapons, crystals, or key
art from an existing game. Do not place text in the image. The artwork should
evoke JRPG travel without pretending to be official franchise art.

Write precise alt text describing what is visible rather than explaining the
image's intended symbolism.

## Coordination with Morning Soundings

Save Point runs before Morning Soundings. It must avoid repeating a source,
claim, or near-identical angle from recent Soundings. Morning Soundings will
read the completed same-day Save Point and make the reciprocal check.

A consequential JRPG development may still appear in both series only when
Morning Soundings takes a genuinely broader cultural, artistic, scientific, or
technological angle and links to Save Point instead of reproducing it.

Save Point does not create a Wake inbox packet. The Wake remains downstream of
Morning Soundings unless its standing contract is deliberately expanded.

## Validation and publication

Before committing:

1. Run `npm run validate:save-point`.
2. Run `npm run build`.
3. Confirm that the Save Point archive, the new article, and the homepage build.
4. Confirm that the hero, title, description, and social metadata belong to the
   new edition.
5. Review the diff for accidental changes outside the requested scope.
6. Commit the article, artwork, ledger, and any necessary supporting changes
   together.
7. Push directly to `main`.
8. Verify the production deployment and the public article URL.

Do not weaken validation to accommodate missing metadata. Do not publish a
confident status report when research, transcript access, validation, build,
commit, push, or deployment failed. State the failure and preserve enough
information for the next run to resume safely.
