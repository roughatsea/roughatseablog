# Seminal Ideas editorial contract

Purpose: substantial intellectual education through guided accounts of influential works. Teach readers to explain, reconstruct, and evaluate an argument. Scope is worldwide and multidisciplinary; the opening Nietzsche entry does not define the eventual canon.

## Adding a work

1. Read the relevant primary text and identify edition, translation, publication year, and durable section references.
2. Add the work and its thinker to `src/data/seminal-ideas.ts`. Slugs must be unique; the work's thinker must exist. Concepts must link to actual headings in its lesson.
3. Add its Markdown page beneath `src/pages/seminal-ideas/`, using `SeminalIdeasLayout.astro`. Keep these pages outside the notes collection and homepage essay feed.
4. Supply orientation (~1 minute), core lesson (~5–10 minutes), and deep exploration. Adjust displayed reading estimates when the text warrants it.
5. Define terms before using them. Reconstruct reasoning, supply explicitly editorial examples, discuss objections and common distortions, and offer a source-specific short reading path. Add a contextualized passage only when rights permit.
6. Distinguish author claims, editorial interpretation, historical influence, empirical support, and philosophical evaluation. Do not imply that historical influence validates a claim. Do not treat contested psychologies or reconstructions as scientific findings.
7. Mark planned works as planned; never create empty lessons or fabricated cross-links. Label connections as influence only when supported by evidence. Similarity, disagreement, and chronology are different relations.
8. Verify routes, concept anchors, metadata, navigation, mobile layout, and relevant Astro checks before release.

The catalogue and thinker routes derive from the registry. New disciplines can be introduced without reorganizing URLs. Add search and filters when the collection warrants them. The first release deliberately has one complete work rather than placeholder biographies or short summaries masquerading as education.
