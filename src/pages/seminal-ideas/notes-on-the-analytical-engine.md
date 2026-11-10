---
layout: ../../layouts/SeminalIdeasLayout.astro
title: Notes on the Analytical Engine
description: How can a machine that manipulates numbers work on something besides quantity? Read Lovelace on operations, representation, stored values, repeated procedures, and the limits of mechanical execution.
author: Ada Lovelace
thinker: lovelace
discipline: Computing, mathematics, and philosophy of technology
year: 1843
updated: '2026-11-06'
---

*Edition and scope: “Notes on the Analytical Engine” is this catalogue’s short descriptive title for Ada Lovelace’s “Notes by the Translator,” appended to her English translation of L. F. Menabrea’s Sketch of the Analytical Engine invented by Charles Babbage, Esq. Menabrea’s French memoir appeared in the Bibliothèque Universelle de Genève in 1842; the English translation and Notes A–G appeared in Scientific Memoirs, volume 3 (1843), pp. 666–731. Those pages identify the combined publication, not the Notes alone. The lesson uses Christopher D. Green’s York University transcription. The close reading centers on A, B, C, the opening explanations of D, and G. The Notes are Lovelace’s English writing, distinct from the French memoir she translated. References use note letters and named passages; the electronic reproduction includes editorial interventions in mathematical notation and image-based diagrams, so its screen positions are not treated as printed pagination. This is a conceptual guide, not a reconstruction or execution of the complete historical program. Modern examples and evaluations are editorial.*

## Orientation

Suppose a machine can add two numbers. That tells us one thing it can do. It does not yet tell us which numbers to add, where the result should go, what should happen next, or what the numbers stand for.

Ada Lovelace’s 1843 Notes make those further questions central. The subject is Charles Babbage’s proposed Analytical Engine, a mechanical computing design directed by punched cards. Lovelace distinguishes operations from the things operated on, explains how results can become inputs to later steps, and considers what follows if number represents something other than quantity.

The Notes also resist extravagant expectations. A mechanism’s ability to carry out instructions does not guarantee that the instructions are right. A proposed capacity is not the same as an implemented machine. And an unfamiliar result is not automatically evidence that a machine originated its own purpose.

**The lasting question:** What must we specify before a general capability becomes a dependable procedure?

**The essential limit:** The complete Analytical Engine described here was not built. We are reading a mathematical and technological proposal, not a report of a successful 1843 execution. Its importance does not require pretending that Lovelace settled the limits of every future computer.

## Core lesson

### Operations, data, and the order of work

**An operation is a rule for transforming or relating things. Data are the particular values supplied to a procedure.** Adding is an operation; 7 and 12 can be its data. Lovelace gives operation an unusually broad definition in Note A, extending beyond numerical quantities. Start with arithmetic before following that extension.

She contrasts the Difference Engine’s specialized procedure for making numerical tables with the more varied sequences intended for the Analytical Engine. Her central distinction concerns how operations are arranged and directed, rather than simply how fast a machine calculates. [A, opening comparison of the engines and the discussion distinguishing operations from their objects.](#sources)

**A program, in our modern vocabulary, is an organized specification of what a machine should do.** Lovelace describes different classes of cards with different jobs. Operation-cards determine the kind and succession of operations. Variable-cards direct which stored values supply an operation and where its result is received. Note A’s footnote also distinguishes Number-cards. We should not compress all these functions into an undifferentiated command to calculate.

Here is the reasoning reconstructed:

1. The same operation can act on many different values.
2. The same values can enter many different expressions.
3. Specifying the available operations therefore does not specify a particular calculation.
4. We must also determine their order, their operands, and the destinations of results.
5. Separating those decisions makes it possible to inspect and vary a procedure.

An **operand** is a value on which an operation acts. The term lets us ask a precise question: are the wrong results caused by the wrong operation or by supplying the wrong operands?

**Editorial example:** With inputs 3 and 4, adding and then doubling gives 14. Doubling each input and then adding also gives 14. Squaring the sum gives 49; summing the squares gives 25. A verbal instruction to “combine the numbers and square” is inadequate unless its order and grouping are made clear. These are our examples, not Lovelace’s card sequences.

**Takeaway:** A list of capabilities is not an explanation of a procedure. To understand a result, trace the order of work and the values used at each step.

### Representation beyond quantity

**A representation is an arrangement in which one thing stands for another under an agreed interpretation.** A number might represent how many objects exist, but it could instead identify a pitch or another feature.

Note A argues that the engine could act on things besides number if their relevant relations could be expressed in the required form and adapted to the engine’s notation and mechanism. Lovelace’s example is music. Her claim is conditional: if the relations of pitched sounds and composition could be expressed appropriately, the engine might produce elaborate music. [A, the definition of operation and the passage on pitched sounds.](#sources)

The argument can be reconstructed without attributing musical judgment to a gear:

1. Identify relations in a subject that can be expressed through formal rules.
2. Establish a representation that lets the machine operate on those relations.
3. Arrange operations that preserve the intended correspondence.
4. Interpret the resulting representation back in that subject.

**Editorial example:** A semitone is the interval between adjacent pitches in the standard twelve-step division of an octave. Assign consecutive numbers to successive semitone steps. Add 2 to each pitch-number in a melody to move every represented pitch up two semitones. The machine performs addition. A listener may hear a transposition because the encoding connects numerical differences to pitch intervals. Duration, loudness, tuning, and instrumental range would need additional treatment; our small encoding does not capture all of music.

The important condition is preservation of the relevant relation. If numbers merely identify recordings in a library, adding 2 to an identifier does not reliably transpose a song. A numerical label and a meaningful numerical structure are different achievements.

Lovelace’s passage opens a wider conception of computation, but it does not demonstrate that every quality of music has been formalized or that a machine thereby experiences a melody. Nor does it describe modern audio hardware. The durable insight concerns the relation between an encoding, an operation, and an interpretation.

### Stored values and changing state

**State means the values a system holds at a particular point in a process.** A calculation unfolds through states. Its intermediate values matter even when only the final answer is printed.

In Note B, Lovelace explains the engine’s numbered columns, called Variables with a capital V. The label identifies a place whose value may change; it does not mean the column can hold only what algebra calls a variable rather than a constant. She distinguishes the location from what it currently contains. [B, the storehouse and explanation of Variable-columns.]

Note D distinguishes columns used for inputs, final results, and temporary working values. These are roles in a calculation, not eternally separate kinds of thing: a result can later become an input. Some values must be retained for another use; others can be cleared. [D, opening classification and the Retaining and Zero Supply-cards.](#sources)

**Editorial example:** A small procedure computes the squares of three values and accumulates their sum.

| Step | Current input | Temporary square | Running total |
| --- | ---: | ---: | ---: |
| Start | — | — | 0 |
| First value | 2 | 4 | 4 |
| Second value | 3 | 9 | 13 |
| Third value | 4 | 16 | 29 |

The temporary square is replaced each time. The total retains the contribution of previous steps. If we overwrite the total before adding the new square, the intended information is lost. If we start a fresh calculation without resetting it, the previous run contaminates the next.

This table is an editorial trace of a simple procedure, not a reduced copy of Lovelace’s Bernoulli table. It illustrates why a description must say what persists, what changes, and what is cleared.

Lovelace also distinguishes explanatory inscriptions below her diagrams from the mechanism that actually directs the engine. A formula written for an observer does not itself make the machine perform it. The cards must establish the required action. [B, closing discussion of inscriptions as memorandums.](#sources)

**Takeaway:** Naming a result does not establish how it was produced. Inspect the transitions that connect the initial values to the final state.

### Cycles and reusable procedures

**A cycle is a group of operations repeated under a specified arrangement. A loop is the modern programming term for a repeated part of a procedure.** Repetition becomes useful when each pass can act on a changed state.

Note C explains backing the cards so a card or group can return to use. Note G makes repetition visible in a substantial example. Lovelace describes computing **Bernoulli numbers**, a sequence of rational constants—numbers expressible as fractions of integers—used in mathematical analysis. A **recurrence** expresses a later term using earlier ones. Her chosen procedure uses previously obtained Bernoulli numbers in computing the next. [C; G, formula (8), the successive computations, and the numbered operations.](#sources)

The historical numbering requires care. Her displayed example computes what she calls B7, using B1, B3, and B5 as previously supplied results. Do not silently substitute a modern table’s indexing. Her aim is to exhibit the engine’s powers through a demanding example; she explicitly says she has not chosen the simplest computation merely for ease.

In G’s explanation of the recurring group of Operations 13–23, the same column locations generally serve again while the values on them change. There are specified changes in which earlier result is drawn upon. She also describes preparing for the next calculation by retaining its result, clearing working values, and increasing the controlling quantity. Repetition involves organized change rather than starting from an identical state forever.

**Editorial continuation:** In our square-sum example, the repeated body says: read the next input, multiply it by itself, add the square to the total. The three iterations produce different totals because the input and accumulated state differ. The rule can remain short while the list of inputs grows.

A **stopping condition** specifies when repetition ends. Without one—or without the state change that eventually satisfies it—a repeated procedure may never produce the intended completed result. Lovelace’s Note G describes decisions between courses based on computed values; this guide does not claim to have reconstructed the complete card-control mechanism from that description.

**Takeaway:** When someone says “repeat,” ask what changes, what remains fixed, what earlier results are needed, and what ends the repetition.

### Execution, error, and the limits of a claim

**Correct execution means carrying out the specified procedure. Correct specification means that the procedure actually serves the intended problem.** Those can come apart.

Note A acknowledges that even an unerring mechanism could receive wrong orders from its cards. A repeated process can reproduce a mistake with great consistency. The promise of reducing manual error does not remove the need to examine the instructions. [A, the objection about erroneous operative data.](#sources)

**Editorial example:** A program correctly sums all invoice amounts, but the intended task was to total only unpaid invoices. The addition may be flawless. The selection rule is wrong. A second program could implement the correct rule using data in which paid invoices are mislabeled. These are separate failures: procedure and input.

Note G begins by warning against exaggerated expectations followed by an equally excessive disappointment. Its famous statement is:

> “It can do whatever we know how to order it to perform.”

The subject is the proposed Analytical Engine. The surrounding passage denies it the power to originate analytical truths while allowing an indirect influence on discovery: reorganizing mathematics for mechanical execution might make its relations clearer to people. [G, opening paragraphs.](#sources)

We should preserve the difference between following specified operations, foreseeing every consequence, and originating a purpose. A human can specify a method without already knowing its final result. Calling that result surprising does not by itself prove that the machine supplied its own goal. Conversely, pointing to rules does not by itself settle every philosophical question about creativity.

Lovelace also says that practical confidence in the engine’s full powers ultimately requires its actual existence and experience of its results. That qualification limits the sweeping language about unlimited extent elsewhere in the Notes. It deserves to remain beside the ambition.

## Deep exploration

### Reading the Bernoulli example without pretending to execute it

The formidable notation can hide a recognizable structure. Lovelace takes a mathematical relation, identifies required values, distributes work across storage locations, and explains repeated operations.

| Part of Note G | What it contributes | What not to assume |
| --- | --- | --- |
| Formulae leading to (8) and its abbreviated form (9) | A relation from which a later number can be determined using earlier ones. | A mathematical identity is already a complete machine procedure. |
| Example with n = 4 | A concrete stage within a continuing sequence. | The earlier numbers have no history or can be omitted. |
| Input, working, and result columns | Places and roles for values during the computation. | A location’s unchanged name means its value is unchanged. |
| Repeated operations and card discussion | A compact way to express work that grows with the problem. | A fixed number of distinct cards means constant execution time. |
| Clearing and preparation for the next number | A transition from one completed computation into the next. | Printing one correct answer establishes correct repeated use. |

The last two distinctions are particularly useful. A short procedure can demand a long execution. A calculation that works in isolation can fail in a sequence if it leaves the wrong state behind.

The source’s formulae use a historical indexing convention and some are images. This lesson explains the architecture of the example from the prose and numbered operations; it does not certify every entry of the diagram, supply an executable transcription, or derive a modern Bernoulli-number implementation. A numerical implementation would need separate checking of notation, signs, storage, and precision.

### A small invariant you can check yourself

**An invariant is a statement that remains true at a chosen stage of every pass through a procedure.** This is a modern editorial tool for examining our example, not terminology attributed to Lovelace.

After each completed pass through the square-sum procedure, the total should equal the sum of the squares of all inputs processed so far. Before any inputs, zero satisfies that statement. Processing a new value and adding its square preserves it.

The reasoning has three pieces. Establish the statement at the beginning. Show why one pass preserves it. Then use the stopping condition to connect the statement to the desired result. When all inputs have been processed, the invariant says the total is the complete square-sum.

Try changing the update to “replace the total with the new square.” The first pass still looks correct. The invariant fails after the second pass, since 9 omits the earlier 4. A single successful first step did not test the intended accumulation.

This gives a practical extension of Lovelace’s emphasis on tracing substitutions: explain why intermediate states justify the final claim. The exact method of proof here is ours. It should not be retroactively credited to the Notes as a fully stated theory of program verification.

### A general design still has finite resources

Note B explicitly connects the range of numbers a column can represent to its number of discs. Note G’s footnote on limits says the engine operates through finite increments and decrements. Those qualifications matter when the surrounding prose speaks of indefinite extension.

**Generality** can mean that the same organized method applies to many cases. It need not mean that one physical machine has infinite storage, represents every real number exactly, or finishes every conceivable task.

**Editorial example:** The square-sum method can be described for a list of any finite length. A particular device still needs time to read it, room to store the current values, and a way to represent the total. Repeatedly multiplying integers can exceed a chosen storage range. A method’s brevity does not remove that limitation.

Nor do we get an exact theory of all computable functions from the Notes’ expansive phrases. The lesson reads those phrases as part of a technological argument, not a later mathematical proof about the boundaries of computation. Establishing those boundaries requires definitions and arguments not supplied here.

### Does representation imply understanding?

A machine that changes encoded pitches can preserve an interval relation without knowing what a tune means to a listener. But it would also be too quick to infer that all possible machine understanding has been disproved.

The safer argument concerns what has actually been established. An encoding and a rule can show how a particular transformation is performed. They do not by themselves establish subjective experience, semantic understanding, aesthetic success, or an independent purpose. Each additional claim needs a stated criterion and relevant support.

Lovelace’s music example is valuable precisely because it separates a possible computational scope from a demonstrated musical performance. Its conditional form is not a defect to polish away. Ask what relations can be represented, which features the representation leaves out, and how a result would be judged.

Compare [Woolf on experiment and exclusions](/seminal-ideas/modern-fiction/#experiment-and-its-exclusions). She examines what a literary method brings into view and what it excludes. Lovelace examines formal operations and their possible objects. This is an editorial comparison of methods, not a claim that either work influenced the other.

### Invention, explanation, and historical credit

Menabrea’s memoir, Lovelace’s translation, her Notes, and Babbage’s engine design are distinct contributions. Treating the entire publication as though one person authored every part distorts its structure. Reducing the Notes to neutral translation makes the opposite mistake.

Oxford’s [History of Science Museum](https://hsm.ox.ac.uk/imagining-ai) presents the 1843 work as collaboration on an unbuilt design and cautions against an unqualified first-program label. The [Computer History Museum’s account](https://www.computerhistory.org/babbage/history/) identifies the Notes as early published descriptions of procedures we would now call programs. Those accounts provide reasons to study the work without requiring this lesson to award an uncontested title.

The conceptual achievement can be inspected directly: distinctions among operation and object, cards and values, location and content, and a written rule and its execution. Its historical importance does not establish that its predictions all came true or that every later computer descends directly from this publication. No unsupported chain of influence is asserted here.

### Comparisons within the catalogue

- [Snow on mechanism and testable predictions](/seminal-ideas/on-the-mode-of-communication-of-cholera/#mechanism-and-testable-predictions) distinguishes a proposed causal explanation from evidence that tests it. Lovelace’s design analysis likewise cannot substitute for the practical performance of the complete engine. Mathematical and empirical tests answer different questions.
- [Clifford on sincerity and responsible inquiry](/seminal-ideas/the-ethics-of-belief/#sincerity-truth-and-responsible-inquiry) separates a fortunate result from a responsible route to confidence. A program producing the expected answer once has not thereby established that its procedure is correct.
- [Smith on division of labour](/seminal-ideas/the-wealth-of-nations/#division-of-labour-and-productivity) asks what becomes possible when work is reorganized. Lovelace’s separation of decisions makes a different kind of organization explicit. Similarity in the question is not evidence of direct influence.

For a different question about mathematical work, read [Poincaré on invention and selective connection](/seminal-ideas/mathematical-creation/#invention-as-selective-connection). He examines how a fruitful direction becomes available before a detailed calculation begins. This is an editorial comparison, not a claim of direct influence.

### Common distortions

- **“The Notes merely translate Menabrea.”** They are a distinct English commentary appended to the translation.
- **“The Analytical Engine was demonstrated running this program in 1843.”** The complete machine remained a proposal.
- **“All the cards do the same thing.”** Choosing operations, distributing operands and results, and supplying numbers are differentiated.
- **“A Variable-column always holds the same value.”** Its location can remain fixed while its content changes.
- **“A short loop means a short calculation.”** A recurring group can execute many times.
- **“The music example proves the machine understands music.”** It proposes a conditional extension through formal representation.
- **“Correct machinery guarantees correct answers.”** Instructions, data, interpretation, and implementation each need scrutiny.
- **“Lovelace either predicted everything or saw nothing beyond arithmetic.”** Both slogans erase the Notes’ mix of ambition, detail, conjecture, and qualification.

### Test your understanding

1. Why does specifying seven multiplications fail to specify a complete calculation?
2. What must be true for adding 2 to pitch-numbers to count as musical transposition?
3. Distinguish a storage location from its value and its role.
4. Why can a former result properly become data for a later calculation?
5. What changes during a repeated group of operations if the same columns are used again?
6. Why does one correct square-sum pass fail to establish the whole procedure?
7. How can following instructions produce a result its author has not foreseen?
8. Which claims would actual execution test that a conceptual description cannot settle?

<details>
<summary>Compare your reasoning</summary>

<p><strong>1.</strong> We still need operands at every step, destinations, retention rules, and the order in which intermediate results are used. Note B distinguishes operation selection from distribution.</p>
<p><strong>2.</strong> Numerical differences must represent the relevant pitch intervals consistently. Arbitrary identifiers do not have that structure. Other musical features still need their own representation.</p>
<p><strong>3.</strong> A location is a place in the machine; its value is what it contains now; its role is how that content is being used, such as temporary work or final output.</p>
<p><strong>4.</strong> Roles are relative to a stage. An earlier Bernoulli number can be the result of one computation and a required input to the next.</p>
<p><strong>5.</strong> The values can change even when the addresses and operations recur. The next pass must receive the appropriate changed state, including any required change of source column.</p>
<p><strong>6.</strong> A faulty update can coincide with the right answer on the first pass and lose information thereafter. Initialization, preservation of the intended relation, and termination all matter.</p>
<p><strong>7.</strong> Knowing the rule is different from having worked out every consequence. A long sequence can yield an unfamiliar result without supplying an independently chosen purpose.</p>
<p><strong>8.</strong> Whether the physical arrangements reliably realize the intended operations, preserve values, handle repeated use, and deliver results under practical constraints. Execution alone would still not prove the right problem was specified.</p>

</details>

### If you read only a little

Use the note letters in the [York University transcription](https://psychclassics.yorku.ca/Lovelace/lovelace.htm). Its introduction identifies the combined publication’s 1843 volume and pages.

1. **A, from the comparison of engines through the music passage:** Mark every distinction between operations and the things operated on. Keep the music proposal’s conditions intact.
2. **A, the objection that cards may give wrong orders:** Separate the hypothesized reliability of a mechanism from the correctness of its instructions.
3. **B, the storehouse, Variable-cards, and closing discussion of inscriptions:** Explain why a written label for an observer does not direct the calculation.
4. **C and the opening of D:** Follow the return of cards to use, then identify input, result, and working roles. Read the rules for retaining or clearing values.
5. **G, opening paragraphs and the Bernoulli discussion after formula (8):** First identify what the example assumes. Then follow repeated operations, changes in column values, and preparation for the next number. Use D to decode the notation before attempting the full diagram.

For a small exercise, trace our square-sum procedure on 2, 3, and 4, then on a fresh list containing only 5. The results should be 29 and 25. If the second run yields 54, ask which value was retained when it should have been reset.

## Sources

**Primary text:** Ada Lovelace, “Notes by the Translator,” appended to her translation of L. F. Menabrea’s *Sketch of the Analytical Engine invented by Charles Babbage, Esq.*, *Scientific Memoirs* 3 (1843), pp. 666–731 for the combined work. Read in [Christopher D. Green’s York University reproduction](https://psychclassics.yorku.ca/Lovelace/lovelace.htm), focusing on A, B, C, D’s explanations of storage and notation, and G’s argument and procedural prose. Menabrea’s French source dates to 1842. The Notes are original English commentary, signed A. A. L., rather than part of the French original. Note letters, numbered operations, and named passages are our locators. The original text is public domain; the host’s modern editorial notes are separate. Formatting interventions and image-based formulae make this a reading transcription, not a certified executable program.

**Material and interpretive context:** University of Oxford, History of Science Museum, [“Imagining AI – Babbage & Lovelace”](https://hsm.ox.ac.uk/imagining-ai), especially its Analytical Engine section and displayed archival examples. Consulted for the unbuilt design, collaboration, and caution about an absolute first-program claim. The lesson does not adopt the page’s broad statements about all modern machine intelligence as a settled philosophical conclusion.

**Historical context:** Computer History Museum, [“A Brief History,” Babbage Engine](https://www.computerhistory.org/babbage/history/), especially the Analytical Engine and Ada Lovelace sections. Consulted for the relationship between the designs and the place of the published Notes in computing history. Its account of later Difference Engine construction must not be mistaken for construction of the complete Analytical Engine.

**Editorial standing:** Definitions using modern computing vocabulary, the square-sum trace and invariant, worked arithmetic, objections, comparisons, and self-checks are editorial teaching. They are not historical card listings. This guide claims neither a verified reconstruction of the Bernoulli program nor proof about the capacities of every possible machine.
