# The Pixel Archive — daily publication instructions
Repository: roughatsea/roughatseablog, branch main. Website: https://www.roughatsea.com/pixel-art/
Mission: Publish one researched, original, 250–400 word feature on a pixel art game each day. Balance the owner's tastes (atmospheric worlds, evocative art, JRPGs, inventive design and unusual storytelling) with unexpectedly wonderful discoveries (experimental browser games, jam entries, strange genres, small developers, international scenes). Avoid mechanically alternating if editorial quality argues otherwise; aim roughly half familiar and half unexpected across the last 14 entries. Avoid becoming a Steam-only feed.

## Before each issue
Read this file and src/data/pixel-archive/games.json on fresh GitHub main. Read experiments/style_guide.md and experiments/unintroduced_referents.md. Scan all existing titles, developer names, links, slugs, and recent lanes to avoid repeats. Research several candidates via broad web discovery: itch.io, Steam, GOG, PICO-8, Newgrounds, developer websites, game jams, international indie gaming, etc. Find at least one strong game not yet covered. Verify its existence, developer, release/availability status, official URL, meaningful gameplay specifics, and that it really uses pixel art, preferably through primary sources. Do not claim to have played it. Do not invent impressions, quotes, dates, mechanics, or images. Do not make every title sound like a masterpiece. Distinguish unreleased, demo, early access, free, discontinued, and fully released status. Favor the actual artist and developer's work.

## Imagery — editorial house style (2026-11-03)
Every new game feature should have **one freshly generated, original dreamy painterly editorial illustration** inspired by the game's *verified* atmosphere, themes, and premise. This is the Pixel Archive house style. Rich but subject-appropriate color, expressive brushwork, soft atmospheric depth, and evocative compositions are preferred. Vary subject, scale, lighting, palette, camera angle, and composition across entries: do not default to solitary travelers gazing at landscapes; horror may be unsettling and comedy playful. Never invent specific claims about gameplay in accompanying prose based on the generated image. Do not replicate a screenshot, logo, specific original character design, or protected promotional art.

Generate a real raster image with a supported image-generation tool. Inspect the generated image, and commit the actual image bytes under a distinct local path such as `public/images/pixel-archive/<slug>-editorial.webp` or `.png` through GitHub. Before publication, inspect the actual committed binary: verify it decodes, is at least 1200 pixels wide (prefer native 1448 pixels or more), and has sufficient fidelity for a full-width hero image. An implausibly tiny AVIF/WebP file (for example, below 50 KB for a richly detailed 1200px painting) requires close scrutiny and should be rejected in favor of a properly encoded original. Do not upscale a low-resolution asset and call it high resolution. Preserve the original generated image detail and use a new filename when replacing an image to avoid stale browser caches. Verify the committed asset exists and renders; no empty URLs, remote hotlinks, recycled art, fake placeholders, text-only SVG stand-ins, or links to model-session files. If generation, binary transfer, permissions, or verification fails, report the blocker honestly and do not claim the illustrated feature was completed. Do not quietly publish a feature without the required image.

Set `image` to the committed asset path. Set `imageAlt` to a factual description of the **generated editorial illustration** (not a claim about actual gameplay). Set `imageCredit` to exactly `AI-generated editorial concept art — not official game artwork or gameplay`. Show this disclosure visibly on archive cards and next to the full-size image on each article, not only in alt text or metadata. Every article must retain the direct official game link so readers can inspect real game art. Clearly reusable official screenshots may be linked or included as secondary reference media with attribution, but do not substitute them for the original editorial hero illustration. Respect image copyright and attribution.

## Structured records
Append one new object to src/data/pixel-archive/games.json. Fields:
- date: YYYY-MM-DD in America/Phoenix
- slug: unique lowercase hyphenated game name
- title: official name
- developer: verified name
- description: accurate concise hook (~20–35 words)
- lane: "familiar" or "unexpected"
- genres: array of plain genre strings
- releaseStatus: verified human-readable status
- image: optional locally licensed image path or approved durable official URL; empty string if unavailable
- imageAlt: accessible factual screenshot description
- imageCredit: attribution
- article: array of 3–6 original paragraphs totaling 250–400 words, including what it is, gameplay, how pixel art contributes, one notable verified detail, and who might enjoy it. Avoid spoilers and generic praise.
- links: array of objects {label,url} pointing to one or more verified official sources; include a storefront/demo/developer link.
All prose is original and accessible to an intelligent teenager. No hype invented to fill the word count.

One day = one game. Same-date rerun should inspect existing record and improve it, not append another. Do not publish a duplicate game under an alternate spelling or platform edition. When an external source cannot be verified, choose another candidate. Preserve all existing entries and unrelated site content. Commit directly to main through the GitHub connector, never Vercel, and verify the latest committed data afterwards. If GitHub permissions or validation fail, report failure accurately rather than claim publication. Do not create any Instagram content. Do not add these entries to the long-form homepage.
