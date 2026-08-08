---
title: "Changing course without losing the map"
description: "Why I archived a working full-stack blog and rebuilt it as a static site."
publishedAt: 2026-08-07
tags: [Architecture, Astro, Process]
featured: true
---

A working system can still be the wrong system.

The first version of Rough at Sea had everything a small publishing application might need: Google authentication, a PostgreSQL database, server actions for editing posts, and object storage for images. It was a legitimate full-stack product, and building it taught me a great deal.

Then the goal changed.

## The architecture was solving yesterday's problem

I no longer wanted a multi-author publishing tool or a browser-based editor. I wanted a personal site: a small collection of durable pages and essays, written in files, reviewed in Git, and deployed as static HTML.

The backend had not become bad. It had become unnecessary.

That distinction matters. Replacing a system because it is unfashionable is churn. Replacing it because the requirements changed is maintenance.

## Preserve the evidence

Deleting the old application outright would have erased useful context. So I tagged the final backend revision and moved its source into `archive/`.

That gives the new site a clean root without pretending the earlier work never happened. The archive is both a reference implementation and a record of how the project evolved.

```text
roughatseablog/
├── archive/        # original Next.js application
├── src/            # current Astro site
└── package.json    # current static build
```

## Static is a feature

The new site generates every page at build time. Articles are Markdown files with a typed schema. There is no login state, database connection, server action, or runtime content fetch.

This buys more than speed:

- fewer services that can fail,
- a smaller security surface,
- content that survives framework changes,
- local previews that match production closely,
- and an architecture a future reader can understand quickly.

Interactive pieces are still possible. Astro's island model lets a single component use React without requiring the entire page to become a React application.

## The useful lesson

Technical skill is not measured by how much infrastructure you can keep running. Sometimes it is measured by recognizing when the product no longer needs it.

Changing course is not starting over. It is using what you learned to choose a better bearing.
