---
title: "Complexity needs to earn rent"
description: "A practical test for deciding whether an abstraction, dependency, or service deserves to stay."
publishedAt: 2026-07-22
tags: [Engineering, Simplicity]
featured: true
---

Every piece of complexity sends an invoice.

Some invoices are obvious: hosting fees, build minutes, or another vendor account. Others arrive quietly as onboarding time, deployment anxiety, indirection, and the small tax of remembering how a thing works six months later.

The question is not whether complexity exists. Useful software always contains some. The question is whether each layer is paying for itself.

## Look for the value on the other side

An abstraction earns its place when it removes more confusion than it creates. A service earns its place when it handles a problem you genuinely have. A framework earns its place when its conventions move the work forward.

Before adding a layer, I try to complete this sentence:

> This makes the system more complicated, but it gives us ___ that we cannot get more simply.

If the blank is vague—“flexibility,” “scale,” “best practice”—the layer probably needs a more concrete defense.

## Count operational concepts

Lines of code are an imperfect measure of complexity. Concepts are often more revealing.

A database introduces schemas, migrations, credentials, connection behavior, backups, and a failure mode. Authentication introduces providers, sessions, callbacks, permissions, and account recovery. Each may be entirely justified, but none is free just because a managed platform makes setup easy.

The same applies inside the codebase. A three-file abstraction around a stable one-line operation may cost more understanding than it saves duplication.

## Prefer reversible decisions

The cheapest architecture is one that can change without drama.

Static content stored as Markdown can move between frameworks. CSS custom properties can outlive a component library. Small components can be combined later; a premature platform usually has to be dismantled.

This does not mean avoiding ambitious technology. It means spending complexity where it creates a visible advantage—and keeping the rest of the system quiet.

## Review the lease

Requirements change, so yesterday's justified complexity may become today's dead weight. Periodically ask what each major layer is doing for the product now.

If the answer is “nothing, but removing it feels wasteful,” remember: the learning is already paid for. You do not need to keep paying rent to prove the work happened.
