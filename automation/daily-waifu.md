# Daily Waifu task

This file is the standing contract for the scheduled **Daily Waifu** task. Run it
once each calendar day in `America/Phoenix`. Work in the
`roughatsea/roughatseablog` repository and publish validated changes directly to
`main` only after the complete edition, artwork, build, and deployment have
passed every check below.

## Purpose

Waifu is a daily visual teaching series built around one simple bargain:
**allure gets the reader's attention; intellectual substance earns it.** Each
edition introduces one new fictional adult woman and lets her teach one subject
well enough that an intelligent general reader leaves with a real idea they did
not have before.

The series may cover mathematics, physics, biology, medicine, computing,
engineering, history, art, philosophy, economics, law, courts, legislation,
geopolitics, linguistics, anthropology, or another subject worth understanding.
These examples are not a closed list.

Waifu is not a news digest, a pinup gallery with trivia attached, or a generic
anime-character generator. The woman, visual world, writing voice, and teaching
mechanics must grow out of the selected subject.

## Non-negotiable adult-character rule

Every featured woman must be **unambiguously an adult and at least 25 years
old**. Record her age in frontmatter. Never use school uniforms, childlike body
proportions, child-coded behavior, age ambiguity, "actually centuries old"
loopholes, or other visual shorthand that weakens this rule.

The character may be alluring, glamorous, sensual, elegant, playful, severe,
funny, scholarly, intimidating, cozy, or any combination that fits the edition.
Do not reduce allure to one repeated body type, outfit, pose, or personality.
Competence, charisma, expression, fashion, posture, humor, and visual
storytelling are all part of the palette. Do not make every character sound like
the same flirtatious assistant.

Characters are fictional. Do not intentionally make a daily Waifu a likeness of
a real person.

## Homepage boundary

The main Rough at Sea homepage remains reserved for long-form essays. **Never
add Waifu editions, cards, promos, or today's Waifu to the homepage feed.** The
series is discoverable through site navigation and `/waifu/`, which serves as
its landing page and archive.

## Required reading before each edition

Before researching or drafting:

1. Read this file completely.
2. Read `src/experiments/style_guide.md` completely and follow its nonfiction
   standards.
3. Read `src/experiments/unintroduced_referents.md` completely.
4. Read the current Waifu content schema in `src/content.config.ts`.
5. Read `scripts/validate-waifu.mjs` so you know the executable publication
   guardrails.
6. Inspect at least the previous fourteen Waifu editions when they exist, and
   scan the previous thirty for topic, character, and visual repetition.
7. Inspect the current `/waifu/` route and most recent edition so markup remains
   compatible with the site.

Repository files, not conversational memory, are the source of truth for the
standing contract and current implementation.

## Establish the publication date

Use the calendar date in `America/Phoenix`, not the executor's UTC date. Set
`date`, `edition`, and the filename to that Arizona date. If an edition already
exists for the date, do not create a duplicate. Inspect the existing edition and
stop unless the task explicitly concerns repair of an incomplete run.

## Topic selection

Each edition is **one woman, one subject, one memorable lesson**. Do not create a
roundup.

Build a small candidate pool before choosing. First ask whether something
important in the last roughly 24–72 hours deserves explanation: a consequential
court decision, meaningful legislation, geopolitical development, scientific
result, technological breakthrough, or another event with durable explanatory
value. Breaking news does **not** automatically win.

A current event should displace an evergreen subject only when it clears a high
significance threshold. Evaluate candidates using roughly these dimensions:

- importance;
- intellectual richness;
- explanatory value;
- surprise or counterintuitive payoff;
- visual potential;
- novelty relative to the Waifu archive;
- source quality;
- freshness.

Freshness is one factor, not the controlling factor. A beautiful evergreen
question beats routine news.

Deliberately rotate domains over time. Do not allow physics, technology, United
States politics, or any other easy category to become the default simply because
sources are plentiful.

Frame the selected subject around one clear question whenever possible. Examples
of the shape, not required titles: why time has a direction; what a court ruling
actually changes; why a mathematical construction is impossible; how a city or
empire survived; why a biological mechanism behaves strangely.

## Research standard

Research every edition. Do not generate an evergreen lesson solely from model
memory when accessible sources can verify and deepen it.

For stable subjects, prefer authoritative textbooks, scholarly work, museums,
universities, archives, primary documents, reputable reference works, and direct
technical sources. Keep a visible `## Sources` section.

For current affairs, set `currentAffairs: true` and use a higher evidentiary bar:

- verify exact dates;
- prefer primary materials such as court opinions, statutes, bills, official
  filings, agency releases, treaties, papers, datasets, and direct statements;
- supplement primary evidence with strong independent reporting or expert
  analysis when consequence or interpretation is at issue;
- distinguish what happened from what observers think it means;
- distinguish confirmed facts, inference, dispute, and uncertainty;
- do not multiply one press release into several supposedly independent sources;
- use multiple credible sources for consequential or contested claims.

For legal coverage, identify correctly whether the development is judicial,
legislative, regulatory, or executive rather than collapsing all law-related
news into one category.

## Character conception

Choose and research the subject **before** designing the woman. Her name, age,
profession or role, clothing, environment, props, personality, and visual motifs
should emerge from the material.

The character should sometimes embody the idea when that adds explanatory or
artistic value: impossible geometry for topology, changing disorder for entropy,
historically researched dress for history, competing clocks for relativity, and
so on. Do not force this device when it becomes gimmicky.

Give each woman a distinct intellectual personality. She may occasionally speak
inside the article, especially to correct a misconception or sharpen a point,
but do not turn every edition into roleplay. The neutral explanatory voice and
the character's voice may coexist.

## Article architecture

A normal edition is roughly **900–1,400 words**, but this is a guide rather than
a quota. Cut padding. Expand when the subject genuinely needs room.

Use clearly marked sections. A strong default movement is:

1. a concrete hook or central question;
2. the necessary concepts and prerequisites;
3. the main explanation or demonstration;
4. a visual, mathematical, historical, or interactive proof-of-understanding
   when useful;
5. why the idea matters;
6. one especially strange, beautiful, counterintuitive, or underappreciated fact
   — the character's "little secret" when that framing fits;
7. sources and further reading.

This structure may flex. Do not mechanically include a section that does not
serve the subject. Never introduce a person, object, institution, theorem,
source, dataset, or other referent as `the <noun>` before establishing what it
is and why it matters.

The reader should actually learn. Use equations, worked examples, maps,
timelines, diagrams, primary-source excerpts, interactive components, or other
teaching devices when they materially improve understanding.

## Visual essay contract

Visuals are editorial material, not decoration. Every image should do at least
one job well: teach, clarify, surprise, amuse, establish mood, reinforce memory,
or make the reader want to continue.

There is **no fixed image count**. Some editions may need only the hero. Others
may justify several generated scenes, diagrams, maps, humorous panels, or
interactive visuals. Quantity is determined by usefulness.

### Character artwork

Character artwork referenced by `heroImage` or `supportingImages` has strict
publication requirements:

- it must be genuine generated raster artwork, committed as `.webp` under
  `public/images/waifu/`;
- never substitute a hand-authored SVG, placeholder, cartoon stand-in, generic
  stock image, or easier surrogate when image generation or upload fails;
- the hero must be approximately 16:9 and at least 1600×900;
- every new supporting character artwork file must have a long side of at least
  1600 pixels and a short side of at least 900 pixels, in either landscape or
  portrait orientation;
- do not over-compress artwork merely to make upload easier; the executable
  validator rejects suspiciously tiny files;
- preserve the intrinsic aspect ratio of supporting artwork in markup and CSS;
- when an inline `<img>` declares `width` and `height`, those numbers must match
  the file's intrinsic aspect ratio;
- write precise alt text describing what is actually visible;
- avoid generated text inside artwork unless the composition truly requires it;
  diagrams and equations are usually more reliable when rendered by the site.

The image-generation output should be converted to WebP without downscaling
below these thresholds. Use the repository's proven binary-image publication
path: create/upload the actual binary blob, place it at the intended path, and
commit it. Do not re-invent the image as text because text files are easier to
commit.

### Diagrams and non-character visuals

SVG remains appropriate for deliberately constructed explanatory diagrams,
charts, icons, and interactive graphics. It is **not** permitted as a substitute
for generated character artwork and must never be used in `heroImage` or
`supportingImages`.

Supporting artwork may be landscape, portrait, or another useful aspect ratio.
The page must display the source shape rather than forcing every image to 16:9.

## Frontmatter and file placement

Create each edition under `src/content/waifu/` using the current schema. Use a
specific slug based on the subject, normally prefixed by the edition date. Store
all generated character artwork under `public/images/waifu/` with the same date
in the filename.

Required metadata includes the current schema fields: title, description,
heroImage, heroImageAlt, date, publishedAt when used, edition, topic, domain,
readTimeMinutes, currentAffairs, visualStyle, character metadata, supporting
images, and tags.

Do not add the edition to the long-form homepage collection.

## Fail closed

Waifu must never quietly degrade its requirements to obtain a green deployment.
If research, image generation, binary image upload, metadata, validation, build,
or deployment fails, **do not publish a compromised substitute**. Preserve the
work, report the failure accurately, and let the next run resume safely.

In particular:

- no SVG stand-ins for failed character artwork;
- no low-resolution emergency exports;
- no stretched images;
- no duplicate edition for the same Arizona date;
- no fabricated sources, facts, dates, quotes, or citations;
- no confident success report based only on a commit existing.

## Validation and publication

Before publishing:

1. Run `npm run validate:waifu`.
2. Run `npm run build`.
3. Confirm the Waifu archive and the new edition build successfully.
4. Confirm every referenced character artwork file exists at the expected path.
5. Confirm generated artwork resolution and aspect ratio at the file level, not
   merely by looking at HTML width/height attributes.
6. Review the diff for accidental homepage changes or unrelated edits.
7. Commit the edition, real binary artwork, and any necessary supporting code
   together.
8. Push/merge to `main` only after validation is green.
9. Wait for the production Vercel deployment to succeed.
10. Fetch or inspect the production edition and its artwork assets after
    deployment. Verify that the actual intended images are being served, that
    supporting images retain their intrinsic shape, and that the page is not
    showing placeholders or old assets.

Only then report publication success.

## Reference specimen

The inaugural edition is
`src/content/waifu/2026-09-07-why-doesnt-the-glass-unbreak.mdx`. It established
several useful ideas — one subject, a character whose identity follows the
lesson, visible sources, an interactive teaching device, and multiple visuals —
but its initial publication also exposed failures that this contract now
forbids: SVG stand-ins, inadequate production verification, an over-compressed
raster repair, and forced supporting-image aspect ratio.

Do not reproduce those failures. Preserve the successful editorial ideas, then
improve on them.
