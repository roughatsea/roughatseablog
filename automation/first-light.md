# Publish First Light

Repository: `roughatsea/roughatseablog`. Publication: **First Light**, at `https://www.roughatsea.com/feed/`.

First Light is a daily illustrated magazine about the future becoming possible. It combines the expansive optimism of science fiction, a sustained inquiry into the technological singularity, verified reporting, and substantial original fiction. The desired experience is wonder, possibility, and a growing understanding of how people could live well in a radically more capable civilization.

This publication replaces the former daily feed. Its retired briefing, data, and automation are not templates to restore. Preserve the new First Light editions as they accumulate. Do not alter other scheduled series, publish private information about the owner or family, or create Instagram content.

## Required context on every run

Start from fresh GitHub `main`. Read this file, `automation/first-light-interest-profile.md`, applicable repository instructions, `experiments/style_guide.md`, and `experiments/unintroduced_referents.md` in full. Read the current schema and validation in `scripts/first-light-data.mjs` and its declarations in `scripts/first-light-data.d.mts`. The repository is the durable editorial authority; do not depend on conversational memory.

Read the seven most recent First Light editions when available, and review the preceding 30 editions' subjects and `src/data/first-light/visual-ledger.json`. Look for repeated news, fictional premises, people, settings, visual compositions, and neglected interests. Review all available editions when there are fewer than seven or 30. Use these observations to make a fresh editorial choice, rather than imposing mechanical topic quotas. Report a specific blocker if required context cannot be read.

Use the current calendar date in **America/Phoenix** for the edition, asset directory, and ledger. Never substitute the host timezone or America/Denver. A same-date rerun updates that edition without creating a duplicate issue or incrementing its issue number. A new date receives the next sequential issue number.

## Editorial identity

The technological singularity is a central, continuing question: what might happen if increasingly capable artificial intelligence helps accelerate further discovery, invention, and the development of intelligence itself? Explain terms such as AGI and recursive improvement when they are needed. Distinguish demonstrated capabilities, plausible consequences, contested forecasts, and invented futures. Examine feedback among AI research, automated science, robotics, energy, computation, materials, and manufacturing. Track concrete changes in capabilities and constraints; do not invent a singularity countdown, a percentage-complete meter, or certainty about timing.

Give the reader somewhere worth going. Explore abundance, health, freedom over one's time, reinvention, exploration, art, play, companionship, accessibility, and the lives of ordinary people. Ask who can use a capability, how benefits might become widely available, and what work remains. Optimism may shape the questions and imaginative possibilities; it must not change the strength of the evidence or hide consequential events.

Read the entire interest profile before selecting stories. Preserve its breadth: AI and software, games and anime, music and literature, biology and mathematics, space, economic life, public affairs, local developments, and unfamiliar discoveries. Culture and joy have intrinsic value. Scan consequential human events, including public health, civil rights, conflict, institutions, economic conditions, and environmental changes, even when they do not fit the edition's central theme. Use **Here on Earth** for worthwhile reports that deserve their own context. Do not force every event into an AI narrative or manufacture an uplifting conclusion about suffering.

## Research and reporting

Research a broad candidate pool before choosing **three to six useful reported items**. Include only items with a clear reason to be there; do not pad the edition. On a quiet news day, a strong older discovery can earn a place if labeled **Discovery** and dated honestly. An edition need not include every department. Vary the balance over time, with a fair place for culture, beauty, practical opportunities, and the wider world.

Browse current sources and open the actual supporting pages. Prefer original papers, official announcements, public records, and reliable original reporting. Corroborate contested or consequential claims. Check dates, project identities, availability, scope, baselines, and limitations. Distinguish the event date from the source publication date and the edition date. Clearly identify preprints, laboratory findings, company claims, allegations, editorial inferences, and uncertainty. A press release about a laboratory result does not establish clinical benefit.

Each reported item has **one to five concise, original, high-value bullets**. Five is a hard maximum, including when summarizing a Rough at Sea article. Explain the concrete development, its significance, necessary context, and a useful next step or unresolved constraint when relevant. Two or three bullets often suffice. Avoid unexplained shorthand, promotional churn, repeated announcements without substantive changes, outrage bait, and false balance. Link the supporting source pages next to the item through its structured `sources` field. Do not fabricate sources, quotes, dates, listening impressions, or access to material. Respect quotation and paraphrase limits.

The singularity section connects evidence across reports or develops one well-supported question. Supply its own source links for factual claims. Make the distinction between an author's inference and a source's finding explicit. Fiction and illustrations cannot establish evidence for a reported claim.

## Prominent original fiction

Every issue contains **350–600 words of original speculative fiction**, counting `fiction.opening` and `fiction.continuation` together. Fiction is a substantial daily feature. Begin the issue's reading experience with it, label it visibly as **An imagined future**, and continue it later among the images and reporting. The opening and continuation must form a coherent miniature story; the split should create curiosity without confusing the reader.

Invent particular people, activities, desires, and choices. Let a future capability affect an ordinary life. Stories may be playful, strange, intimate, adventurous, or breathtaking. Vary their emotional movement, scale, point of view, and setting. Give the reader clear immediate action and enough context to follow it. Avoid interchangeable futuristic city tours, technology speeches in dialogue, automatic sentimentality, and repeating a familiar scene under new names. Do not import private family details, imply the fiction really happened, or silently turn a speculative scene into reporting.

Use `fiction.assumptions` to state the important inventions or extrapolations behind the scene in plain language. This note is separate from the fiction word count. It should help a curious reader distinguish what exists, what is extrapolated, and what the story imagines, without interrupting the scene with constant qualifications. Recurring fictional places or characters are welcome when continuity is checked, but each edition must remain understandable to a new reader.

Apply the fiction and nonfiction parts of the style guide to their respective sections. The standing brief supplies the form, reader, tone, permission to invent fiction, and boundaries; make routine creative choices autonomously. Never invent nonfiction details to fill a gap.

## Four original generated illustrations

Every complete issue requires **four new diffusion-generated raster illustrations**, created with an available image-generation tool and inspected before publication. These are major editorial features, not interchangeable decorations:

| Required role | Editorial purpose |
| --- | --- |
| `cover` | The strongest opening image, establishing this issue's particular possibility. |
| `possibility` | A place, capability, or environment that rewards looking and invites exploration. |
| `human` | A concrete human-scale consequence: an activity, relationship, freedom, pleasure, or choice. |
| `closing` | A distinct final marvel or intimate image that leaves something alive in the reader's mind. |

Generate all four as distinct compositions. Use original prompts specific to the edition. Favor vivid color, memorable architecture or environments, inhabited futures, expressive people, and a deliberate range of scale. Include different ages, activities, settings, and lives over time. Vary palettes, lighting, composition, artistic treatment, and subject matter across the last seven and 30 issues. Avoid the recurring template of a tiny figure facing luminous towers at sunset. Four views of essentially the same scene do not fulfill the four editorial roles.

Keep image-generation records in the visual ledger. **Never substitute SVGs, code-drawn graphics, generic stock art, or previously published images for these illustrations. Never reuse an image from another issue.** Reuse of an approved asset within a same-date correction is allowed when it still fits the corrected issue. The four original First Light concept images commissioned during the design discussion may serve as the inaugural issue's set because they have not appeared in an earlier published issue; this is a one-time inaugural exception to generating the set during the publication run.

The current schema supports exactly the four required roles. A fifth image was discussed as a possible future enhancement; do not add it until the schema and renderer explicitly support it.

Publish optimized full-size WebP files and corresponding smaller variants under `public/images/first-light/YYYY-MM-DD/`: `cover.webp`, `possibility.webp`, `human.webp`, `closing.webp`, and their `-small.webp` variants. Raster optimization and responsive derivatives are allowed; retain the approved artwork and sufficient visual quality. Store truthful pixel dimensions, useful alt text, and captions. Identify illustrations as imagined/generated artwork where necessary to avoid confusion with photographs of reported events. Do not put an invented depiction beside a real finding in a way that suggests the image documents the finding.

Inspect all four generated images for visual quality, coherence with the fiction, distracting artifacts, and distinctness. Check readable desktop and mobile layouts, appropriate crops, responsive image references, and file sizes. If generation or asset retrieval fails, preserve recoverable work and report the specific failure. A text-only edition, placeholder, broken remote URL, or SVG fallback does not meet the brief.

## Data contract and preservation

Create `src/data/first-light/editions/YYYY-MM-DD.json`. Match the current validated schema exactly:

- Edition: `date`, sequential `issue`, `title`, `dek`, `theme`, `images`, `fiction`, `items`, `singularity`, and `closing`.
- `images`: exactly `cover`, `possibility`, `human`, and `closing`; each has `src`, optional `srcSmall`, `width`, `height`, `alt`, and `caption`. Use the published root-relative asset paths and include the generated small variants.
- `fiction`: `title`, `opening` and `continuation` arrays of plain-text paragraphs, and `assumptions`.
- Each reported item: a stable globally unique `id`, `title`, `department`, `topic`, `kind` (`Update` or `Discovery`), honest `sourceDate`, one to five plain-text `bullets`, and `sources`. Optional `article` links to an existing supported Rough at Sea article route.
- Allowed departments: `First Light`, `Toward the Singularity`, `Room to Live`, `Outward`, `Strange & Beautiful`, and `Here on Earth`.
- Each source: `label` and an HTTPS `url` pointing to the actual supporting page.
- `singularity`: `title`, `paragraphs`, `signals`, `question`, and `sources`. Signals are evidence to watch, not invented progress scores.
- `closing`: `title` and plain-text `paragraphs`.

Update `src/data/first-light/visual-ledger.json` in the same change. It is an array with one entry per date: `date`, `theme`, `setting`, `subjects` (array), `palette` (array), `fictionTitle`, and `images` (array). Each image record contains `role`, `src`, the actual generation `prompt`, and `sha256` of the published full-size raster file. Calculate hashes from the final files. Do not invent hashes or generation provenance. The edition, four image pairs, and matching ledger entry must agree.

Preserve earlier First Light editions, stable identities, and their artwork. Correct factual errors openly in the relevant entry; preserve meaningful historical context. The user's one-time reset of the former feed does not authorize deleting subsequent First Light editions. Same-date reruns update that date atomically and maintain the ledger's one-entry-per-date structure.

## Validate, publish, and verify

Install dependencies with `npm ci --no-audit --no-fund` if needed. Run `npm run validate:first-light` and `npm run build`. Inspect the diff, source support, fiction length, all image files, and ledger consistency. Never weaken validation to make an incomplete edition pass. Obtain a real successful build locally or on repository CI before claiming readiness.

Use the **GitHub connector** to publish and inspect commit/deployment status. Do not use the Vercel connector. Publish the edition, its complete image assets, and ledger together in one atomic commit to fresh `main`, using a non-force update. Check whether `main` moved and reconcile concurrent work before retrying. Preserve unrelated changes. If a connector cannot transport binary files, use an available supported GitHub asset/blob workflow or authenticated repository transport; do not replace required art with text assets or commit references to absent files.

Verify status for the resulting commit and inspect the live production edition page, the `/feed/` landing page, and all four full-size image URLs plus their small variants. Confirm the correct issue renders, every image returns the expected raster content, and the new content is present on the live site. A successful commit alone does not verify deployment. Report the exact stage reached if production verification remains pending or blocked.

If sufficient sourced reporting, four original images, validation, or publication cannot be completed, preserve recoverable work and give the specific sanitized diagnostic. Do not publish a partial issue, invent a development, quietly reuse artwork, disable this task, or alter another automation to work around a failed run. Finish with a concise result and the live edition URL, naming any material blocker honestly.
