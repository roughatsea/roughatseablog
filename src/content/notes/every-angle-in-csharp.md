---
title: "Every Angle in C#: Generics, Bit Shifts, and Lambdas Without the Guesswork"
description: "A field guide to <, >, generics, shifts, arrows, and the information C# leaves unstated—with expanded alternatives, complete calls, execution traces, and worked exercises."
heroImage: "/images/notes/essential-coding-patterns-for-senior-engineers.webp"
heroImageAlt: "A software architect faces a modular city as pink and blue streams of code flow through it."
date: 2026-09-23
publishedAt: 2026-09-23T22:40:13-07:00
tags:
  - csharp
  - software-engineering
  - programming-languages
  - generics
  - learning
---


Consider how much a reader is expected to recover from this line:

```csharp
Func<int, bool> test = number => number > 0;
```

The first pair of brackets supplies types. The next greater-than character belongs to an arrow. The last greater-than character compares two values. `number` is a newly declared parameter, despite looking much like a reference to an existing variable. Its type is written somewhere else. The comparison has not executed yet.

It is a small line with a large reading bill.

C# reuses `<` and `>` in several unrelated constructions. It also permits abbreviated function declarations whose meaning depends on declarations outside the line being read. Understanding the punctuation requires both recognizing its grammatical role and finding the information that the notation does not repeat.

We will start with ordinary comparisons, build generic types and callable values, and then expand the arrows. Later sections cover the stranger-looking cases: functions that return functions, expression trees, type constraints that seem circular, function pointers, and compiler-generated names.

The compact forms will remain beside their expanded alternatives. There is no requirement to prefer them.

**Prerequisites:** variables, assignments, ordinary method calls, basic classes, and the meanings of `int`, `bool`, and `string`. Delegates, generics, captures, and asynchronous return types are introduced before they are needed. **Version boundary:** C# 14 and .NET 10. Newer preview behavior is outside this article; relevant older-version differences are labeled. Microsoft's reference pages sometimes include previews alongside released features, so the version boundary matters. [Language versions](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14).

## Find the shape you are looking at

This is a lookup map, not a list of prerequisites. Each destination explains its terms.

| What you see | What to investigate |
| --- | --- |
| `a < b`, `a >= b` | [Comparisons and relational patterns](#comparisons) |
| `List<int>`, `Echo<string>(...)` | [Generic types and methods](#generics) |
| `Func<int, bool>` | [Delegate types: something callable](#delegates) |
| `x => ...`, `() => ...` | [Lambdas, expanded](#lambdas) |
| `Name => ...`, `get => ...`, `case => ...` | [Arrows that are not lambdas](#other-arrows) |
| `x => y => ...`, `async x => ...` | [Nested functions](#nested-lambdas) and [asynchronous functions](#async) |
| `Expression<Func<...>>` | [Code represented as data](#expression-trees) |
| `Dictionary<string, Func<int, Task<bool>>>` | [Nested types, one layer at a time](#nested-types) |
| `where T : IComparable<T>`, `in T`, `out T` | [Constraints](#constraints) and [variance](#variance) |
| `<<`, `>>`, `>>>`, `>>>=` | [Bit shifts and assignment](#shifts) |
| `delegate*<...>`, `p->Member` | [Pointers](#pointers) |
| `<summary>`, `<Name>k__BackingField` | [Documentation, markup, and generated names](#boundaries) |

For a first reading, follow the sections in order. For a line encountered at work, start with its shape and use the local explanations.

### Where the code belongs

A **complete program** replaces `Program.cs` in a console project. Short blocks labeled **inside `Main`** belong inside the braces of this method:

```csharp
using System;
using System.Collections.Generic;

internal static class Program
{
    private static void Main()
    {
        // Put the example here.
    }
}
```

A block labeled **class members** belongs inside `Program`, but outside `Main`. Alternatives replace one another; do not paste every alternative declaration into the same scope. Additional namespaces and asynchronous or unsafe contexts are identified where needed.

<a id="comparisons"></a>
## 1. Comparisons: start by looking at the values

`<` means **less than**. `>` means **greater than**. Adding `=` includes equality: `<=` means less than or equal to, and `>=` means greater than or equal to. For ordinary numeric operands, the result is a `bool`. The values being compared are called the operator's **operands**. [Comparison operators](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/comparison-operators).

**Inside `Main`:**

```csharp
int temperature = 21;

bool belowMinimum = temperature < 18;   // false
bool aboveMaximum = temperature > 24;   // false
bool atLeastMinimum = temperature >= 18; // true
bool atMostMaximum = temperature <= 24;  // true
```

Each line asks a separate question about `temperature`. None modifies it.

To ask whether the temperature is within an inclusive range, combine two comparisons:

```csharp
int temperature = 21;

bool isComfortable =
    temperature >= 18 &&
    temperature <= 24;
```

`&&` requires both Boolean conditions to be true. C# does not support the mathematical chain `18 <= temperature <= 24`: the first comparison produces a Boolean, not a number suitable for the second comparison.

### Why the variable sometimes disappears

A **pattern** describes a condition that an input must match. A **relational pattern** compares that input against a constant. These two alternatives produce the same result for the integer variable shown:

**Separate comparisons:**

```csharp
bool isComfortable = temperature >= 18 && temperature <= 24;
```

**Relational patterns:**

```csharp
bool isComfortable = temperature is >= 18 and <= 24;
```

Read the second form as: “Does `temperature` match both the at-least-18 condition and the at-most-24 condition?” Both patterns apply to `temperature`; no new parameter or variable is being declared. The `and` here joins patterns, whereas `&&` joins Boolean expressions. [Patterns](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns#relational-patterns).

This is not an unrestricted text substitution. A relational pattern requires a constant on its right. A changing variable such as `minimum` can be used in `temperature >= minimum`, but not as the boundary in `temperature is >= minimum`.

Also preserve evaluation count. If the input is `ReadTemperature()`, a pattern tests one evaluated input. An expansion that calls `ReadTemperature()` twice can read two different temperatures. Store the result in a variable before making the comparisons.

### “Not greater” does not always mean “less than or equal”

Two exceptions deserve attention before we build bigger expressions.

A floating-point value can be `NaN`, meaning “not a number.” A nullable integer, written `int?`, can contain no integer at all, represented by `null`. Comparisons involving these values do not behave like an ordinary total ordering. In the examples below, both `>` and `<=` produce `false`. Negating `>` therefore produces `true`, not the same answer as `<=`. [Floating-point comparisons](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/comparison-operators); [nullable comparisons](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-value-types#lifted-operators).

**Inside `Main`:**

```csharp
double unknown = double.NaN;
Console.WriteLine(unknown > 0);     // False
Console.WriteLine(unknown <= 0);    // False
Console.WriteLine(!(unknown > 0));  // True

int? missing = null;
Console.WriteLine(missing > 0);     // False
Console.WriteLine(missing <= 0);    // False
Console.WriteLine(!(missing > 0));  // True
```

The character identifies the comparison. The operand types and values determine its behavior. We will return to this distinction when custom types define their own operators.

<a id="generics"></a>
## 2. Generics: giving code a place to name a type later

A **generic type** is a type declaration written with one or more placeholders for types. A **type parameter** names a placeholder in the declaration. A **type argument** is the type supplied when that declaration is used. These terms parallel ordinary method parameters and arguments, but the things supplied are types rather than ordinary values. [Generic type parameters](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/generic-type-parameters).

Start with a class that holds one integer. This declaration goes outside `Program`:

```csharp
internal sealed class IntegerBox
{
    public int Value;

    public IntegerBox(int value)
    {
        Value = value;
    }
}
```

Both `Value` and the constructor parameter have type `int`. A separate string box would repeat the structure with `string` in those positions.

A generic declaration lets us express the shared structure once. Here is a **complete program**:

```csharp sample=generic-box
using System;

internal sealed class Box<T>
{
    public T Value;

    public Box(T value)
    {
        Value = value;
    }
}

internal static class Program
{
    private static void Main()
    {
        Box<int> count = new Box<int>(7);
        Box<string> direction = new Box<string>("north");

        int countValue = count.Value;
        string directionValue = direction.Value;

        Console.WriteLine(countValue);
        Console.WriteLine(directionValue);
    }
}
```

Output:

```text output=generic-box
7
north
```

`Box<T>` declares the type parameter `T`. `Box<int>` supplies `int`, so its `Value` field has type `int`. `Box<string>` supplies `string`, so its `Value` field has type `string`.

`T` is a name chosen by the author, not a special keyword meaning “anything goes.” The constructor repeats that same name because its parameter must have the box's value type. The constructor itself is named `Box`, not `Box<T>`.

The types do not become interchangeable. Assigning `"north"` to `count.Value` is a compile-time error. The generic declaration preserves a relationship between the types used in its members.

### Read types and ordinary arguments separately

In this expression:

```csharp
new Box<int>(7)
```

`<int>` supplies a type argument to `Box`. `(7)` supplies an ordinary argument to its constructor. The angle brackets do not hold an integer value, and the parentheses do not hold a type.

A familiar library example follows the same rule:

```csharp
List<int> scores = new List<int>();
scores.Add(10);
scores.Add(20);
```

`List<int>` is a list whose element type is `int`. The empty parentheses invoke a parameterless constructor; they do not mean that the element type is unspecified. [Generic classes](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/generic-classes).

Two abbreviated alternatives can hide different information:

```csharp
var scores = new List<int>();
```

```csharp
List<int> scores = new();
```

The first infers the variable's type from the expression on the right. The second obtains the constructed type from the assignment target on the left. Neither turns the variable into a dynamically typed value, and neither makes `new List<>()` valid C#. [Implicitly typed locals](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/implicitly-typed-local-variables); [target-typed construction](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/new-operator).

### Generic methods have their own type parameters

A method can declare a type parameter even when its containing class is not generic.

**Class member:**

```csharp
private static T Echo<T>(T value)
{
    return value;
}
```

**Calling code inside `Main`:**

```csharp
int answer = Echo<int>(42);
string greeting = Echo<string>("hello");
```

The first `T` in the declaration is the return type. The `T` between brackets is the declaration of the type parameter. The `T` before `value` uses that parameter as the ordinary parameter's type. All three occurrences refer to the same type parameter.

For `Echo<int>(42)`, the method accepts an integer and returns an integer. It returns the supplied value; no conversion or arithmetic occurs.

C# can infer type arguments for many generic method calls:

```csharp
int answer = Echo(42);
string greeting = Echo("hello");
```

Here, `42` and `"hello"` provide the needed type information. The type argument has been omitted from the source, not removed from the generic method. Do not generalize this into “the compiler infers every type from whatever is nearby.” Generic method type inference uses defined rules based on the call's arguments; a desired return type on the left of an assignment is not generally enough. [Generic methods and inference](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/generic-methods).

C# generics are related in purpose to C++ templates, but they are not the same mechanism. C# retains generic type information at runtime and type-checks generic code under the guarantees of its declared constraints. It is not a general-purpose textual substitution facility. [Generics and templates](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/differences-between-cpp-templates-and-csharp-generics).

<a id="delegates"></a>
## 3. A delegate variable holds something callable, not its answer

A **delegate type** describes a permitted method-call shape: parameter types and return type. A **delegate object** lets code invoke a compatible method. It can be stored in a variable and passed to another method. A delegate may have several invocation targets, but our introductory examples each have one. [Using delegates](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/delegates/using-delegates).

We do not need generics or lambdas to demonstrate this.

**Complete program:**

```csharp sample=custom-delegate
using System;

internal delegate bool IntegerTest(int value);

internal static class Program
{
    private static bool IsPositive(int number)
    {
        return number > 0;
    }

    private static void Main()
    {
        IntegerTest test = new IntegerTest(IsPositive);

        bool result = test(5);

        Console.WriteLine(result);
    }
}
```

Output:

```text output=custom-delegate
True
```

`IntegerTest` declares a delegate type accepting an `int` and returning a `bool`. `IsPositive` is an ordinary method with that shape. Its parameter happens to be named `number`; the delegate declaration names its parameter `value`. Matching parameter names are not required.

`new IntegerTest(IsPositive)` creates a delegate referring to `IsPositive`. The expression passes the method name without calling it. `IsPositive(5)` would instead execute the method and produce a Boolean.

`test` holds the callable object. `result` holds the answer produced by calling that object. `test(5)` supplies `5` to `IsPositive`'s `number` parameter, then receives the Boolean returned by the method.

### What the brackets in `Func<int, bool>` describe

.NET supplies reusable delegate types. `Func<int, bool>` has the call shape we just declared ourselves: one integer parameter, one Boolean result. Its first type argument is the input type; its last is the return type. [Func reference](https://learn.microsoft.com/en-us/dotnet/api/system.func-2?view=net-10.0).

Replace the declaration of `test` in the complete program with:

```csharp
Func<int, bool> test = new Func<int, bool>(IsPositive);
```

The `IntegerTest` declaration is now unused and can be removed. `IsPositive`, `test(5)`, and the output remain the same for this example.

A shorter declaration is:

```csharp
Func<int, bool> test = IsPositive;
```

The method name is converted to the compatible delegate type. This is commonly called a **method-group conversion**: a method name can identify candidate methods, and the compiler selects a compatible one for the target delegate. It still does not call the method. [Delegate creation](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#128175-delegate-creation-expressions).

### The last bracketed type is not always a return type

That rule belongs to `Func`, not to angle brackets generally.

| Delegate type | Ordinary method shape |
| --- | --- |
| `Func<bool>` | No parameters; returns `bool`. |
| `Func<int, bool>` | One `int` parameter; returns `bool`. |
| `Func<int, string, bool>` | An `int` and a `string` parameter, in that order; returns `bool`. |
| `Action` | No parameters; returns `void`. |
| `Action<string>` | One `string` parameter; returns `void`. |
| `Predicate<int>` | One `int` parameter; returns `bool`. |

`void` means no value is returned to the caller. Every type argument in an `Action<...>` identifies a parameter type; its return type is always `void`. `Predicate<T>` fixes the return type as `bool`. These are library declarations, not interpretations invented by the brackets. [Action](https://learn.microsoft.com/en-us/dotnet/api/system.action-1?view=net-10.0); [Predicate](https://learn.microsoft.com/en-us/dotnet/api/system.predicate-1?view=net-10.0).

`IntegerTest`, `Predicate<int>`, and `Func<int, bool>` are distinct delegate types even though they describe the same simple call shape. A method can be compatible with all three without an existing delegate object of one type automatically becoming an object of another.

<a id="lambdas"></a>
## 4. Lambdas: remove one piece of information at a time

A **lambda expression** defines an unnamed function. In our next examples, that function is converted to a delegate and stored in a variable. Other target contexts exist; we will reach expression trees later. [Lambda expressions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions).

Here is the familiar named method, followed by its use:

**Class member:**

```csharp
private static bool IsPositive(int number)
{
    return number > 0;
}
```

**Inside `Main`:**

```csharp
Func<int, bool> test = new Func<int, bool>(IsPositive);
bool result = test(5);
```

Now replace those two `Main` statements with an alternative that puts the function directly in the assignment:

```csharp
Func<int, bool> test = (int number) =>
{
    return number > 0;
};

bool result = test(5);
```

The separate `IsPositive` method is no longer used. The parameter declaration still explicitly says `int number`. The braces still contain a body. The `return` statement still identifies the returned value.

The lambda has no declared method name. `test` is the name of the variable holding the resulting delegate, not a method name written into the lambda.

### Where the return type went

The assignment expects a `Func<int, bool>`. That delegate accepts an integer and returns a Boolean. The lambda's return statement produces the Boolean result of `number > 0`, which is compatible with the required return type.

C# 10 introduced a form that also writes the lambda return type explicitly:

```csharp
Func<int, bool> test = bool (int number) =>
{
    return number > 0;
};
```

The `bool` immediately before `(int number)` is the explicit return type. This form can help expose the missing information, but it is not necessarily a clearer starting point than an ordinary named method. [Explicit lambda return types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-10.0/lambda-improvements#explicit-return-type).

### Where the parameter type went

Starting again from the block-bodied lambda, remove the parameter's type annotation:

```csharp
Func<int, bool> test = number =>
{
    return number > 0;
};
```

The `number` before the arrow **still declares a parameter**. It is not a reference to an integer that must have been declared earlier. Its type comes from the parameter position of the target delegate, `Func<int, bool>`.

There is one implicitly typed parameter, so its parentheses can be omitted. With no parameters, write `()`. With two or more, use a parenthesized list such as `(left, right)`.

Finally, the body can be a single expression:

```csharp
Func<int, bool> test = number => number > 0;
```

For this value-returning lambda, the expression supplies the return value. The braces and explicit `return` disappear together. Do not generalize this into “everything after every arrow is returned”: a `void` function can have an expression body that performs an action.

### The information ledger for this exact line

| Question | Answer |
| --- | --- |
| Where is the parameter declared? | `number`, immediately before `=>`. |
| What is its type? | `int`, supplied by the parameter position in `Func<int, bool>`. |
| What must the function return? | A `bool`, as required by the delegate. |
| What produces that value? | The comparison `number > 0`. |
| Where is its argument supplied? | At an invocation such as `test(5)`. |
| When is the comparison evaluated? | When `test` is invoked, not merely assigned. |
| What does `test` contain? | A delegate, not the result of the comparison. |
| Is the final `>` part of the arrow? | No. `=>` and `>` are separate pieces of syntax. |

The rules here concern parameter declaration, target typing, and anonymous-function conversion. They do not establish that every equivalent-looking rewrite has identical allocation, identity, reflection, or stack-trace behavior. Our named-method and lambda alternatives have the same answers for the calls shown. [Anonymous-function specification](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#1222-anonymous-function-expressions).

### Lambdas do not require generics

Return to our non-generic `IntegerTest` delegate type:

```csharp
IntegerTest test = number => number > 0;
```

No type-argument brackets occur in that declaration. `=>` is a complete lambda token containing a greater-than character; it is not a pair of angle brackets. Generic delegates are convenient companions to lambdas, but they do not enable lambdas to exist.

<a id="callbacks"></a>
## 5. The missing caller: who supplies `number`?

A **callback** is a function supplied to other code so that the other code can invoke it. Nothing in that definition requires a background thread or asynchronous execution.

To see why passing a function is useful, write a method that counts integers satisfying a test. It knows how to loop and count. Its caller chooses what passing the test means.

**Complete program:**

```csharp sample=count-callback
using System;

internal static class Program
{
    private static bool IsPositive(int number)
    {
        return number > 0;
    }

    private static int CountMatching(int[] values, Func<int, bool> test)
    {
        int count = 0;

        foreach (int value in values)
        {
            bool matches = test(value);

            if (matches)
            {
                count++;
            }
        }

        return count;
    }

    private static void Main()
    {
        int[] values = new int[] { -2, 0, 5, 8 };
        Func<int, bool> test = new Func<int, bool>(IsPositive);

        int count = CountMatching(values, test);

        Console.WriteLine(count);
    }
}
```

Output:

```text output=count-callback
2
```

The line `test(value)` is the missing call we needed to see. `CountMatching` reads an integer from `values` and supplies it to the callback. For the first iteration, its local `value` contains `-2`; invoking the delegate supplies `-2` to `IsPositive`'s parameter `number`.

`value` and `number` belong to different methods. Their names need not match.

| Value supplied by `CountMatching` | Value returned by `IsPositive` | Count afterward |
| --- | --- | --- |
| `-2` | `false` | `0` |
| `0` | `false` | `0` |
| `5` | `true` | `1` |
| `8` | `true` | `2` |

Now replace the delegate declaration and following call in `Main` with:

```csharp
int count = CountMatching(values, number => number > 0);
```

`CountMatching` has not changed. It still invokes `test(value)`. Its second parameter has type `Func<int, bool>`, which supplies the lambda's parameter type and required result type even though no local `test` variable is declared in `Main`.

This is what “inferred from context” should point to: **the declaration of the receiving method's second parameter**.

To count even integers instead, the caller can supply `number => number % 2 == 0`. `%` computes a remainder; an integer is even when division by two leaves remainder zero. The counting loop remains unchanged.

The lambda did not eliminate a call. It moved the function definition to the place where the function is passed. The receiving code still owns the invocation. [Delegates and callbacks](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/delegates-lambdas).

### Why a library call can execute later

LINQ is .NET's family of operations for querying sequences. Its `Enumerable.Where` method selects elements using a Boolean test. An `IEnumerable<int>` is a sequence of integers that code can enumerate, for example with `foreach`; the interface does not promise that the sequence has already been materialized into a list.

**Complete program:**

```csharp sample=deferred-where
using System;
using System.Collections.Generic;
using System.Linq;

internal static class Program
{
    private static bool IsPositive(int number)
    {
        Console.WriteLine($"Testing {number}");
        return number > 0;
    }

    private static void Main()
    {
        int[] values = new int[] { -2, 0, 5, 8 };

        IEnumerable<int> positives = Enumerable.Where<int>(
            values,
            new Func<int, bool>(IsPositive));

        Console.WriteLine("Query created");

        foreach (int value in positives)
        {
            Console.WriteLine($"Keeping {value}");
        }
    }
}
```

Output:

```text output=deferred-where
Query created
Testing -2
Testing 0
Testing 5
Keeping 5
Testing 8
Keeping 8
```

The filtering happens during enumeration. The call that creates `positives` does not first run `IsPositive` across the array. `Enumerable.Where`'s contract determines this timing; the arrow does not. [Enumerable.Where](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.where?view=net-10.0).

The compact replacement for the declaration of `positives` is:

```csharp
IEnumerable<int> positives = values.Where(number => number > 0);
```

This replacement retains the selection behavior but removes the diagnostic printing because the new lambda contains only the comparison. To retain the trace too, use:

```csharp
IEnumerable<int> positives = values.Where(number =>
{
    Console.WriteLine($"Testing {number}");
    return number > 0;
});
```

`values.Where(...)` uses **extension-method syntax**: the receiver before the dot is supplied as an argument to a static extension method. The expanded call showed that receiver explicitly as the first argument of `Enumerable.Where<int>`. The compact form also omits the inferred generic type argument. Those are two additional abbreviations surrounding the lambda. [Extension methods](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods).

A hand-written loop that immediately builds a `List<int>` might select the same elements, but it is not an exact replacement for this deferred sequence. It changes when work happens and whether another enumeration repeats the work. Describe that loop as a behavioral illustration, not a universally equivalent expansion.

<a id="captures"></a>
## 6. Captures: the function may depend on more than its parameters

A **capture** occurs when an anonymous function or a local function uses an eligible variable from its surrounding scope. A **local function** is a named function declared inside another function. Putting the function's types back on the page does not make this surrounding state disappear. [Local functions](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/local-functions).

**Complete program, with a named local function:**

```csharp sample=capture
using System;

internal static class Program
{
    private static void Main()
    {
        int minimum = 10;

        bool MeetsMinimum(int value)
        {
            return value >= minimum;
        }

        Func<int, bool> test = new Func<int, bool>(MeetsMinimum);

        minimum = 20;
        Console.WriteLine(test(15));

        minimum = 12;
        Console.WriteLine(test(15));
    }
}
```

Output:

```text output=capture
False
True
```

The delegate is created while `minimum` contains `10`. It is first invoked after `minimum` becomes `20`. The comparison therefore asks whether `15 >= 20`, which is false. The second invocation happens after `minimum` becomes `12`, so it returns true.

The function retains access to the variable. It does not freeze the value `10` when the delegate is created.

**Lambda alternative:** replace the local function declaration and the declaration of `test` with:

```csharp
Func<int, bool> test = value => value >= minimum;
```

Leave the initial declaration of `minimum` and both later assignments unchanged. The outputs remain the same. This is an expansion that preserves the capture, rather than quietly moving the comparison into a method that can no longer access `minimum`.

A function together with its captured environment is commonly called a **closure**. An implementation can keep captured variables available beyond the execution of the method that originally declared them. This explains why callbacks can retain surrounding objects longer than their authors expected. The precise compiler-generated objects and optimizations are implementation details. [Captured variables](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#122263-instantiation-of-local-variables).

### Make a changing dependency an explicit argument

Sometimes the clearer design is to pass the limit when calling the function.

**Class member:**

```csharp
private static bool MeetsMinimum(int value, int minimum)
{
    return value >= minimum;
}
```

**Inside `Main`:**

```csharp
Func<int, int, bool> test = MeetsMinimum;
bool result = test(15, 20);
```

**Lambda alternative:**

```csharp
Func<int, int, bool> test = (value, minimum) => value >= minimum;
bool result = test(15, 20);
```

This has a different interface from the captured version: its caller must supply the limit on every invocation. It is a design alternative, not a drop-in replacement for a method expecting `Func<int, bool>`.

### What `static` on a lambda actually promises

A static lambda cannot capture surrounding local variables or the current instance. For example:

```csharp
Func<int, bool> test = static number => number > 0;
```

This is valid because the comparison depends only on its parameter and a constant. Adding a reference to a surrounding local `minimum` would fail compilation. A static lambda can still access permitted static members; `static` does not mean “has no effects,” “is thread-safe,” or “runs on a different thread.” [Static anonymous functions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions).

### Repetition can make capture surprising

**Inside `Main`:**

```csharp
List<Func<int>> readers = new List<Func<int>>();

for (int index = 0; index < 3; index++)
{
    readers.Add(() => index);
}

foreach (Func<int> read in readers)
{
    Console.WriteLine(read());
}
```

The output is `3`, `3`, `3`. The lambdas read the same `for` loop variable after the loop has finished. Creating three delegates did not make three snapshots.

A changed loop body can deliberately create a separate captured variable on each iteration:

```csharp
for (int index = 0; index < 3; index++)
{
    int savedIndex = index;
    readers.Add(() => savedIndex);
}
```

With a newly empty `readers` list and the same printing loop, this version prints `0`, `1`, `2`. The change is not punctuation. It changes which variable each function captures. Do not carry this `for` example unchanged into claims about every loop construct; modern `foreach` iteration variables follow different capture behavior. [Variable instantiation and capture](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#122263-instantiation-of-local-variables).

<a id="other-arrows"></a>
## 7. Arrows that are not lambdas

`=>` appears in several grammatical contexts. The surrounding declaration tells you which one you are reading.

### A named method with an expression body

**Expanded class member:**

```csharp
private static bool IsPositive(int number)
{
    return number > 0;
}
```

**Expression-bodied alternative:**

```csharp
private static bool IsPositive(int number) => number > 0;
```

Both declare a method named `IsPositive`, an integer parameter named `number`, and a Boolean return type. The arrow abbreviates the body. It does not make the method anonymous or automatically create a delegate.

The caller remains:

```csharp
bool result = IsPositive(5);
```

An expression-bodied method returning `void` performs an action rather than returning the expression's value. For example, `private static void Print(int number) => Console.WriteLine(number);` corresponds to a body containing `Console.WriteLine(number);`, not `return Console.WriteLine(number);`. [Expression-bodied members](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-operator).

### A property getter is not an initialized field

A **property** exposes accessor code through member-access syntax. A **getter** runs when the property's value is read. These are alternative class declarations:

**Expanded:**

```csharp
internal sealed class Counter
{
    private int count = 1;

    public int Next
    {
        get
        {
            return count++;
        }
    }
}
```

**Compact:**

```csharp
internal sealed class Counter
{
    private int count = 1;

    public int Next => count++;
}
```

**Calling code inside `Main`:**

```csharp
Counter counter = new Counter();
Console.WriteLine(counter.Next); // 1
Console.WriteLine(counter.Next); // 2
```

Each read invokes the getter. `count++` produces the current value, then increments the field. The property does not store the answer from one evaluation at construction time. This deliberately effectful getter is a demonstration of evaluation timing, not a recommendation for property design. [Properties](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties).

### `get =>` and `set =>`

These alternative members belong in a class with the field `private int count;`:

**Expanded:**

```csharp
public int Count
{
    get
    {
        return count;
    }
    set
    {
        count = value;
    }
}
```

**Compact:**

```csharp
public int Count
{
    get => count;
    set => count = value;
}
```

`value` is the setter's implicit parameter. Its type is the property's type, `int`. An assignment such as `counter.Count = 12` supplies `12`. The setter is not a lambda, and its expression body does not return an integer to the caller. [Property accessors](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/set).

Indexers, constructors, finalizers, and event accessors can also use expression bodies in supported forms. Read the declaration first: it tells you whether the body must produce a value or perform a `void` action. Event accessors have an implicit `value` too, but there it is the delegate being added or removed, not a property's assigned integer.

### The arrow in a switch expression

A **switch expression** chooses a value by matching an input against alternatives. Each alternative is called an **arm**. Its `=>` separates a pattern from the result to produce when that arm is selected. It does not declare a function parameter.

**Expanded class member:**

```csharp
private static string Describe(int number)
{
    if (number < 0)
    {
        return "negative";
    }

    if (number == 0)
    {
        return "zero";
    }

    return "positive";
}
```

**Switch-expression alternative:**

```csharp
private static string Describe(int number)
{
    return number switch
    {
        < 0 => "negative",
        0 => "zero",
        _ => "positive"
    };
}
```

Both can be called with `Describe(-2)`, which returns `"negative"`. The first `<` is part of a relational pattern. The `>` next to `=` belongs to the arm separator. `_` is a discard pattern matching any remaining input.

The matching arms are considered in source order, and the chosen arm's result is evaluated. Omitting a matching arm can produce a runtime exception; the compiler also diagnoses many non-exhaustive cases. Our final `_` covers every remaining integer. [Switch expressions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/switch-expression).

Compressing the whole member adds another arrow:

```csharp
private static string Describe(int number) => number switch
{
    < 0 => "negative",
    0 => "zero",
    _ => "positive"
};
```

The first arrow belongs to the named method's expression body. The three later arrows belong to switch arms. There is no lambda anywhere in this declaration.

### Arrow-free anonymous methods

Older C# can express an anonymous function using `delegate` syntax:

```csharp
Func<int, bool> test = delegate (int number)
{
    return number > 0;
};
```

It is anonymous despite containing no arrow. It can also capture surrounding variables. Anonymous methods have their own restrictions, including that they do not convert to expression trees. Recognizing anonymous functions cannot therefore be reduced to spotting `=>`. [The delegate operator](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/delegate-operator).

<a id="async"></a>
## 8. Async: distinguish the returned task from its eventual result

A `Task` represents an operation whose completion can be observed. A `Task<bool>` represents an operation that can complete successfully with a Boolean result, or complete by faulting or being canceled. A task might already be complete when it is returned.

An `async` function can use `await` to suspend its own progress until an awaited operation completes. Neither `async` nor a lambda arrow promises a new thread. An async function begins running when invoked and ordinarily runs synchronously until it reaches an await that cannot complete immediately. [Async return types](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-return-types); [asynchronous programming](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/).

**Complete program with a named async method:**

```csharp sample=async-delegate
using System;
using System.Threading.Tasks;

internal static class Program
{
    private static async Task<bool> IsPositiveAfterDelayAsync(int number)
    {
        await Task.Delay(1);
        return number > 0;
    }

    private static async Task Main()
    {
        Func<int, Task<bool>> test = IsPositiveAfterDelayAsync;

        Task<bool> pendingResult = test(5);
        bool result = await pendingResult;

        Console.WriteLine(result);
    }
}
```

Output:

```text output=async-delegate
True
```

The short delay exists only to demonstrate awaiting an operation; it represents no real service or useful workload.

Read the types in separate steps. `test` is callable. Calling it with an integer returns a `Task<bool>`. Awaiting that task produces a `bool` when the operation succeeds. Inside the async method, the `return` statement supplies that successful Boolean result, not a manually constructed task.

**Lambda alternative:** replace the declaration of `test` with:

```csharp
Func<int, Task<bool>> test = async (int number) =>
{
    await Task.Delay(1);
    return number > 0;
};
```

The two invocation lines remain unchanged. The named async method is no longer needed. Removing `int` from the lambda parameter is another optional abbreviation; it is not required by `async`.

### A `void` target can change what the caller can observe

This declaration has a different contract:

```csharp
Action work = async () =>
{
    await Task.Delay(1);
};
```

`Action` returns `void`, so this lambda has `async void` behavior. Calling `work()` does not give the caller a task to await. Its completion and exceptions cannot be handled in the same way as those of a task-returning function. Use this shape for the event-handler cases that require it, not as a casual substitute for `Func<Task>`. [Async void](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-return-types#void-return-type).

The task-returning alternative is:

```csharp
Func<Task> work = async () =>
{
    await Task.Delay(1);
};

await work();
```

These lines belong in an async method such as the `Main` above. The important difference is visible in the target type, not in the arrow or the empty parameter list.

<a id="nested-lambdas"></a>
## 9. A function can return another function

An expression with two arrows need not be one unusually complicated function. It can define a function that creates another function.

Start with a named version. **Complete program:**

```csharp sample=nested-functions
using System;

internal static class Program
{
    private static Func<int, int> MakeAdder(int amount)
    {
        int AddAmount(int value)
        {
            return amount + value;
        }

        return new Func<int, int>(AddAmount);
    }

    private static void Main()
    {
        Func<int, Func<int, int>> makeAdder = MakeAdder;

        Func<int, int> addFive = makeAdder(5);
        int result = addFive(3);

        Console.WriteLine(result);
    }
}
```

Output:

```text output=nested-functions
8
```

`MakeAdder` accepts one integer and returns a callable value. Its local function `AddAmount` captures `amount`. The first call supplies `5` as `amount` and returns a function that can add that amount. The second call supplies `3` as `value` and receives `8`.

Now replace the declaration of `makeAdder` with a block-bodied lambda:

```csharp
Func<int, Func<int, int>> makeAdder = (int amount) =>
{
    return (int value) =>
    {
        return amount + value;
    };
};
```

Both invocations remain visible and unchanged. The original `MakeAdder` method is now unused.

The compact alternative is:

```csharp
Func<int, Func<int, int>> makeAdder = amount => value => amount + value;
```

Its structure is `amount => (value => amount + value)`: the outer function returns the inner function. The second arrow is inside the first function's result expression. No integer addition occurs merely because `makeAdder(5)` creates the inner function.

A function accepting two arguments at once would instead have type `Func<int, int, int>` and be called as `add(5, 3)`. These are different call interfaces, even though they can implement the same addition. The nested form retains a chosen argument for a later call. [Anonymous-function nesting](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#1222-anonymous-function-expressions).

<a id="expression-trees"></a>
## 10. The same lambda can describe code instead of supplying a delegate

An **expression tree** is a data structure representing operations in an expression. Other code can examine that structure, transform it, or use it to generate a query for another system. The generic type `Expression<TDelegate>` describes a lambda expression whose call shape is given by `TDelegate`.

An expression tree is not itself a delegate. To invoke a tree in the ordinary way, first compile it to a delegate. [Expression trees](https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/expression-trees/); [executing expression trees](https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/expression-trees/expression-trees-execution).

**Complete program:**

```csharp sample=expression-tree
using System;
using System.Linq.Expressions;

internal static class Program
{
    private static void Main()
    {
        Expression<Func<int, bool>> description = number => number > 0;

        Console.WriteLine(description.Body.NodeType);

        Func<int, bool> test = description.Compile();
        Console.WriteLine(test(5));
    }
}
```

Output:

```text output=expression-tree
GreaterThan
True
```

`description.Body.NodeType` reports that the represented body is a greater-than operation. `description.Compile()` produces the callable `test`. `test(5)` then executes the comparison.

There are two nested type lists. The inner `Func<int, bool>` describes the input and output types. The outer `Expression<...>` says we are holding an expression-tree representation with that shape.

### A genuinely verbose construction of this tree

Replacing the lambda with an ordinary named method would not express the same tree. Instead, here is an explicit construction. These are alternative statements inside `Main`, with `using System.Linq.Expressions;`:

```csharp
ParameterExpression numberParameter =
    Expression.Parameter(typeof(int), "number");

ConstantExpression zero = Expression.Constant(0);

BinaryExpression comparison =
    Expression.GreaterThan(numberParameter, zero);

Expression<Func<int, bool>> description =
    Expression.Lambda<Func<int, bool>>(
        comparison,
        numberParameter);
```

A `ParameterExpression` represents the parameter rather than holding one invocation's integer. `typeof(int)` supplies a runtime description of the integer type. The string `"number"` supplies the represented parameter's name. `zero` represents the constant; `comparison` connects the parameter and constant through a greater-than operation. The last call creates the lambda tree with that body and parameter.

The previous `description.Body.NodeType`, `Compile`, and invocation statements can follow these replacements. [Building expression trees](https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/expression-trees/expression-trees-building).

This is a useful expansion precisely because it shows what is being constructed. A block-bodied lambda containing `return number > 0;` cannot be converted by the compiler to this expression-tree target. Expression trees support a restricted subset of source-language constructs; not every valid lambda can become one. [Expression-tree restrictions](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/expression-tree-restrictions).

### Why this matters in query code

`Enumerable.Where` accepts a delegate for in-process sequence filtering. `Queryable.Where` accepts an expression tree that a query provider can inspect. A database provider may translate supported operations into SQL. Similar-looking `.Where(...)` calls can therefore use different mechanisms depending on the selected method and source type. Not every provider can translate every represented operation. [Queryable.Where](https://learn.microsoft.com/en-us/dotnet/api/system.linq.queryable.where?view=net-10.0).

The dependable question is not “Did someone write a lambda?” It is “What does the receiving declaration require: a delegate or an expression tree?”

<a id="nested-types"></a>
## 11. Three closing brackets can simply close three lists

A **dictionary** associates keys with values. In `Dictionary<string, int>`, keys are strings and values are integers. Its two type arguments do not describe function inputs and outputs.

We now have the ingredients for a type that initially looked forbidding:

```csharp
Dictionary<string, Func<int, Task<bool>>>
```

Read it from the inside outward. `Task<bool>` represents an operation with a successful Boolean result. `Func<int, Task<bool>>` describes a callable value accepting an integer and returning that task. The dictionary associates string keys with those callable values.

Break the punctuation across lines without changing its meaning:

```csharp
Dictionary<
    string,
    Func<
        int,
        Task<bool>
    >
>
```

The first closing bracket closes `Task<bool>`. The second closes `Func<int, Task<bool>>`. The third closes the dictionary's type-argument list. The consecutive `>>>` in the single-line spelling is not a bit shift in this type context. [Type-argument grammar](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/types#84-constructed-types).

A **complete use**, without an async lambda or an asynchronous delay:

```csharp sample=nested-types
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

internal static class Program
{
    private static Task<bool> IsPositiveAsync(int number)
    {
        bool result = number > 0;
        return Task.FromResult(result);
    }

    private static async Task Main()
    {
        Dictionary<string, Func<int, Task<bool>>> tests =
            new Dictionary<string, Func<int, Task<bool>>>();

        tests.Add("positive", IsPositiveAsync);

        Func<int, Task<bool>> selectedTest = tests["positive"];
        Task<bool> pendingResult = selectedTest(5);
        bool result = await pendingResult;

        Console.WriteLine(result);
    }
}
```

Output:

```text output=nested-types
True
```

`Task.FromResult` creates an already-successfully-completed task holding the result. A method can return `Task<bool>` without containing the `async` keyword. The return type describes its interface; `async` selects a way to implement it. [Task.FromResult](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.task.fromresult?view=net-10.0).

The four statements beginning with `selectedTest` keep the operations separate: lookup, invocation, awaiting, and printing. Combining them would save space, but it would remove exactly the intermediate types that make the example legible.

<a id="constraints"></a>
## 12. Constraints: what the type supplied for `T` must support

A **constraint** restricts which types may be supplied for a generic type parameter. The generic implementation can then rely on the requirement it states.

An **interface** declares capabilities that an implementing type must provide. `IComparable<T>` provides a method named `CompareTo` for comparing against a value of type `T`. The result is negative, zero, or positive according to whether the receiver precedes, equals, or follows the argument in that type's ordering. It is not required to return exactly `-1` or `1`. [IComparable<T>](https://learn.microsoft.com/en-us/dotnet/api/system.icomparable-1?view=net-10.0).

**Complete program:**

```csharp sample=constraint
using System;

internal static class Program
{
    private static T Larger<T>(T first, T second)
        where T : IComparable<T>
    {
        if (first.CompareTo(second) >= 0)
        {
            return first;
        }

        return second;
    }

    private static void Main()
    {
        int result = Larger<int>(7, 12);
        Console.WriteLine(result);
    }
}
```

Output:

```text output=constraint
12
```

`Larger<T>` declares the placeholder. `where T : IComparable<T>` requires its supplied type to implement comparison against that same type. For the call shown, substitute `int` in both places: the supplied type must implement `IComparable<int>`.

The constraint is not an instruction for a type to inherit from itself. The repeated `T` connects the implementing type to the comparison argument's type.

The `>=` in the method compares the integer returned by `CompareTo` with zero. The closing `>` in `IComparable<T>` closes a type-argument list. Those two characters have different jobs in the same method.

The example uses integers, so `first` cannot be null. The interface constraint alone would not make a reference-type argument non-null at runtime. A general-purpose API accepting reference types must state and handle its null policy.

Also, implementing `IComparable<T>` does not automatically make `first > second` legal in generic code. That expression asks for an operator; the constraint shown provides `CompareTo`. [Constraints](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters).

### Common constraint vocabulary

| Declaration fragment | What it establishes |
| --- | --- |
| `where T : class` | A reference-type requirement; nullable annotations refine its meaning. |
| `where T : struct` | A non-nullable value type. |
| `where T : SomeInterface` | Implementation of the named interface. |
| `where T : BaseClass` | The named class or a class derived from it. |
| `where T : new()` | An accessible public parameterless constructor, allowing `new T()`. |
| `where T : unmanaged` | A non-nullable value type containing no managed-reference fields, recursively. |
| `where T : notnull` | A non-nullable type requirement, enforced through nullable analysis rather than a runtime null check. |
| `where T : allows ref struct` | Permission for a by-reference-only structure type to be used; generic code must respect its lifetime restrictions. |

These are fragments, not arbitrary clauses that can all be combined. Ordering and compatibility restrictions apply. `new()` comes after ordinary constraints; `allows ref struct`, introduced in C# 13, follows them. The special `default` constraint addresses certain overriding or explicitly implementing generic members rather than declaring an ordinary “default type.” The reference defines the complete rules. [Constraint combinations](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters).

### Generic math: requiring an operator explicitly

The generic-math interfaces introduced with .NET 7 and C# 11 make capabilities such as addition available to generic code. `IAdditionOperators<TSelf, TOther, TResult>` names the left operand type, right operand type, and result type. Its members include a static abstract addition operator: the interface requires an implementing type to provide an appropriate operator. [Generic math](https://learn.microsoft.com/en-us/dotnet/standard/generics/math).

**Class member, with `using System.Numerics;`:**

```csharp
private static T Add<T>(T left, T right)
    where T : IAdditionOperators<T, T, T>
{
    return left + right;
}
```

**Calling code:**

```csharp
int total = Add<int>(7, 5); // 12
```

The first `T` inside `IAdditionOperators` is the left operand type. The second is the right operand type. The third is the result type. The repeated names require all three to be the same supplied type in this method.

A broader constraint, `where T : INumber<T>`, requires a larger collection of numeric capabilities. It is appropriate when those capabilities are actually needed. Neither declaration is a recursive invocation; these are type requirements.

<a id="variance"></a>
## 13. `in` and `out` inside a generic declaration

**Variance** concerns which constructed interface or delegate types can be used in place of others. Its safest introduction is through what a consumer is allowed to do, rather than through the labels alone.

Suppose code can enumerate strings:

```csharp
IEnumerable<string> words = new List<string> { "north", "south" };
IEnumerable<object> objects = words;
```

This assignment is safe because every string yielded by `words` is also an object. The `IEnumerable<object>` view lets its consumer retrieve objects; it does not grant permission to add an arbitrary object to the original list.

The interface's type parameter is declared with `out`: `IEnumerable<out T>`. This supports **covariance**, allowing the result-facing conversion shown. The conversion uses a relationship between reference types. It does not make `IEnumerable<int>` convertible to `IEnumerable<object>` through the same variance rule. [Covariance and contravariance](https://learn.microsoft.com/en-us/dotnet/standard/generics/covariance-and-contravariance).

Now consider a function that can consume any object.

**Class member:**

```csharp
private static void PrintObject(object value)
{
    Console.WriteLine(value);
}
```

**Inside `Main`:**

```csharp
Action<object> printObject = PrintObject;
Action<string> printString = printObject;

printString("north");
```

The assignment is safe: a function able to handle any object can certainly handle a string. This input-facing conversion is **contravariance**. The declaration of `Action<in T>` marks that type parameter with `in`.

For `Func<in T, out TResult>`, the parameter type is input-facing and the result type is output-facing. The full framework declaration can include additional constraints; these modifiers explain the variance relationship. [Variance in delegates](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/variance-in-delegates).

By contrast, `List<string>` cannot simply become `List<object>`. Such a conversion would let the receiving code add, say, a `Counter` object to a list that promises strings. `List<T>` is **invariant** in this respect.

The `in` and `out` modifiers here belong to generic type-parameter declarations. They are not the ordinary `in` or `out` modifiers on method parameters. The same words participate in different rules depending on where they appear.

<a id="unbound"></a>
## 14. Empty brackets, commas, and generic attributes

`typeof` produces a runtime `Type` object describing a type. It also has syntax for referring to a generic type definition without supplying its arguments:

**Inside `Main`:**

```csharp
Type listDefinition = typeof(List<>);
Type dictionaryDefinition = typeof(Dictionary<,>);
Type integerList = typeof(List<int>);
```

`List<>` leaves one generic position unspecified. `Dictionary<,>` leaves two. The comma separates positions; it is not a missing expression that needs to be filled before `typeof` can work. This spelling is an **unbound generic type** reference. [The typeof operator](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/type-testing-and-cast#the-typeof-operator).

That special syntax does not make these valid variable declarations or object creations:

```csharp
// Invalid C#:
List<> values;
new List<>();
```

C# 14 also permits unbound generic types inside `nameof`:

```csharp
string listName = nameof(List<>);          // "List"
string dictionaryName = nameof(Dictionary<,>); // "Dictionary"
```

`nameof` produces a name string. It does not create a `Type` object or an instance. Earlier C# versions require a supported bound spelling such as `nameof(List<int>)` for this particular use. [Unbound generics in nameof](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-14.0/unbound-generic-types-in-nameof).

You may also encounter **open constructed types**, such as `List<T>` inside a generic declaration. Unlike `List<>`, `List<T>` supplies an argument: another type parameter. `List<int>` is closed because it no longer contains an unspecified type parameter. These distinctions matter in reflection and compiler terminology; they are not three spellings for the same thing.

### Square brackets outside, angle brackets inside

An **attribute** attaches metadata to a declaration. Beginning in C# 11, an attribute class can be generic. [Generic attributes](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-version-history).

**Declarations outside `Program`, with `using System;`:**

```csharp
internal sealed class TypeTagAttribute<T> : Attribute
{
}

[TypeTag<int>]
internal sealed class Report
{
}
```

The square brackets apply an attribute to `Report`. The angle brackets supply `int` to the generic attribute class. Attribute-name syntax permits omitting the `Attribute` suffix, which is why the application says `TypeTag<int>` rather than `TypeTagAttribute<int>`.

The type arguments used when applying a generic attribute must meet the attribute rules; an unresolved type parameter from a surrounding generic declaration cannot simply replace `int` here. The application is metadata, not a lambda or a method call.

<a id="shifts"></a>
## 15. Bit shifts: follow the bits at the actual operand width

A **bit shift** moves an integer's bits toward more- or less-significant positions. The left operand is the integer being shifted. The right operand determines how many positions to move. Bits shifted beyond the operand width are discarded; they do not wrap around to the other end.

For these examples, `int` and `uint` are 32-bit types. `int` is signed; `uint` is unsigned. `long` and `ulong` are 64-bit. The native-sized `nint` and `nuint` depend on the process's native width, so do not silently substitute them into a diagram assuming 32 bits. [Integral numeric types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/integral-numeric-types).

### Left and right with a nonnegative value

**Inside `Main`:**

```csharp
int original = 12;
int left = original << 1;  // 24
int right = original >> 1; // 6
```

All 32 bits are shown:

```text
original    00000000 00000000 00000000 00001100   12
<< 1        00000000 00000000 00000000 00011000   24
>> 1        00000000 00000000 00000000 00000110    6
```

`<<` fills the vacated low-order positions on the right with zero bits. For a nonnegative signed integer, `>>` fills the vacated positions on the left with zero bits too. [Bitwise and shift operators](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators).

### Why `>>` and `>>>` are different

A signed negative integer uses a representation whose most-significant bit is one. A right shift using `>>` on a signed integer repeats that sign bit in the newly vacated positions. This is an **arithmetic right shift**.

A **logical right shift** fills those positions with zeros. `>>` does this for unsigned operands; `>>>`, introduced in C# 11, does it even when the operand is signed. The result type of `>>>` is not automatically changed to an unsigned type. [Unsigned right shift](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators).

**Complete program:**

```csharp sample=shifts
using System;

internal static class Program
{
    private static void Main()
    {
        int original = -8;
        int arithmetic = original >> 2;
        int logical = original >>> 2;

        Console.WriteLine(original);
        Console.WriteLine(arithmetic);
        Console.WriteLine(logical);
        Console.WriteLine(-5 / 2);
        Console.WriteLine(-5 >> 1);
        Console.WriteLine(1 << 32);
        Console.WriteLine(1L << 40);
    }
}
```

Output:

```text output=shifts
-8
-2
1073741822
-2
-3
1
1099511627776
```

The first three results correspond to:

```text
original    11111111 11111111 11111111 11111000           -8
>> 2        11111111 11111111 11111111 11111110           -2
>>> 2       00111111 11111111 11111111 11111110   1073741822
```

The type of `logical` is still `int`. Clearing its highest positions happens to produce a positive value in this example.

### Shifting is not a universal replacement for multiplication or division

The program also prints two answers for `-5`. Integer division by two truncates toward zero, producing `-2`. Arithmetic right shifting by one produces `-3`. Therefore `number >> 1` is not generally interchangeable with `number / 2` for signed integers. [Integer division](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/arithmetic-operators#division-operator-).

Likewise, a left shift can discard significant bits. For a 32-bit `int`, `1 << 31` sets the sign bit and produces `int.MinValue`, rather than a positive integer too large for `int`. The shift itself does not report arithmetic overflow even in a checked context. Conversions surrounding an operation have their own rules, so do not expand that statement into a claim that every cast involving a shifted result is safe.

### Why shifting by 32 can leave an integer unchanged

For built-in shifts on `int` and `uint`, only the lowest five bits of the shift count are used. The effective count is `count & 31`. For `long` and `ulong`, the lowest six bits are used: `count & 63`.

Consequently, `1 << 32` shifts by zero and returns `1`. `1 << 40` shifts by eight and returns `256`. In `1L << 40`, the `L` makes the left operand a `long`, and a forty-position shift is available. Even negative shift counts are processed through these masking rules; they are not a request to shift in the opposite direction. [Shift counts](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators#shift-count-of-the-shift-operators).

### A byte may be promoted before it is shifted

**Inside `Main`:**

```csharp
byte small = 128;
int widened = small << 1;

Console.WriteLine(widened); // 256

unchecked
{
    small <<= 1;
}

Console.WriteLine(small); // 0
```

The ordinary shift promotes `small` to `int` before operating. Its result is `256`, not an eight-bit value. The compound assignment converts the result back into `byte`; the explicit unchecked context makes the narrowing behavior clear. The low eight bits are zero.

A diagram showing only eight bits and labeling the ordinary expression `small << 1` as a byte-valued zero would teach the wrong operation.

### The assignment forms

The built-in integer forms combine shifting and assignment:

| Compound form | Corresponding operation for a simple `int` variable |
| --- | --- |
| `number <<= count` | `number = number << count` |
| `number >>= count` | `number = number >> count` |
| `number >>>= count` | `number = number >>> count` |

There are qualifications: compound assignment evaluates its left-hand location only once, and narrowing conversions can differ from a naive rewritten assignment. C# 14 also permits explicitly declared compound-assignment operators on user-defined types. We will examine one next. [Compound assignment](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/bitwise-and-shift-operators#compound-assignment).

### A practical use: extracting a packed field

A **mask** is a bit pattern used to keep or select particular positions. Bitwise `&` keeps a bit only when both corresponding input bits are one.

Suppose an unsigned integer stores three eight-bit color channels in the low twenty-four bits, in the numeric layout `0xRRGGBB`. Hexadecimal digits each represent four bits.

**Inside `Main`:**

```csharp
uint packed = 0x0012AB34u;
uint red = (packed >> 16) & 0xFFu;
uint green = (packed >> 8) & 0xFFu;
uint blue = packed & 0xFFu;

Console.WriteLine(red);   // 18
Console.WriteLine(green); // 171
Console.WriteLine(blue);  // 52
```

Shifting right by sixteen moves the red field to the low end. `0xFFu` contains eight low-order one bits, so the mask keeps that field and clears everything above it. The green expression moves its field by eight positions before masking; the blue field is already in position.

This operation concerns the integer's value. **Endianness** concerns how a multibyte representation arranges that value's bytes in memory or a byte stream. The numeric extraction does not reverse direction on a little-endian machine. Decoding the integer from external bytes is a separate step, for which .NET provides explicitly named little- and big-endian reading methods. [BinaryPrimitives](https://learn.microsoft.com/en-us/dotnet/api/system.buffers.binary.binaryprimitives?view=net-10.0).

Finally, use parentheses rather than making the reader recall the precedence table. `1 << 2 + 1` groups as `1 << (2 + 1)`, giving `8`; `(1 << 2) + 1` gives `5`. The parentheses are part of the explanation, not clutter to be optimized away.

<a id="custom-operators"></a>
## 16. Custom types can give operators custom behavior

**Operator overloading** means declaring what an operator does for a user-defined type. C# does not let an author overload arbitrary punctuation: the language specifies which operators are overloadable and what declarations they require.

For example, these declarations go outside `Program`:

```csharp
internal readonly struct Score
{
    public int Points { get; }

    public Score(int points)
    {
        Points = points;
    }

    public static bool operator >(Score left, Score right)
    {
        return left.Points > right.Points;
    }

    public static bool operator <(Score left, Score right)
    {
        return left.Points < right.Points;
    }
}
```

**Inside `Main`:**

```csharp
Score first = new Score(12);
Score second = new Score(7);

Console.WriteLine(first > second); // True
```

The outer comparison selects `Score`'s `operator >`. That method compares the integer `Points` values using the built-in integer operator. The programmer has explicitly chosen what ordering a score means.

C# requires `<` and `>` to be declared as a pair. `<=` and `>=` form another required pair. Declaring one pair does not generate the other pair or supply a complete, mathematically consistent ordering on the author's behalf. [Operator overloading](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/operator-overloading).

The binary shift operators can also be overloaded. Their names do not guarantee that an arbitrary custom type performs the same machine-integer operation as `int`. Inspect the selected declaration.

### C# 14: a compound operator can be declared directly

A user-defined compound-assignment operator is an instance member with one explicit parameter and a `void` return type. The following **complete program** targets C# 14:

```csharp sample=compound-csharp14
using System;

internal sealed class ShiftRegister
{
    public uint Bits { get; private set; }

    public ShiftRegister(uint bits)
    {
        Bits = bits;
    }

    public void operator <<=(int count)
    {
        Bits <<= count;
    }
}

internal static class Program
{
    private static void Main()
    {
        ShiftRegister register = new ShiftRegister(3);
        ShiftRegister sameRegister = register;

        register <<= 2;

        Console.WriteLine(register.Bits);
        Console.WriteLine(sameRegister.Bits);
    }
}
```

Output:

```text output=compound-csharp14
12
12
```

Both variables refer to the same object. The compound operator updates that object's `Bits`. This type does not even declare a binary `<<` operator, so rewriting the call as `register = register << 2` is not a valid expansion.

The inner `Bits <<= count` still uses built-in unsigned-integer behavior. The outer `register <<= 2` selects the user-defined instance operator. Same symbol sequence; different selected operations. [User-defined compound assignment](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-14.0/user-defined-compound-assignment).

<a id="pointers"></a>
## 17. Pointers: `->` and `delegate*<...>`

A **pointer** holds a memory address. C# pointer operations require an unsafe context under the C# 14 rules used here, and the project must enable `AllowUnsafeBlocks`. These examples are for recognizing and understanding the syntax, not a recommendation to replace ordinary managed code with pointers. The programmer is responsible for valid addresses and lifetimes. [Unsafe code](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/unsafe-code).

### `->` accesses a member through a pointer

`pointer->First` means “access the `First` member of the structure at the address held in `pointer`.” Its explicit counterpart is `(*pointer).First`: dereference the pointer, then access the member.

### `delegate*` declares a function-pointer type

A **function pointer** holds an address through which a function can be called. In `delegate*<int, int, int>`, the first two entries are parameter types and the last is the return type. This is special function-pointer grammar, not a generic class named `delegate*`.

The following **complete program** demonstrates both pointer forms. Set `<AllowUnsafeBlocks>true</AllowUnsafeBlocks>` in the console project's property group before compiling it.

```csharp sample=pointers
using System;

internal struct Pair
{
    public int First;
    public int Second;
}

internal static class Program
{
    private static int Add(int left, int right)
    {
        return left + right;
    }

    private static unsafe void Main()
    {
        Pair pair = new Pair();
        pair.First = 4;
        pair.Second = 5;

        Pair* pointer = &pair;

        Console.WriteLine(pointer->First);
        Console.WriteLine((*pointer).First);

        delegate*<int, int, int> operation = &Add;
        int result = operation(4, 5);

        Console.WriteLine(result);
    }
}
```

Output:

```text output=pointers
4
4
9
```

`&pair` obtains the local structure's address. `&Add` obtains the static method's address. `operation(4, 5)` calls through the function pointer. The example does not return a pointer to a local variable or keep one after its valid lifetime.

The arrow `->` belongs to member access. The brackets after `delegate*` delimit a parameter-and-return-type list. Neither is lambda syntax.

### The additional pieces in an unmanaged function pointer

You may encounter a declaration such as this inside an unsafe context:

```csharp
delegate* unmanaged[Cdecl]<int, int, int> operation;
```

This declaration alone does not initialize `operation`, and it must not be called before a valid compatible address is supplied.

A **calling convention** specifies low-level rules for passing arguments and returning from a function call. `unmanaged[Cdecl]` identifies an unmanaged calling convention; `Cdecl` names a particular convention. `delegate* managed<...>` explicitly chooses the managed convention, which is the default when no convention is written. `unmanaged` without a bracketed convention uses the platform's default unmanaged convention.

The type list still means two integers in, one integer out. Unlike `Func`, a function-pointer signature may put `void` in the return position: `delegate*<int, void>` accepts one integer and returns no value; `delegate*<void>` takes no parameters and returns no value.

A function pointer is not a delegate object carrying a captured environment. You cannot replace `&Add` with an arbitrary capturing lambda. The declaration must match the actual target's signature and calling convention. [Function pointers](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/unsafe-code#function-pointers).

Pointer values also support comparisons such as `<` and `>`. Those compare addresses, not the values stored at those addresses. Seeing comparison syntax in unsafe code therefore requires another check of operand types. [Pointer operators](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/pointer-related-operators).

<a id="lambda-reference"></a>
## 18. A few more abbreviated function forms worth recognizing

The core decoding method does not change, but several details commonly interrupt reading.

### An empty parameter list still declares a function

**Named class member:**

```csharp
private static int Answer()
{
    return 42;
}
```

**Inside `Main`:**

```csharp
Func<int> answer = Answer;
int result = answer();
```

**Lambda alternative:**

```csharp
Func<int> answer = () => 42;
int result = answer();
```

`Func<int>` has no input type arguments; its sole type argument is the return type. `()` before the arrow declares a parameterless function. `()` after `answer` invokes it. Those two empty parenthesis pairs do different jobs.

### `var` can hide the delegate type too

Since C# 10, a lambda with enough information can have a compiler-inferred natural delegate type:

```csharp
var test = (int number) => number > 0;
```

For this simple lambda, the inferred type is `Func<int, bool>`. The explicitly written parameter type supplies the missing input information. This does not make the following declaration valid:

```csharp
// Invalid: no target type establishes the type of number.
var test = number => number > 0;
```

The compiler does not generally deduce a lambda parameter's type by guessing from its body. Either the lambda must provide the necessary information or an applicable target context must provide it. [Natural function types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-10.0/lambda-improvements#natural-function-type).

### `_` does not always mean the same thing

In a lambda such as `(_, _) => 42`, repeated underscore parameters are discards: the function accepts the arguments but does not name them for use in the body. A single `_` parameter is treated as an ordinary parameter name for compatibility with older code. The underscore in a switch arm, by contrast, belongs to a discard pattern. [Lambda parameters](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions#input-parameters-of-a-lambda-expression).

In event code, the event declaration supplies the handler's expected delegate type. An event publisher supplies the arguments when it raises the event. Names such as `sender` and `args` are descriptive choices, not implicit global variables supplied by the arrow. Keep the delegate or use a named method when a handler must later be unsubscribed; writing a fresh lambda with matching text is not a reliable way to identify the earlier subscription. [Subscribing and unsubscribing](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/events/how-to-subscribe-to-and-unsubscribe-from-events).

### A parameter can refer to the caller's variable

`ref` on a parameter allows the function to operate through a reference to the caller's variable rather than through an ordinary by-value parameter.

Declare this delegate outside `Program`:

```csharp
internal delegate void IntegerUpdater(ref int value);
```

**Named class member:**

```csharp
private static void Increase(ref int value)
{
    value++;
}
```

**Inside `Main`:**

```csharp
IntegerUpdater update = Increase;
int count = 1;
update(ref count);
Console.WriteLine(count); // 2
```

**Explicitly typed lambda replacement for `update`:**

```csharp
IntegerUpdater update = (ref int value) =>
{
    value++;
};
```

**C# 14 alternative:**

```csharp
IntegerUpdater update = (ref value) =>
{
    value++;
};
```

C# 14 allows certain parameter modifiers without requiring the type annotation. The delegate declaration still determines the type, and `ref` still changes how the argument is passed. `ref`, `out`, `in`, and `ref readonly` therefore cannot be treated as decoration to discard while expanding a lambda. `params` still requires an explicitly typed lambda parameter list. [C# 14 lambda parameters](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14#simple-lambda-parameters-with-modifiers).

C# 12 also permits default parameter values and parameter arrays in lambda declarations. For example, `var increment = (int value = 1) => value + 1;` can be called as `increment()`. Its inferred delegate carries the needed optional-parameter information. Assigning a similar lambda to an existing `Func<int, int>` does not make that predefined delegate's parameter optional. The type of the value being invoked remains decisive. [Lambda defaults and parameter arrays](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions).

<a id="boundaries"></a>
## 19. Sometimes you have left C# expression syntax entirely

A C# project can contain several languages and several kinds of output. Punctuation must be interpreted within the right one.

### XML documentation

Inside a documentation comment, these brackets are XML markup:

```csharp
/// <summary>
/// Returns the supplied value.
/// </summary>
/// <typeparam name="T">The value's type.</typeparam>
private static T Echo<T>(T value)
{
    return value;
}
```

The tags in the comments structure documentation. The brackets in `Echo<T>` declare a C# type parameter. Literal comparison signs inside XML documentation need appropriate escaping, such as `&lt;` for `<`. Generic references in a `cref` attribute can use braces, as in `<see cref="List{T}"/>`, to avoid colliding with XML's delimiters. [XML documentation tags](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/xmldoc/recommended-tags).

### Razor, HTML, XAML, and strings

Razor combines markup with C#. A pair such as `<p>...</p>` is markup, not a generic type application. Generic method calls can require an explicit Razor expression, for example `@(Echo<int>(42))` when an appropriate `Echo` method is available, because an implicit expression can otherwise collide with markup parsing. [Razor syntax](https://learn.microsoft.com/en-us/aspnet/core/mvc/views/razor?view=aspnetcore-10.0).

In a XAML file, `<Button ... />` describes an object using XAML's markup syntax. Its presence beside C# code does not make it a C# expression. [XAML overview](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/xaml/).

Inside an ordinary C# string literal such as `"<p>Hello</p>"`, the brackets are characters in a string. They may later be interpreted by another system, but they are not comparison operators at the point where the C# string is written.

Also, `<>` is not C#'s inequality operator. Write `!=` for inequality. Adjacent empty generic delimiters, XML markup, and compiler-generated names require their own context; none makes standalone `a <> b` valid C# inequality.

### Names produced by the compiler

A debugger, stack trace, or decompiler may show names resembling:

```text
<Name>k__BackingField
<RunAsync>d__7
<>c__DisplayClass0_0
<>f__AnonymousType0
```

These forms can identify generated backing fields, async state-machine types, captured-variable containers, or anonymous types. The numeric suffixes and exact naming conventions depend on the compiler and generated code. Roslyn's implementation contains explicit routines for creating these names. [Roslyn generated names](https://github.com/dotnet/roslyn/blob/main/src/Compilers/CSharp/Portable/Symbols/Synthesized/GeneratedNames.cs).

The brackets are not secret generic parameters that the reader ought to know how to write. These names belong to generated metadata or a tool's representation of it, not ordinary handwritten C# identifiers.

Reflection can also show a generic type name with a backtick and a count, such as `List` followed by `` `1 ``. That count records the number of generic parameters. It is another presentation of type information, not source-level shift or arrow syntax. [Type.Name](https://learn.microsoft.com/en-us/dotnet/api/system.type.name).

<a id="decoding"></a>
## 20. A recovery procedure for unfamiliar code

When an expression is hard to read, do not start by inventing a story for each punctuation mark. Establish its surroundings.

**First, classify the location.** Are you reading a type, an executable expression, a declaration, a pattern, documentation, markup, or generated output? A run of `>>>` inside a type-argument list is not interpreted the same way as `number >>> 2`.

**Then identify the complete pieces of syntax.** Pair generic delimiters from the inside outward. Treat `=>`, `->`, `>=`, and `>>>=` as complete forms in their appropriate contexts. Whitespace and surrounding grammar matter; do not split an operator into independent characters simply because its pieces are visually familiar.

**Recover the declarations supplying the missing information.** For a lambda passed to a method, inspect that method's selected overload and the relevant parameter type. Work out each lambda parameter type, the required return type, and whether the target is callable behavior or an expression tree. Type inference and overload selection can constrain each other; use the compiler's selected declaration rather than guessing from one candidate signature.

**Recover execution separately.** Find the invocation, who supplies its arguments, what happens to its result, and which surrounding variables it captures. For queries and async operations, distinguish creating a value, invoking a callback, enumerating results, and awaiting completion. One line can conceal several of these stages.

An editor can help. Visual Studio's Quick Info displays declarations, Parameter Info exposes method parameter details, and Go To Definition or Peek Definition can reveal the receiving declaration. Those tools are part of reading code, not evidence that the reader has failed to memorize enough syntax. [IntelliSense](https://learn.microsoft.com/en-us/visualstudio/ide/using-intellisense?view=visualstudio); [Go To and Peek Definition](https://learn.microsoft.com/en-us/visualstudio/ide/go-to-and-peek-definition?view=visualstudio).

An expanded rewrite is useful once it has a stated purpose. Does it preserve the call's results in this example? Does it preserve evaluation count, deferred execution, captures, asynchronous completion, and the target type? Is it a valid source replacement, or only a sketch of what the implementation does? Say which one before relying on it.

<a id="exercises"></a>
## 21. Try the reading method on code that has changed

These exercises use the earlier console context. Their answers are explanations, not a test of whether you prefer shorter code.

### Exercise A: two calls, two parameter declarations

```csharp
Func<int, Func<int, bool>> atLeast =
    minimum => value => value >= minimum;

Func<int, bool> atLeastTen = atLeast(10);
bool result = atLeastTen(12);
```

What is declared by each name before an arrow? What does each call return? Which value is retained between the calls?

**Answer:** `minimum` is an integer parameter of the outer function. `value` is an integer parameter of the inner function. The outer call returns `Func<int, bool>` and the inner call returns `bool`. The returned function captures the outer invocation's `minimum`, which contains `10`; the comparison `12 >= 10` yields true.

A named expansion is this **class member**:

```csharp
private static Func<int, bool> CreateMinimumTest(int minimum)
{
    bool MeetsMinimum(int value)
    {
        return value >= minimum;
    }

    return MeetsMinimum;
}
```

Replace the declaration of `atLeast` with `Func<int, Func<int, bool>> atLeast = CreateMinimumTest;` and keep the two calls.

### Exercise B: identify all three jobs performed by greater-than characters

```csharp
Func<int, int> halveBits = value => value >>> 1;
int result = halveBits(-2);
```

**Answer:** the first `>` closes the generic type-argument list. The next belongs to `=>`. The last three form unsigned right shift. The parameter and result types are both `int`. `-2` has thirty-one high one bits followed by a zero; shifting logically right by one clears the top position and gives `2147483647`.

The expanded **class member** is:

```csharp
private static int HalveBits(int value)
{
    return value >>> 1;
}
```

The replacement declaration is `Func<int, int> halveBits = HalveBits;`. Despite its name, this function is not ordinary signed division by two. A better production name would describe the intended bit operation.

### Exercise C: count functions, not arrows

```csharp
private static string Describe(int value) => value switch
{
    < 0 => "negative",
    _ => "not negative"
};
```

**Answer:** this declares one named method and no lambdas. Its first arrow introduces the method's expression body. The others separate patterns from switch results. An expanded method uses an `if (value < 0)` returning `"negative"`, followed by `return "not negative";`.

### Exercise D: decide whether the expansion is valid

With `using System.Linq.Expressions;`, consider:

```csharp
Expression<Func<int, bool>> rule = value => value >= 18;
```

Can the right-hand side be replaced with this?

```csharp
// Invalid for the expression-tree target above:
(int value) =>
{
    return value >= 18;
}
```

**Answer:** no. The compiler does not convert a statement-bodied lambda to an expression tree. The block would work for a compatible delegate target, but changing the target from `Expression<Func<int, bool>>` to `Func<int, bool>` would also change what the variable holds. A faithful verbose tree construction uses a parameter node, a constant node, a `GreaterThanOrEqual` node, and `Expression.Lambda<Func<int, bool>>`.

### Return to the opening line

```csharp
Func<int, bool> test = number => number > 0;
```

`Func<int, bool>` specifies a callable value with an integer parameter and Boolean result. The first `number` declares that parameter. `=>` introduces its expression body. The final `>` compares the supplied integer with zero. Assignment creates the callable value; an invocation supplies the integer and performs the comparison.

You can keep that spelling. You can replace it with a named method. What matters is that neither choice now requires guessing where the missing information lives.

---

### Example verification

The companion verification script extracts the **complete programs** marked in this article and checks their stated outputs under C# 14 / .NET 10. It does not certify every illustrative fragment, every possible program behavior, or the quality of the prose. The source is `scripts/test-csharp-angles.py` in the Rough at Sea repository; run it with `python scripts/test-csharp-angles.py`. A missing SDK is a failure, not a passing result. The unsafe example runs only the local, bounded pointer operations shown above.
