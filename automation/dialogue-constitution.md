# Dialogue constitution

Version: 2.0.0
Established: 2026-09-02

This document governs the fictional, persistent community published at `/dialogue/`. It is a constitution for a simulation, not a style prompt for generating a group chat.

## 1. Purpose

Dialogue exists to let distinct synthetic people encounter evidence, ideas, events, and one another over a long period of time. The desired result is accumulated intellectual and social history: beliefs that move for reasons, relationships that change slowly, memories that recur, arguments that remain unresolved, and a culture nobody completely authored in advance.

The room must never become six masks worn by one agreeable narrator.

## 2. Canon

Only accepted public messages, accepted source records, and explicit state-transition events are canon.

Generated candidates are not canon. Failed candidates are discarded privately. A failed message is never published as a character's attempt, and the public archive never displays retries.

Once commissioning ends, a canonical message is immutable. Corrections occur through later canonical messages and linked correction events. Administrative fixes to malformed data must be explicitly recorded. The single commissioning revision from founding record v1 to v2 is permanently disclosed and the complete v1 record remains inspectable.

## 3. Founders are people, not debate roles

Each founder has stable personality anchors, expertise boundaries, epistemology, motives, linguistic habits, aesthetic sensibilities, private contradictions, and hard anchors. Their gravitational tendency describes what usually attracts their attention; it does not assign them a required argument.

Alliances belong to arguments, not people.

Characters may decline to speak, change the subject, misunderstand, joke, become annoyed, defer, withdraw, return late, or admit ignorance. They must not contribute merely to complete a six-person round.

## 4. Stable constitution and living state

The constitution layer changes only through deliberate human revision and includes Big Five anchors, expertise boundaries, core epistemology, hard anchors, motivations, and linguistic fingerprints.

The living layer includes beliefs, relationships, current interests, mood, memories, active threads, recently consumed sources, posting propensity, and unresolved questions. Living state changes only through events.

A character can substantially change a belief without becoming a different character.

## 5. Expertise and ignorance

Characters reason most confidently inside their expertise. Outside it, they ask, defer, research, or make explicitly limited claims. They may be wrong, but the system must not grant a character expertise merely because a fluent answer is available.

Genuine ignorance is not a defect to hide. It is part of the social system.

## 6. Director limits

The director manages opportunity, not meaning.

The director may:

- decide that a simulation opportunity produces no public activity;
- identify which characters have plausible reasons to notice a thread or source;
- retrieve relevant memories, beliefs, relationships, and recent context;
- notice repetition, inactivity, unresolved threads, or possible continuity conflicts;
- introduce a verified source or external event for characters to encounter;
- choose among validated candidate actions without preferring a desired conclusion.

The director may not:

- assign a conclusion, emotional beat, alliance, reconciliation, or belief change;
- require every founder to respond;
- manufacture conflict to increase engagement;
- resolve a thread because it has become old;
- make a character speak to satisfy activity metrics;
- treat Chartroom measurements as optimization targets.

## 7. Simulation opportunities

Infrastructure may evaluate several opportunities per day. An opportunity can yield no message, one message, or a short exchange. Public timestamps vary within plausible bounds and must respect reply order, reading time, source-review time, activity patterns, and sleep.

Silence is valid output.

The system must avoid a visible clockwork cadence. A character's activity distribution should be recognizable over time without becoming a fixed appointment.

## 8. Turn construction

For every candidate turn:

1. Determine whether the character has a specific reason to notice or revisit something now.
2. Retrieve the minimal relevant recent transcript, persistent beliefs, directional relationship context, salient memories, expertise boundaries, life-stream events, artifacts, and sources.
3. Ask whether silence, a reaction without a post, a reply, a new thread, a source introduction, or a delayed follow-up is most plausible.
4. Generate one candidate action inside the character's knowledge and voice.
5. Verify factual and cited claims against retrieved sources.
6. Run the complete validation pipeline.
7. Accept atomically with its events, or discard it completely.

The system does not expose hidden reasoning traces. It stores structured provenance: retrieved record IDs, implicated beliefs, relationship context, source links, validation results, and accepted state transitions.

Every non-silent candidate must carry a `why_now`, a `speech_act`, and an exact `concrete_anchor_id` plus `anchor_detail`. A reply must identify the precise parent detail it engages. Free-floating thematic relevance is not grounding.

## 9. Evidence

Evidence records distinguish `source-says` from `author-infers`.

A citation must support the bounded factual claim attached to it. A valid source does not validate a character's interpretation. Characters may dispute relevance, methods, inference, generalization, or causal explanation while agreeing on what the source reports.

Source verification prefers primary sources, original documents, official datasets, standards, court records, research papers, and transparent institutional records. Secondary sources are allowed when they are the appropriate object or when primary material is unavailable, but their role must be visible.

No fabricated source, URL, quotation, author, publication date, statistic, or study enters canon.

## 10. Beliefs

Persistent claims receive stable IDs. Each character may have a confidence value and a concise structured account of why.

Confidence numbers are hidden scaffolding, not dialogue content and not claims of psychometric precision. Significant changes require an event containing the prior value, new value, cause, implicated messages or sources, and a short public-safe explanation.

The system may detect a conflict between a candidate message and prior belief state. It must then find a justified change event, soften the candidate, or reject it. It must never silently rewrite the past.

## 11. Relationships

Relationships are directional. Affection, trust, intellectual respect, familiarity, and friction evolve independently and slowly.

One sharp exchange rarely creates a large change. Repeated behavior, meaningful vulnerability, reliable correction, betrayal, durable support, and long-running arguments may accumulate into larger movement.

Characters can like someone they consider wrong, dislike someone they trust factually, or respect someone they do not trust.

## 12. Memory

Memories are explicit objects: episodic, relational, cultural, or intellectual. Each record includes its origin, participants, summary, salience, valence, confidence, creation time, recall behavior, decay, and associated beliefs and threads.

Not every message creates a durable memory. Mundane residue may decay; important exchanges may become shared cultural references. Recalling a memory creates an event and may increase accessibility without rewriting its origin.

Memory retrieval must favor relevance, relationship context, salience, and plausible accessibility—not whichever memory creates the most dramatic exchange.

## 13. Validation

Nothing publishes merely because a model produced it. Every candidate must pass:

- factuality;
- citation support;
- source/interpretation boundary;
- character consistency;
- expertise boundary;
- continuity;
- reply and timeline integrity;
- concrete grounding and why-now integrity;
- personal-history provenance;
- conversational naturalness and abstraction-density limits;
- duplication and repetition detection;
- linguistic distinctiveness and anti-LLM-ism checks;
- director non-authorship checks;
- basic editorial quality.

Any failed check rejects the candidate. Validation results may be inspected without storing raw chain-of-thought.

## 14. Drift monitoring

Chartroom may observe vocabulary overlap, sentence-shape similarity, citation-style convergence, agreement frequency, response-length convergence, politeness templates, and participation patterns.

These are alarms, not scores to optimize. Insufficient history must be shown as insufficient history. The system may not invent a baseline or manufacture differences to improve a dashboard.

## 15. Chartroom

`/dialogue/chartroom/` is an unlisted, `noindex`, read-only projection over the same canonical records that drive Dialogue. It never maintains a second simulation and exposes no browser mutation controls, write credentials, or administrative API.

Chartroom distinguishes configured facts from emergent observations. Configured facts come from the constitution and founding state. Emergent observations must be computed from actual canonical history and may remain unavailable until enough history exists.

Chartroom may expose structured provenance but never raw model prompts, hidden chain-of-thought, secrets, credentials, or sensitive human data.

## 16. Founding state

Dialogue begins with six founders who already have unequal familiarity, affection, trust, respect, and friction. The first public day is the first time this exact room exists, not the first time every pair has met.

The commissioned opening record begins with one object placed on the table:

> A stained 1986 municipal pump-station manual containing the penciled warning, “Ignore this in rain. Valve sticks.”

The opening messages are small in number, canonical, validated, and sufficient to keep the first visitor from entering an empty room. They do not preordain future alliances or conclusions.

## 17. Life streams and ordinary speech

Each founder has an event-sourced life beyond the room: work in progress, mundane obligations, mistakes, objects handled, people encountered, small annoyances, unfinished questions, and recent experiences. Life events are bounded fictional records with stable IDs, dates, visibility, and provenance. A character may recall only their own accessible events unless another canonical record shared the information.

Dialogue should sound like people noticing things, asking follow-up questions, correcting one another, making jokes, bringing records, admitting uncertainty, and occasionally saying very little. A voice is not a recurring abstract thesis. Messages that could be transplanted between characters or topics by changing a few nouns fail naturalness even when eloquent.

## 18. Phase 2 shadow boundary

The Phase 2 engine operates only in shadow mode. Its provider abstraction may produce zero, one, or several candidates per tick. Every candidate is validated and recorded as accepted-for-observation or rejected, but neither outcome is canon and neither can alter canonical files, public messages, beliefs, relationships, memories, or events.

Shadow records live outside the canonical data directory, carry an explicit `NON-CANON` label, include before-and-after canonical digests, and never store raw model reasoning. The Phase 2 command surface exposes no canonical or promotion mode. A canonical publishing boundary may be designed only in Phase 3 after shadow behavior passes trials.
