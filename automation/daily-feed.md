# Publish the Rough at Sea feed

Repository: `roughatsea/roughatseablog`. Destination: `https://www.roughatsea.com/feed/`.

Read current main, this file, and `automation/feed-interest-profile.md` in full before working. The interest profile is a required editorial input on every run; do not replace it with a generic topic list or rely on conversation memory. If it cannot be read, report the specific blocker rather than claim a personalized edition. Follow applicable repository instructions. This is a public daily briefing, personally selected without publishing private facts about the owner or family. Do not alter other scheduled series or create Instagram content.

## Editorial brief

Mix meaningful updates in AI and software engineering, game development, JRPGs and unusual games, music, literature, science, and space with consequential national/international affairs, economics, public policy, Tucson/Arizona developments, and practical opportunities. Track announced projects only after verifying their identity and official sources; never assume a remembered title or rumor is real. Include joy, beauty, and curiosity. Consequences for other people matter even when the owner cannot act on them.

Aim for 6–10 strong entries, fewer when warranted; no quota or filler. Reserve space for one or two unexpected discoveries when good candidates exist. No mandatory entry for every interest, no outrage bait, no reaction-cycle churn, no repeated announcements without substantive changes. Scan wider-world developments before choosing the edition so it does not become exclusively a technology digest. Do not treat research press releases as established clinical advice.

Browse current sources. Prefer primary announcements, papers, official records, and reliable original reporting; corroborate contested or consequential claims. Open and inspect supporting pages, distinguish event/publication dates, label preprints, allegations, uncertainty, and editorial inference. Do not fabricate access, quotes, news, dates, or evidence. Older discoveries are welcome when explicitly labeled Discovery and their source date remains visible. Keep summaries original and respect source quotation and paraphrase limits.

## Selection pass

Read at least the seven most recent editions when available. Look for repeated stories, overrepresented subjects, and neglected parts of the profile; vary the selection without manufacturing quotas or filler. Research a broad pool before writing: known interests, consequential wider-world developments, practical opportunities, and unfamiliar discoveries. Use the profile's reasons for interest to choose among candidates, not just its subject labels.

Privately assess each candidate for what is actually new (or why an older discovery is worthwhile), evidence quality, significance, relevance, and duplication. Choose the strongest set, not the first search results. Omit candidates whose appeal rests on hype, distress, ideological affirmation, or a tenuous personal connection. Do not hide major consequential developments simply because they fall outside established interests. Do not force equal weight between well-supported findings and unsupported opposition.

Before publication, check that the edition offers both personal relevance and a view beyond it, that joy and discovery have a fair chance, and that any imbalance reflects the day's evidence rather than habitual topic selection. This is editorial judgment, not a scoring system or mandatory public checklist. The one-to-five-bullet limit applies to every entry, including summaries of Rough at Sea articles.

## Format and preservation

Read recent `src/data/feed/*.json` to avoid duplication. Add `YYYY-MM-DD.json` for the current America/Denver calendar date. Each edition has `date` and `items`. Copy the existing exact structure. Each item has a globally unique stable slug `id`, descriptive `title`, `lane` (Your interests / Wider world / Useful opportunities / Unexpected discoveries), `topic`, `kind` (Update / Discovery), original `sourceDate`, 1–5 concise high-yield plain-text `bullets`, and one or more `sources` with `label` and HTTPS `url`. Optional `article` links to an existing supported Rough at Sea article route. Summaries must stand alone, including when linking to a full article. Five bullets is a hard maximum, not a target; two or three often suffice. Explain what happened, why it matters, essential context, and uncertainty or useful next steps where relevant. Avoid unexplained shorthand.

Preserve all prior editions and stable item IDs. Reruns on the same date update that edition without duplicate stories or changing its identity. Correct errors openly in the relevant entry; do not erase historical context. Keep sourceDate honest; edition date is selection date, not the date every event happened. Do not publish private account information, personal financial details, health information, or employer-specific information. No images are required.

## Check and publish

Run `npm ci --no-audit --no-fund` if dependencies are absent, `npm run validate:feed`, and `npm run build`. The shared data reader also validates during route generation. Inspect summaries against sources and the diff. Never weaken checks. Commit the edition atomically to current main with a non-force update; preserve concurrent work and reconcile if main moved. GitHub connected tools may be used if local push is unavailable. Require real build verification locally or on repository CI. Verify deployment status for the resulting commit and inspect the production edition URL; a successful commit alone is not deployment verification.

On failure, preserve recoverable work and accurately report the failed operation and sanitized diagnostic. Do not claim publication, freshness, or source verification that did not happen. Do not disable this task or edit other automations because an iteration failed. If no worthwhile verified update exists, report no change rather than fabricate an edition. Finish with a short result and the feed URL, naming any material blocker.
