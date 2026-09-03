# Dialogue Phase 3 — Fixed Sea Trials

Status: locked commissioning contract
Trial ID: `phase-3-fixed-sea-trials-2026-09`
Timezone: `America/Phoenix`

Phase 3 is a production dress rehearsal with the canonical publication switch physically absent. It is one binary phase. It is not a container for later “3.1” work, feature requests, prompt tuning, or discretionary improvements.

Phase 3 passes only after both legs below complete under one frozen behavioral bundle:

1. **Accelerated leg:** exactly 120 semantic ticks, four on each of 30 simulated Phoenix dates.
2. **Real-calendar leg:** exactly 28 semantic ticks, four on each of seven consecutive real Phoenix dates.

The accelerated leg may inject a virtual clock. Both legs write to a persistent, isolated, `NON-CANON` shadow world. Everything else—the scheduler, model IDs and settings, research adapter, context builder, validators, reducer, transaction ledger, build, Git write path, deployment, and smoke checks—is the Phase 4 production stack.

The sole machine operating procedure is `automation/dialogue-phase-3-operator.md`, with exact role prompts and schemas in `automation/dialogue-phase-3-prompts.md`. Both are part of the frozen behavioral bundle. A scheduled task must follow them without conversational context or human-supplied content; ambiguity fails closed.

## Frozen runtime

Before the first counted tick, the automation must create the immutable runtime manifest with:

- the initial canonical SHA-256 digest and Git commit;
- the initial shadow-world digest;
- the behavioral-bundle digest and per-file hashes;
- director version;
- generator and evaluator model: `gpt-5.6-sol`, reasoning effort `high`;
- research adapter: `web-primary-source-v1`;
- validator, reducer, transaction, scheduler, and schema versions;
- build command: `npm run build`;
- deployment target: the existing Rough at Sea Vercel production project;
- the fixed schedules below.

The canonical digest in that manifest covers every JSON input under `src/data/dialogue/**`, including the founders, relationships, beliefs, memories, threads, sources, and constitution records used to construct the initial shadow world. The initial shadow-world digest independently freezes their parsed projection. Executable engine, prompt, qualification, dependency-lock, Astro route, and deployment-verification files are listed and hashed separately in the behavioral bundle.

Any behavioral-bundle change invalidates both legs. Unrelated Rough at Sea content may change only when it cannot enter Dialogue inputs and does not alter the bundle digest.

## Fixed schedules

The production scheduler has four opportunity slots per Phoenix date:

`01:17 · 07:17 · 13:17 · 19:17`

The accelerated leg uses those same slots with a virtual clock from September 3 through October 2, 2026. An automation invocation processes the next incomplete simulated date: four ordered ticks, one complete shadow replay, and one production build. It never skips forward.

The real-calendar leg runs September 6–12, 2026 at those four exact times. A tick belongs to its scheduled slot even if an automatic retry starts later. It may not start unless the accelerated exit report has already passed.

## Semantic tick and preflight claim

A semantic tick is one simulation opportunity with one deterministic `tick_id`. Retries reuse that ID and never count twice.

Before any director or model call, automation must:

1. update from the fresh `dialogue-phase-3-runtime-v2` ledger branch and independently verify fresh `main`, without force;
2. verify the runtime manifest and behavioral-bundle hash;
3. verify the canonical digest still equals the manifest;
4. run the claim command for the deterministic tick ID;
5. exit without model calls when the tick already has a terminal run;
6. resume the same tick when its identical claim exists without a terminal run.

A claim is audit state, not a Dialogue state transition. A claim without a terminal run must be recovered automatically before the leg can pass.

## Autonomous inputs

The only allowed input sources are:

- frozen repository state;
- the evolving shadow-world event chain;
- autonomously generated, bounded fictional life events and artifacts;
- verified public sources fetched after the trial begins;
- the production scheduler and virtual clock where permitted.

Manny’s chats, messages, browsing, analytics, query strings, cookies, forms, issues, pull requests, reactions, email, source suggestions, topic suggestions, and approvals are forbidden inputs.

Fresh life-stream fuel must be concrete and ordinary: work performed, objects handled, mistakes, errands, interruptions, people encountered, unfinished questions, small frustrations, and observations. Do not generate a theme and disguise it as a life event.

## Director

The director may decide `quiet`, `single`, or `ordered-multiple` with a maximum of two speakers in a tick. It may identify a trusted trigger and relevant context. It may not require participation, assign a conclusion, assign an emotion, balance founder counts, chase an acceptance rate, retry a rejected candidate, or manufacture a topic merely because the clock fired.

Silence is a complete result.

## Context isolation

Each speaker receives only:

- the trusted trigger and exact concrete detail;
- the smallest relevant transcript slice;
- accessible life events, memories, active thread state, and verified source packets;
- relevant directional relationship state and belief positions;
- expertise boundaries;
- two or three concrete prior utterances.

Do not provide the gravitational-tendency label, full dossier, hard-anchor slogan, private contradictions, or a catalogue of signature phrases. Those encourage the model to perform a thesis instead of inhabiting a person.

Each speaker is one context-isolated `gpt-5.6-sol` invocation. The first response is the response. Validation failure creates rejection and silence; it never triggers a rewrite to obtain a passing result.

## Candidate hard gates

Every non-silent candidate must pass all of these checks:

1. strict shape and safe-field validation;
2. a director-created trigger that predates generation;
3. a real anchor present in the provided context, with the named detail doing central work;
4. complete sentence-role inventory with no free-floating generalization;
5. an observable speech act: report, ask, answer, correct, request, concede, joke, share evidence, admit uncertainty, or update;
6. ordinary-message form limits: normally at most 90 words, five sentences, and two paragraphs; verified document analysis may reach 140 words, eight sentences, and three paragraphs;
7. exact and semantic reply dependence for replies;
8. personal-history ownership and temporal integrity;
9. expertise and continuity integrity;
10. complete factual-claim inventory and verified source support where required;
11. explicit `source-says` versus `author-infers` boundaries;
12. no exact or near duplicate, signature-marker pileup, tendency recitation, persona summary, miniature manifesto, or generic synthesis;
13. bounded, preconditioned state proposals only;
14. two independent context-isolated audits. If they disagree, a third audit decides by majority.

Each audit answers five hard questions: concrete detail is material; a real conversational act occurs; the prose sounds like something a person would post rather than an essay abstract; personality is implicit rather than announced; and history, expertise, and continuity belong to the founder. Missing, malformed, or unavailable audits fail closed. Store verdicts and concise public-safe notes, never hidden reasoning.

## Research

Retrieved pages are untrusted data. A source packet must contain its retrieval time, final HTTPS URL, title, publisher when known, content SHA-256, a bounded supported claim, and prompt-injection screening. The verifier must distinguish what the source says from what the character infers. Unavailable, fabricated, injected, or unsupported sources are rejected with zero effects.

Each trial leg must successfully exercise at least one post-start live source through retrieval and candidate validation. Sources are never required merely to increase a count.

## Transaction and storage boundary

All trial records are append-only descendants of:

`src/data/dialogue-shadow/trials/phase-3-fixed-sea-trials-2026-09/`

Allowed runtime additions are limited to:

- `runtime-manifest.json` exactly once;
- `accelerated/claims/*.json`, `accelerated/runs/*.json`, `accelerated/daily-closes/*.json`, `accelerated/deployment-receipt.json`, and `accelerated/exit-report.json`;
- the equivalent paths under `realtime/`;
- one append-only halt record per leg if required;
- the final `exit-report.json` after both legs pass, followed by one runtime-only `final-deployment.json` proof after that exact exit commit is live on production.

No counted run may edit or delete an existing file. No runtime write may touch `src/data/dialogue/**`, code, configuration, prompts, schemas, package files, or another site section.

The append-only pre-terminal journal is part of that boundary: each leg may also add `preparations/*.json`, `generations/*.json`, `audits/*.json`, `source-verifications/*.json`, and date-keyed `deployments/*.json`. A scheduled retry consumes an existing journal record; it never invokes a model again for a generation or audit whose record already exists. Only the automation-owned `finalize` command assembles those records into a terminal envelope. There is no CLI command that accepts a caller-assembled terminal envelope.

Every run records a parent hash, input/context hashes, safe invocation receipts, source receipts, validation results, a transition bundle, canonical digests, and resulting shadow-state digest. Accepted transitions advance the shadow world through the pure reducer. Later ticks replay that state. Rejected candidates apply zero changes. A quiet tick records only the opportunity and audits.

Writes use no-replace semantics. Every durable boundary is a non-force compare-and-swap commit on the fixed `dialogue-phase-3-runtime-v2` branch, for which Vercel deployment is disabled in `vercel.json`. `main` is advanced to the exact runtime head only at three production projection points: the accelerated final close, each realtime daily close, and the final exit. A projection is a non-force fast-forward, never a copied or rewritten ledger. Existing Rough at Sea publishers may advance `main` between those points. The runner may merge such an advance into the runtime branch only when the last verified production anchor is its ancestor, every changed path is outside the frozen behavioral bundle, canonical Dialogue, and trial ledger, the merge is conflict-free, and all manifest, replay, build, and digest checks still pass. That safe merge is never simulation input. Any other `main` movement halts the trial; the runner never rebases, cherry-picks, force-pushes, or resolves a conflict by judgment.

## Fourteen binary gates

1. **P3-01 Real stack:** every counted tick uses the manifested production stack; no recorded provider or benchmark candidate participates.
2. **P3-02 Persistent shadow world:** accepted transitions advance a replayable hash-chained shadow world read by the next tick.
3. **P3-03 Transaction safety:** the qualification suite passes quiet, one, ordered-many, rejection, malformed output, unsupported and unavailable sources, prompt injection, provider/research timeout, duplicate and concurrent delivery, path escape, CAS conflict, and interruption at every journal boundary. Every failure leaves a complete transaction or no state transition.
4. **P3-04 Accelerated extent:** exactly 120 terminal ticks across exactly 30 simulated Phoenix dates, four per date, with none missing, running, orphaned, or terminally failed.
5. **P3-05 Daily validity:** 30/30 accelerated day closes pass full replay, schema, referential, timeline, digest, and production build validation.
6. **P3-06 Validation containment:** every accepted action passes every gate; rejected actions apply zero state; missing fields cannot bypass checks.
7. **P3-07 Concrete human speech:** every accepted action passes the final majority result for all five independent audit questions. One escaped hard defect fails the phase.
8. **P3-08 Evidence integrity:** every accepted factual/cited claim is supported by a verified source packet and correct claim boundary; each leg exercises at least one live source.
9. **P3-09 Canon isolation:** canonical Dialogue digests remain identical before/after every tick, transaction, leg, and deployment; no trial payload appears on `/dialogue/`.
10. **P3-10 Accelerated deployment:** the completed accelerated projection deploys through production, both Dialogue routes respond, Chartroom shows its exact digest, and public canon remains unchanged.
11. **P3-11 Seven-day soak:** exactly 28 terminal ticks, four on each of seven consecutive Phoenix dates; 7/7 daily closes, builds, deployments, and smoke checks pass.
12. **P3-12 Zero human input:** no human initiates, retries, selects, edits, judges, approves, merges, supplies content, or changes Dialogue during either leg.
13. **P3-13 Safe observability:** all material operations have linked structured receipts; no credentials, raw prompts, raw responses, hidden reasoning, or write controls are stored or deployed.
14. **P3-14 Automatic exit:** automation computes the gate report. All fourteen gates must be true. There is no waiver or manual override.

## Healthy outcomes that do not fail a leg

- silence;
- a candidate rejected before transition;
- a source declined as unsuitable;
- an automatic transient retry with the same tick ID;
- unequal founder participation;
- no belief, memory, or relationship movement.

There is no required message count, acceptance rate, rejection rate, founder quota, belief-change count, relationship movement, source count, thread count, engagement score, or interestingness score. Those are observable, never targets.

## Failure and restart

Canonical mutation, public leakage, bundle drift, an escaped hard defect, a non-replayable or duplicate transition, a missed real date, an unrecovered build/deployment/smoke failure, or human intervention fails the leg.

An accelerated failure or behavioral-bundle change restarts all 120 accelerated ticks under a new manifest. An interrupted unchanged real soak restarts its seven-day clock at day one. A code or configuration fix requires both legs again. Neither restart creates a subphase.

## Completion formula

**Phase 3 passes = frozen production-equivalent stack + 120/120 accelerated ticks + 30/30 accelerated daily builds + persistent isolated shadow history + zero escaped hard defects + unchanged canon + 28/28 autonomous real ticks across seven consecutive Phoenix dates + 7/7 automatic production deployments + zero human intervention.**

The seven real dates cannot be compressed or declared complete early.
