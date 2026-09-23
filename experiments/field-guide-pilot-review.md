# Software Engineering Field Guide: three pilot drafts

## Scope and publication boundary

These drafts cover Open/Closed Principle, Switch Statements, and Deadlock only.
They live under `/guides/software-engineering/pilot/`, use the existing BaseLayout,
and do not replace the published routes, change the guide data, or enter the
homepage feed. Pilot pages carry `noindex, nofollow`. Keep this branch/PR unmerged
until the user has reviewed the reading experience. No guide-wide rewrite is
approved by the existence of these drafts.

## Read the drafts

- `src/pages/guides/software-engineering/pilot/open-closed-principle.mdx`
- `src/pages/guides/software-engineering/pilot/switch-statements.mdx`
- `src/pages/guides/software-engineering/pilot/deadlock.mdx`

The index is `/guides/software-engineering/pilot/`. The pilot layout uses the
existing site shell, one full-width reading column, and language-specific code
AND explanatory paragraphs. The default is C# when no preference exists. A saved
C#/Python/Both preference is honored. Without JavaScript both languages remain
readable and inactive language controls are hidden.

## Technical evidence, not an editorial score

Run:

```sh
python scripts/test-field-guide-pilots.py --require-dotnet
```

Requirements: Python 3.10+ and a .NET 8 SDK. The test script extracts each code
fence tagged `sample=...` directly from the MDX. It supplies only the documented
imports, namespaces, Main methods, and test scaffolding. There are no independent
copies of the teaching implementations to drift out of sync.

The script checks:

- The printed discount calls and six subtotals; adding EmployeeDiscount without
  replacing the Python checkout method.
- Original/refactored membership outcomes at seven subtotals, including just
  below, at, and above the free-shipping threshold; rejection of unknown names;
  inserting the displayed Plus branch into the displayed selection function.
- A safe child-process reproduction of the original Python deadlock. Instrumented
  lock wrappers preserve locking semantics and force both first acquisitions to
  precede either second acquisition. The parent verifies those events and kills
  the child on timeout. A timeout alone is not counted as evidence of deadlock.
- Twenty paired runs of the corrected Python token moves, completion of both
  workers, unchanged final counts, and empty-source handling.
- All acquisition/release interleavings of the two displayed lock orders: the
  original model has 19 reachable states and one deadlock; the corrected model
  has 16 states and no deadlock. This finite model covers only these locks and
  method paths, not arbitrary concurrent programs or fairness.
- Compilation and execution of every displayed C# sample in its stated context,
  membership behavior, discount outputs, and corrected threaded moves. The C#
  original deadlock is explained and modeled; the forced runtime reproduction
  is Python-only. The C# tests do exercise the original token code sequentially.

The local authoring environment ran the Python tests and finite model successfully.
It did not have a .NET SDK. C# execution is therefore NOT established by that local
run. The PR workflow requires .NET and must pass before C# is called verified.
A missing SDK is an explicit failure with `--require-dotnet`, never a silent pass.
The workflow does not certify editorial quality or replace a full site build.

## Editorial checks performed on these drafts

These are author checks, not independent human-reader approval.

| Previous failure | Concrete change in the pilot |
| --- | --- |
| Advice in place of a definition | Every opening defines its subject before prescribing a technique. |
| Unintroduced Strategy / coordinator | OCP begins with a checkout and named discount classes; Strategy is introduced only after the example. |
| Extension asserted but not shown | EmployeeDiscount and its calling code are both displayed; the unchanged declarations are named. |
| Repeated conditionals claimed, only one shown | Shipping and return-window operations both inspect the membership in the original code. |
| Refactored caller omitted | The benefits summary calls the selected object's methods; selection is explicitly shown. |
| Conditional removal oversold | The remaining selection switch and subtotal conditional are explained; a data table and the original functions remain legitimate alternatives. |
| Imaginary before/after referents | Before, After, selection, use, and extension are actual labeled stages. |
| Language toggle hides required context | Each language section contains its own identifiers and explanation, not just translated syntax. |
| Fixed deadlock code without the failure | Original methods, a four-step blocked execution, the replacement method, and the ordering argument all appear. |
| Shorthand changes semantics | No shorthand alternative is presented as an equivalent. |
| Program fragments presented as whole programs | Source-file placement, calling-method context, imports, and replacement instructions are explicit. |

## Review questions with evidence in the article

OCP: Can you point to the new calculation, its use, and the unchanged checkout?
Can you identify a requirement (item-dependent discounts) that the current inputs
cannot support? The article supplies both, rather than implying eternal closure.

Switch Statements: Can you find both original membership decisions, the moved
rules, and the remaining selection function? Can you explain which operation's
signature changes and which business outcomes must stay equal? Can you identify
a cost of adding a new operation to every benefits implementation?

Deadlock: Can you name what each worker holds, what it requests next, and why
neither can release its first lock? Can you explain why the corrected waiting
worker does not hold the lock the running worker needs? Is a successful test run
being mistaken for proof of all possible concurrent behavior? The article
separates the observed runs from the ordering argument and its assumptions.

## Remaining acceptance gate

The user has not approved the pilots. Do not assign an invented readability score
or describe them as independently reviewed. Successful code tests establish
specific behavior, not that the prose is a joy to read. Review the rendered page
in C#, Python, Both, and narrow layouts; record actual findings rather than
claiming a site preview from a source-file inspection.
