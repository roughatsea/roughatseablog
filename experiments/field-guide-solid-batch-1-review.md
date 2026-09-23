# SOLID batch 1: review record

## Publication boundary

The reader approved the OCP, Switch Statements, and Deadlock pilots. PR #15 publishes those exact bodies at the original guide URLs. The original deadlock route is `deadlocks-and-lock-discipline`, not `deadlock`.

This batch adds four review routes only. It does not replace the published SRP, LSP, ISP, or DIP articles. Reader approval is still pending; no readability score or independent human review is claimed.

## Editorial comparison with the approved pilots

Each draft was read against the approved examples, not just checked for headings. These are the concrete teaching claims the examples must support:

| Article | What is shown | Scope / caution retained |
| --- | --- | --- |
| SRP | The original reward formula and wording; complete separated classes; identical results; independent edits to the formula and sentence. | Multiple arithmetic steps can be one responsibility. More classes are not automatically better. The example produces text and does not award currency. |
| LSP | A shared input/result contract; a class with the right method that rejects 50; caught failure; corrected class and unchanged checkout. | Different valid outputs are permitted. Exceptions can be contractual. Repair is a behavior change, not a refactoring. |
| ISP | An overly broad directory dependency; separate lookup/edit contracts; one object still implements both; a usable snapshot with no editing method. | Python already allowed the lookup-only runtime call. Protocols change the declared requirement, not runtime permissions. Read interfaces do not enforce authorization. |
| DIP | A concrete dependency already supplied via a constructor; a rule-owned interface; reversed source references; actual calling code; a recording test double. | Runtime calls do not reverse. Injection is not inversion. An application-only compile/import is checked, not merely asserted from folder names. Delivery guarantees are outside the example. |

## Original failure examples remain rejection cases

- An opening that requires Strategy before defining OCP is not acceptable merely because it says “Recognize it when.” None of these openings requires another pattern.
- “The coordinating workflow” without an identified sequence is not repaired by changing the article. Each sequence is introduced through actual operations and names.
- Prose claiming repeated conditionals must show the repetition; the approved Switch Statements example remains the reference for that defect.
- A comparison must visibly establish its original and revised code. Each comparison here names what is changing and supplies both alternatives.
- No alternative is labeled “shorthand.” Python/C# behavior differences are stated rather than hidden.
- No figure, compiler result, or runtime outcome is treated as proof of the reader's enjoyment.

## Technical evidence

Run `python scripts/test-field-guide-solid.py --require-dotnet`.

The harness extracts all 23 printed Python snippets and all 22 printed C# snippets. It supplies only documented imports, entry points, namespace isolation, project files, and assertions. It runs original and revised code separately where they use the same class names.

Python local execution passed. C# must pass the branch workflow before C# verification is reported. The workflow also checks the previously approved snippets and actual Astro output. The workflow logs, rather than this file, are the authoritative per-commit outcome.

Covered cases: all five quest difficulties with and without bonus; invalid difficulty; discount minimum-spend threshold and result bounds; the intentionally broken discount; negative amounts; editable-directory updates and unknown names; snapshot copy independence; Python's original runtime compatibility; restock counts below/at/above five; negative stock; identical console output; application tests without delivery source/project.

The finite cases do not establish universal correctness. Python annotations are not claimed to be runtime validation, and no separate Python static-analysis pass is claimed.

`test-field-guide-rendering.py` discovers these four routes in the real build and checks one page layout, review metadata, language-specific prose visibility, remembered preference, narrow-screen overflow, source anchors, and no-JavaScript fallback. It retains screenshots and HTML for inspection.

`check-published-field-guide.py` is a read-only live-site check. It verifies the three published replacements separately from the unmerged review build.

## Remaining gate

Read the four complete drafts in the rendered layout. They are not authorized for production merely because technical tests pass.
