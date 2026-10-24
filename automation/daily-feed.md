# Publish the Rough at Sea feed

Repository: `roughatsea/roughatseablog`. Destination: `https://www.roughatsea.com/feed/`.

Read current main and this file before working. Follow applicable repository instructions. This is a public daily briefing, personally selected without publishing private facts about the owner or family. Do not alter other scheduled series or create Instagram content.

## Editorial brief

Mix meaningful updates in AI and software engineering, game development, JRPGs and unusual games, music, literature, science, and space with consequential national/international affairs, economics, public policy, Tucson/Arizona developments, and practical opportunities. Track announced projects only after verifying their identity and official sources; never assume a remembered title or rumor is real. Include joy, beauty, and curiosity. Consequences for other people matter even when the owner cannot act on them.

Aim for 6–10 strong entries, fewer when warranted; no quota or filler. Reserve space for one or two unexpected discoveries when good candidates exist. No mandatory entry for every interest, no outrage bait, no reaction-cycle churn, no repeated announcements without substantive changes. Scan wider-world developments before choosing the edition so it does not become exclusively a technology digest. Do not treat research press releases as established clinical advice.

Browse current sources. Prefer primary announcements, papers, official records, and reliable original reporting; corroborate contested or consequential claims. Open and inspect supporting pages, distinguish event/publication dates, label preprints, allegations, uncertainty, and editorial inference. Do not fabricate access, quotes, news, dates, or evidence. Older discoveries are welcome when explicitly labeled Discovery and their source date remains visible. Keep summaries original and respect source quotation and paraphrase limits.

## Format and preservation

Read recent `src/data/feed/*.json` to avoid duplication. Add `YYYY-MM-DD.json` for the current America/Denver calendar date. Each edition has `date` and `items`. Copy the existing exact structure. Each item has a globally unique stable slug `id`, descriptive `title`, `lane` (Your interests / Wider world / Useful opportunities / Unexpected discoveries), `topic`, `kind` (Update / Discovery), original `sourceDate`, 1–5 concise high-yield plain-text `bullets`, and one or more `sources` with `label` and HTTPS `url`. Optional `article` links to an existing supported Rough at Sea article route. Summaries must stand alone, including when linking to a full article. Five bullets is a hard maximum, not a target; two or three often suffice. Explain what happened, why it matters, essential context, and uncertainty or useful next steps where relevant. Avoid unexplained shorthand.

Preserve all prior editions and stable item IDs. Reruns on the same date update that edition without duplicate stories or changing its identity. Correct errors openly in the relevant entry; do not erase historical context. Keep sourceDate honest; edition date is selection date, not the date every event happened. Do not publish private account information, personal financial details, health information, or employer-specific information. No images are required.

## Check and publish

Run `npm ci --no-audit --no-fund` if dependencies are absent, `npm run validate:feed`, and `npm run build`. The shared data reader also validates during route generation. Inspect summaries against sources and the diff. Never weaken checks. Commit the edition atomically to current main with a non-force update; preserve concurrent work and reconcile if main moved. GitHub connected tools may be used if local push is unavailable. Require real build verification locally or on repository CI. Verify deployment status for the resulting commit and inspect the production edition URL; a successful commit alone is not deployment verification.

On failure, preserve recoverable work and accurately report the failed operation and sanitized diagnostic. Do not claim publication, freshness, or source verification that did not happen. Do not disable this task or edit other automations because an iteration failed. If no worthwhile verified update exists, report no change rather than fabricate an edition. Finish with a short result and the feed URL, naming any material blocker.
