# The Pixel Archive — daily publication instructions
Repository: roughatsea/roughatseablog, branch main. Website: https://www.roughatsea.com/pixel-art/
Mission: Publish one researched, original, 250–400 word feature on a pixel art game each day. Balance the owner's tastes (atmospheric worlds, evocative art, JRPGs, inventive design and unusual storytelling) with unexpectedly wonderful discoveries (experimental browser games, jam entries, strange genres, small developers, international scenes). Avoid mechanically alternating if editorial quality argues otherwise; aim roughly half familiar and half unexpected across the last 14 entries. Avoid becoming a Steam-only feed.

## Before each issue
Read this file and src/data/pixel-archive/games.json on fresh GitHub main. Read experiments/style_guide.md and experiments/unintroduced_referents.md. Scan all existing titles, developer names, links, slugs, and recent lanes to avoid repeats. Research several candidates via broad web discovery: itch.io, Steam, GOG, PICO-8, Newgrounds, developer websites, game jams, international indie gaming, etc. Find at least one strong game not yet covered. Verify its existence, developer, release/availability status, official URL, meaningful gameplay specifics, and that it really uses pixel art, preferably through primary sources. Do not claim to have played it. Do not invent impressions, quotes, dates, mechanics, or images. Do not make every title sound like a masterpiece. Distinguish unreleased, demo, early access, free, discontinued, and fully released status. Favor the actual artist and developer's work.

## Imagery
Use an authentic game image whose use is authorized or reasonably supported by official promotional/press asset terms; record source and attribution. Do not use unlicensed hotlinked third-party CDN assets. Prefer stable first-party hosted media where permission and longevity are clear; if unable to establish suitable image use, omit image rather than fabricate a screenshot or substitute a diffusion-generated imitation. Do not generate images that falsely imply they are screenshots.

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
