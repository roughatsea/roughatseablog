---
title: "C++ Pointers: From Address Of to What on Earth Is 1[numbers]?"
description: "A patient, example-filled guide to pointers, references, arrays, strange declarations, lifetime traps, function pointers, and modern ownership."
heroImage: "/images/notes/essential-coding-patterns-for-senior-engineers.webp"
heroImageAlt: "A software architect faces a modular city threaded with pink and blue streams of code."
date: 2026-10-12
publishedAt: 2026-10-12T08:37:31-07:00
tags:
  - cpp
  - software-engineering
  - programming-languages
  - learning
  - pointers
---

Someone teaches you a useful rule: an ampersand means “address of,” and an asterisk means “value at.” You try it. It works. Then you discover that an array frequently behaves like a pointer, that an ampersand also declares a reference, and that C++ cheerfully accepts this:

```cpp
2[numbers]
```

Your suspicion that something has gone wrong is reasonable. The compiler, however, is following its rules.

We will begin with ordinary variables and work toward those rules. Each surprising example has a reason. Understanding that reason is more useful than collecting punctuation tricks, although we will certainly collect some punctuation tricks.

**Prerequisites:** knowing that a variable stores a value is enough to begin. Later examples introduce functions and small classes as needed. **Version:** examples target C++20. We avoid relying on newer preview features. This is a broad guide to the important surprises, rather than a claim to enumerate every possible interaction in the language.

## A route through the article

Read the first five sections in order. After that, use this map to revisit a particular problem.

| Question | Section |
| --- | --- |
| What do `&` and `*` mean? | [Start with a value](#start-with-a-value) |
| What is a reference? | [References give an object another name](#references-give-an-object-another-name) |
| How can a function change my pointer? | [Functions receive copies unless you ask otherwise](#functions-receive-copies-unless-you-ask-otherwise) |
| Are arrays pointers? | [Arrays are objects; decay produces pointers](#arrays-are-objects-decay-produces-pointers) |
| Why is `1[numbers]` legal? | [The bracket surprise](#the-bracket-surprise) |
| What does `int (*p)[3]` mean? | [Pointers to arrays and arrays of pointers](#pointers-to-arrays-and-arrays-of-pointers) |
| What do `const`, `auto`, and parentheses change? | [Read the punctuation deliberately](#read-the-punctuation-deliberately) |
| Why did a valid pointer become dangerous? | [Lifetime: the address can outlive the object](#lifetime-the-address-can-outlive-the-object) |
| Can a pointer identify a function or member? | [Pointers to things you can call](#pointers-to-things-you-can-call) and [Pointers to members](#pointers-to-members) |
| Does a cast make an address safe? | [Types are promises about access](#types-are-promises-about-access) |
| What should I use in everyday code? | [Ownership and modern alternatives](#ownership-and-modern-alternatives) |
| Can I test my understanding? | [Worked exercises](#worked-exercises) |

## Start with a value

An **object**, in the C++ sense, is a region of storage that contains a value and has a type. An ordinary integer variable names such an object:

```cpp
int number = 42;
```

`int` is an integer type. `number` is the name. `=` initializes it with `42`. The semicolon ends the declaration.

The object occupies a location in memory. Imagine its address is `0x1000`. The prefix `0x` marks a hexadecimal number. This is an illustrative address; your program will almost certainly use another one.

A **pointer** holds a value that can designate an object, such as that integer.

```cpp
int* pointer = &number;
```

Read this in two parts:

- `int* pointer`: declare a pointer to an integer.
- `&number`: obtain the address of the integer named `number`.

The pointer is a separate object. It has its own storage and its own address.

| Expression | What it gives you |
| --- | --- |
| `number` | The integer object; reading it yields `42` |
| `&number` | A pointer to that integer |
| `pointer` | The pointer object; reading it yields the stored address |
| `*pointer` | The integer object reached through the stored address |
| `&pointer` | A pointer to the pointer object itself |

The unary `*` operator performs **dereferencing**, also called **indirection**. “Unary” means it takes one operand. Here its operand is `pointer`.

“Value at” is a useful mnemonic. “Object at” is more precise because the result can be assigned to:

```cpp
*pointer = 99;
```

That statement changes `number` to `99`.

Contrast it with changing the pointer:

```cpp
int first = 10;
int second = 20;

int* pointer = &first;
*pointer = 30;       // first becomes 30.

pointer = &second;  // pointer now points to second.
*pointer = 40;       // second becomes 40.
```

The first change remains in effect. Redirecting a pointer does not undo work previously done through it.

### A complete program you can run

```cpp
#include <iostream>

int main()
{
    int number = 42;
    int* pointer = &number;

    std::cout << number << '\n';
    std::cout << pointer << '\n';
    std::cout << *pointer << '\n';

    *pointer = 99;

    std::cout << number << '\n';
}
```

`#include <iostream>` makes the standard input/output facilities available. `main` is the program's entry function. Its braces enclose the statements it executes.

`std::cout` is the standard output stream. `std::` says the name belongs to the standard library's namespace. The `<<` operator sends each following value to the stream. `'\n'` is a newline character. Here `<<` performs output; with integers in other contexts it can perform a bit shift.

The output contains `42`, an address, `42`, and `99`, on separate lines.

Unless a later block says “complete program,” examples are independent fragments. Statements normally go inside `main`; function and class definitions go outside it. Add the indicated headers. Repeated variable names belong to separate examples, not one enormous scope.

### Declaration punctuation is different from expression punctuation

```cpp
int* pointer = &number;
```

The first `*` declares a pointer type. It does not dereference anything. The `&` on the right obtains an address.

| Context | `*` | `&` |
| --- | --- | --- |
| Declaration | Pointer declarator | Reference declarator |
| Expression, one operand | Dereference | Address of |
| Expression, two operands | Multiplication | Bitwise AND |

The grammar tells the compiler which meaning applies. Spacing does not:

```cpp
int* firstPointer = &number;
int *secondPointer = &number;
```

Both declare pointers. But every variable in a multi-variable declaration needs its own asterisk:

```cpp
int* first, second;  // first is a pointer; second is an int.
int *third, *fourth; // Both are pointers.
```

Separate declarations avoid this trap. These declarations also do not initialize local variables; initialize a pointer before using its value.

## References give an object another name

A **reference** is an alias for an existing object:

```cpp
int number = 42;
int& alias = number;

alias = 99;  // Changes number.
```

The `&` is part of the declaration. We are binding `alias` to `number`, rather than obtaining an address.

You use the reference with ordinary variable syntax. There is no `*alias` to write.

A reference cannot be rebound by assignment:

```cpp
int first = 10;
int second = 20;
int& alias = first;

alias = second;  // Copies 20 into first.
```

Afterward, `alias` still refers to `first`. Assignment changes the referred-to object's value.

A pointer can be redirected and can be null. An ordinary lvalue reference must be initialized to refer to a suitable object. It can nevertheless become dangling if that object's lifetime ends. A reference does not keep its target alive.

“Lvalue reference” is the category declared with one `&`. C++ also has rvalue references, declared with `&&`, used in moving values and forwarding arguments. Two ampersands there are a different type construction, not two applications of “address of.”

## Functions receive copies unless you ask otherwise

A function groups instructions under a name. Parameters are the named inputs it receives.

```cpp
void changeValue(int value)
{
    value = 99;
}
```

`void` means the function returns no value. This function receives its own integer copy:

```cpp
int number = 10;
changeValue(number);  // number remains 10.
```

A pointer parameter is also copied, but both pointer copies designate the same target:

```cpp
void changeThroughPointer(int* target)
{
    if (target != nullptr)
    {
        *target = 99;
    }
}
```

`nullptr` is the null-pointer literal: it represents pointing to no object. `!=` means “not equal.” The `if` executes its body only when its condition is true.

```cpp
int number = 10;
changeThroughPointer(&number);  // number becomes 99.
```

The function changes the caller's integer through the copied address.

Assigning to the pointer parameter itself has a different effect:

```cpp
void clearLocalCopy(int* target)
{
    target = nullptr;
}
```

```cpp
int number = 10;
int* pointer = &number;

clearLocalCopy(pointer);  // pointer still points to number.
```

To change the caller's pointer, accept a **reference to a pointer**:

```cpp
void clearCallerPointer(int*& target)
{
    target = nullptr;
}
```

Read `int*&` as “reference to a pointer to an integer.”

```cpp
clearCallerPointer(pointer);  // pointer now is null.
```

A pointer to a pointer is another option:

```cpp
void clearCallerPointerAnotherWay(int** target)
{
    if (target != nullptr)
    {
        *target = nullptr;
    }
}
```

```cpp
int* pointer = &number;
clearCallerPointerAnotherWay(&pointer);
```

Here `target` points to the caller's pointer variable. One dereference reaches that variable. Two would reach the integer, provided both pointer levels were valid.

### Copying an address does not copy its target

```cpp
int number = 42;
int* first = &number;
int* second = first;

*second = 70;  // number becomes 70.
```

There are two pointer objects and one integer object.

To copy the integer instead:

```cpp
int separateNumber = *first;
separateNumber = 80;  // number remains 70.
```

## Arrays are objects; decay produces pointers

An **array** contains a fixed number of elements of one type, stored consecutively:

```cpp
int numbers[3] = {10, 20, 30};
```

`[3]` declares three elements. The braces supply their initial values. Indexes begin at zero:

| Expression | Value |
| --- | --- |
| `numbers[0]` | 10 |
| `numbers[1]` | 20 |
| `numbers[2]` | 30 |

The array is not a pointer. In many expressions it **converts to a pointer to its first element**. This is array-to-pointer conversion, often called **decay**:

```cpp
int* pointer = numbers;
// Same pointer value as:
int* anotherPointer = &numbers[0];
```

The array does not store a hidden pointer as its first element. Its first element is the integer `10`.

### Decay does not happen everywhere

```cpp
sizeof(numbers)  // Size of the entire array, in bytes.
sizeof(pointer)  // Size of the pointer object, in bytes.
```

`sizeof` asks for a size; these expressions do not read the integer values. If an integer occupies four bytes and this pointer occupies eight, the answers are twelve and eight. Those sizes are examples, not universal guarantees.

Decay also does not occur when taking the array's address or binding an array reference:

```cpp
int (*wholeArray)[3] = &numbers;
int (&arrayAlias)[3] = numbers;
```

We will unpack those declarations shortly. `decltype(numbers)`, which asks the compiler for the declared type, also preserves the array type.

Arrays cannot be assigned wholesale with ordinary `=`:

```cpp
int other[3] = {40, 50, 60};

pointer = other;      // Valid: redirect the pointer.
// numbers = other;  // Compilation error.
```

### Function parameter brackets are misleading

These declarations describe the same parameter type:

```cpp
void inspect(int numbers[]);
void inspect(int numbers[3]);
void inspect(int* numbers);
```

They are alternative spellings of a pointer parameter. The compiler **adjusts** an array parameter declaration to a pointer declaration. The `3` does not enforce an argument length.

Inside such a function, `sizeof(numbers)` measures a pointer, and the parameter has no built-in record of the original array's length.

An array reference can preserve a particular extent:

```cpp
void inspectExactlyThree(const int (&numbers)[3])
{
    std::cout << numbers[2] << '\n';
}
```

This accepts a three-element integer array. The `const` prevents modification through this reference.

For flexible lengths, C++20 provides `std::span`, introduced later.

### Type deduction can decay an array too

`auto` asks the compiler to infer a variable's type from its initializer:

```cpp
int numbers[3] = {10, 20, 30};

auto pointer = numbers;       // int*: decay occurs.
auto& arrayAlias = numbers;   // Reference to the three-int array.
```

Adding `&` changes what is being deduced. `auto` is convenient, but it does not mean “preserve every aspect of the initializer's type.”

## The bracket surprise

For the ordinary built-in indexing we are using:

```cpp
numbers[1]
```

selects the same object as:

```cpp
*(numbers + 1)
```

The array converts to a pointer. Adding one advances to the next integer. Dereferencing accesses that integer.

Both `pointer + integer` and `integer + pointer` are permitted. Therefore:

```cpp
numbers[1]
*(numbers + 1)
*(1 + numbers)
1[numbers]
```

all select the same element.

Yes, the integer may be an expression:

```cpp
int numbers[4] = {10, 20, 30, 40};
int myVar = 1;

std::cout << (myVar + 1)[numbers]; // Prints 30.
std::cout << numbers[myVar + 1];   // Prints 30.
```

The parentheses group `myVar + 1` as the operand to the left of the brackets.

This works because built-in indexing needs one pointer or array operand and one integral operand. It does not insist that the pointer be on the left.

A `std::vector` is a class with its own indexing operation:

```cpp
#include <vector>

std::vector<int> values = {10, 20, 30};

values[1];       // Valid.
// 1[values];    // Compilation error.
```

The reversed spelling is not a general rule for every class that supports brackets.

### Why did C++ allow this?

C++ inherited this indexing behavior from C. Reversed indexing follows from the indexing and pointer-addition rules; it was not necessary to invent a separate reverse-index feature.

Retaining those rules supports compatibility with C. That explains the behavior without requiring us to guess what Bjarne Stroustrup privately thought about this particular spelling.

Use `numbers[1]` in ordinary code. Knowing why `1[numbers]` works is useful; making colleagues read it is a separate decision.

### A small but important qualification: order of evaluation

The examples above have no side effects. A **side effect** changes program state, as `index++` does.

In C++20, the expression on the left of built-in brackets is evaluated before the expression inside them. Swapping complicated operands can therefore change their evaluation order. The value-selection symmetry is not permission to rearrange expressions that change variables.

Even expanding brackets into an addition expression can change sequencing details. Keep the simple equivalence as your learning model; keep side effects out of clever indexing.

Primary reference: [C++ draft: subscripting](https://eel.is/c++draft/expr.sub).

## Pointer arithmetic has boundaries

```cpp
int numbers[4] = {10, 20, 30, 40};
int* pointer = numbers;

pointer = pointer + 1;
std::cout << *pointer;  // Prints 20.
```

The increment is one **element**, not one byte. Its size depends on the pointed-to type.

You can subtract pointers within the same array:

```cpp
int* first = &numbers[0];
int* last = &numbers[3];

std::cout << last - first;  // Prints 3.
```

The result has type `std::ptrdiff_t`, a signed integer type for pointer differences. It counts element positions. It is not a general-purpose way to measure the byte gap between unrelated objects.

### One past the end is a useful stopping point

```cpp
int* begin = numbers;
int* end = numbers + 4;

for (int* current = begin; current != end; ++current)
{
    std::cout << *current << '\n';
}
```

A `for` loop has an initialization, condition, and update separated by semicolons. `++current` advances the pointer by one element.

The one-past pointer `end` is valid to form and use as a boundary. It does not point to an element you can read:

```cpp
// *end;             // Undefined behavior.
// numbers + 5;      // Undefined behavior even just forming it.
```

**Undefined behavior** means the C++ rules impose no requirements on the program's behavior for that operation. It might crash, appear to work, or produce surprising results after optimization. It does not mean “the compiler must report an error.”

### Negative indexes can be valid

```cpp
int* middle = &numbers[2];

std::cout << middle[-1];  // Prints 20.
```

`middle[-1]` means `*(middle - 1)`. It stays within the original array. From the beginning, the same negative index would go outside it.

### A single object acts like a one-element array for this purpose

```cpp
int number = 42;
int* pointer = &number;

int* end = pointer + 1;  // Valid one-past pointer.
// *end;                // Cannot read it.
// pointer + 2;         // Outside the permitted range.
```

Two unrelated variables that happen to occupy adjacent addresses do not become an array.

For pointer arithmetic and subtraction, consult [additive operators](https://eel.is/c++draft/expr.add).

## Pointers to arrays and arrays of pointers

These declarations look similar but describe different structures:

```cpp
int* pointers[3];
int (*arrayPointer)[3];
```

The first declares **an array of three pointers to integers**. The second declares **a pointer to an array of three integers**.

Read outward from the variable name, respecting parentheses:

- `pointers[3]`: an array of three; `int*`: its elements are integer pointers.
- `(*arrayPointer)`: a pointer; `[3]`: to a three-element array; `int`: of integers.

A concrete example:

```cpp
int numbers[3] = {10, 20, 30};

int* elementPointer = numbers;
int (*arrayPointer)[3] = &numbers;

std::cout << *elementPointer;     // 10.
std::cout << (*arrayPointer)[1];  // 20.
```

The two pointers designate the same starting location, but different kinds of object:

```cpp
elementPointer + 1;  // Next integer.
arrayPointer + 1;   // One past the entire three-int array.
```

The second expression does not magically create a second array. Here it reaches a boundary that cannot be dereferenced.

### A two-dimensional array contains rows, not pointers

```cpp
int grid[2][3] = {
    {1, 2, 3},
    {4, 5, 6}
};

int (*rowPointer)[3] = grid;
// int** wrong = grid;  // Compilation error.
```

`grid` is a two-element array whose elements are three-integer arrays. Decay produces a pointer to its first row.

```cpp
std::cout << rowPointer[1][2];  // Prints 6.
```

The first index selects a row. The second selects an integer in that row.

By contrast, this really does provide pointer objects for an `int**`:

```cpp
int firstRow[3] = {1, 2, 3};
int secondRow[3] = {4, 5, 6};

int* rows[2] = {firstRow, secondRow};
int** rowPointers = rows;
```

Those rows need not be adjacent in memory.

One further trap: the integers in `grid` are contiguous, but an `int*` into its first inner row does not give you unrestricted permission to traverse every row.

```cpp
int* firstRowElement = &grid[0][0];

// firstRowElement[4];  // Goes beyond its inner three-int array.
```

Use `grid[row][column]` or a deliberately flat array when you want flat indexing.

## Read the punctuation deliberately

### Constant target versus constant pointer

`const` restricts modification. Its position matters:

```cpp
int first = 10;
int second = 20;

const int* readOnly = &first;
readOnly = &second;  // Allowed.
// *readOnly = 30;   // Compilation error.

int* const fixed = &first;
*fixed = 30;         // Allowed.
// fixed = &second;  // Compilation error.
```

| Declaration | Redirect pointer? | Modify target through pointer? |
| --- | --- | --- |
| `int* p` | Yes | Yes |
| `const int* p` | Yes | No |
| `int* const p` | No | Yes |
| `const int* const p` | No | No |

`int const* p` means the same as `const int* p`.

A read-only access path does not freeze an originally mutable object:

```cpp
int number = 42;
const int* readOnly = &number;

number = 99;
std::cout << *readOnly;  // Prints 99.
```

### Extra pointer levels make adding const less simple

```cpp
int* pointer = nullptr;
const int* readOnly = pointer;  // Allowed.

int** indirect = &pointer;
// const int** dangerous = indirect;  // Forbidden.
```

If the second conversion were permitted, the following hole would exist:

```cpp
const int permanent = 42;
int* writable = nullptr;

// Hypothetical code: the first line is rejected.
// const int** indirect = &writable;
// *indirect = &permanent;
// *writable = 99;  // Would attempt to change a const object.
```

The intermediate pointer needs a restriction too:

```cpp
const int* const* safe = &writable;  // Allowed.
```

`safe` provides access to a const pointer to a const integer. You cannot use `*safe` to replace `writable` with the address of a constant.

The language's [qualification conversion rules](https://eel.is/c++draft/conv.qual) formalize this.

### Increment and dereference group differently

```cpp
int numbers[3] = {10, 20, 30};
int* pointer = numbers;
```

Consider each expression independently, starting from that setup:

| Expression | Grouping | Resulting change |
| --- | --- | --- |
| `*pointer++` | `*(pointer++)` | Advance pointer; access its old target |
| `(*pointer)++` | As written | Increment the first integer |
| `*++pointer` | `*(++pointer)` | Advance pointer; access its new target |
| `++*pointer` | `++(*pointer)` | Increment the first integer |

Postfix increment, with `++` after its operand, supplies the old value while incrementing. Prefix increment supplies the updated value.

Separate statements are often kinder:

```cpp
int value = *pointer;
++pointer;
```

### The arrow follows a pointer before accessing a member

A `struct` defines a type containing named members:

```cpp
struct Player
{
    int health;
};

Player player{100};
Player* pointer = &player;

pointer->health = 75;
(*pointer).health = 50;
```

Both assignments modify `player.health`. The arrow `->` combines pointer dereferencing and member access.

The parentheses in `(*pointer).health` matter. `*pointer.health` groups as `*(pointer.health)`, trying to use dot access on the pointer itself.

### Even address-of can be overloaded

Classes can define custom meanings for certain operators. A class can overload unary `&`, so `&object` need not use ordinary address-of.

When generic code needs the actual address, the library provides:

```cpp
#include <memory>

auto actualAddress = std::addressof(player);
```

For our plain `Player`, ordinary `&player` works normally. The surprise matters when writing reusable code for unfamiliar classes.

## Character pointers have special behavior

```cpp
const char* text = "Hello";
std::cout << text;  // Prints Hello, rather than an address.
```

A string literal contains characters followed by a **null terminator**, a character with value zero. This terminator is different from a null pointer.

The output stream treats `const char*` as the beginning of a terminated string.

To print the address:

```cpp
std::cout << static_cast<const void*>(text);
```

`static_cast<T>(expression)` requests a specified conversion to type `T`. Angle brackets enclose the target type.

A literal's characters must not be modified:

```cpp
const char* literal = "Hello";
// literal[0] = 'J';  // Compilation error.

char editable[] = "Hello";
editable[0] = 'J';    // Allowed; this is a separate mutable array.
```

Printing an unterminated character array as a string can read outside it:

```cpp
char letters[3] = {'A', 'B', 'C'};
// std::cout << letters;  // No terminator: unsafe string output.

std::cout.write(letters, 3);  // Writes exactly three characters.
```

Embedded nulls stop ordinary string output early:

```cpp
const char text[] = {'A', '\0', 'B', '\0'};
std::cout << text;  // Prints only A.
```

Pointers to `signed char` and `unsigned char` also have character-oriented stream overloads. A pointer type can influence an operation far beyond arithmetic.

## Lifetime: the address can outlive the object

A useful pointer must satisfy more than “contains an address.” Its target must still exist, the access must respect its type, and any indexing must stay within bounds.

### Null and uninitialized are different

```cpp
int* empty = nullptr;  // Explicitly no target.
int* unknown;          // Local pointer has no initialized value.
```

Neither can be dereferenced as written. Do not even inspect `unknown` before assigning it a valid value.

`nullptr` has its own type, `std::nullptr_t`. It converts to pointer types:

```cpp
void inspect(int value) {}
void inspect(int* pointer) {}

inspect(0);        // Chooses the integer overload.
inspect(nullptr); // Chooses the pointer overload.
```

An **overload** is one of multiple functions sharing a name but having different parameter types. Legacy `NULL` definitions can complicate overload resolution. Prefer `nullptr`.

### A boolean check is only a null check

```cpp
if (pointer)
{
    // pointer is non-null; that alone does not establish safety.
}
```

A dangling pointer can be non-null. The condition neither validates its target's lifetime nor checks bounds.

### A pointer cannot rescue a local variable

```cpp
int* makeNumber()
{
    int local = 42;
    return &local;  // Wrong: local dies as the function returns.
}
```

The code may compile with a warning. Its returned pointer dangles. Return the integer value instead:

```cpp
int makeNumber()
{
    return 42;
}
```

Returning a reference to `local` would have the same lifetime problem.

### Temporary strings can leave immediate dangling pointers

```cpp
#include <string>

std::string makeText()
{
    return "Hello";
}
```

```cpp
// const char* bad = makeText().c_str();
// Temporary string dies at the end of that statement.

std::string text = makeText();
const char* good = text.c_str();
```

`c_str()` provides a pointer to the string's terminated character storage. `good` remains usable only while that storage remains valid. Destroying or performing an invalidating modification on `text` can invalidate it.

### Containers can relocate their contents

```cpp
#include <vector>

std::vector<int> numbers = {10, 20, 30};
int* pointer = &numbers[0];

numbers.reserve(numbers.capacity() + 1);
// pointer now dangles: reserve had to reallocate.
```

A vector manages a dynamic array. `capacity()` reports how many elements its allocation can accommodate. `reserve` requests capacity without adding elements.

A `push_back` may invalidate pointers if growth requires reallocation. Other operations have other invalidation rules; for example, vector erasure invalidates references and iterators at or after the erased position. Consult the specific operation rather than assuming all container edits behave alike.

A view such as `std::span` does not prevent invalidation. It can retain both an address and a length while its entire target has disappeared.

### Reused addresses do not prove continuing identity

An allocator may use an old location for a new object. A recorded numeric address therefore does not prove that the original object still exists. Storage, object lifetime, and object identity are related concepts, not interchangeable ones. Advanced storage-reuse code has additional lifetime rules; ordinary code should avoid retaining stale pointers.

## Allocation and destruction must match

```cpp
int* pointer = new int{42};
```

`new` obtains storage and creates an integer initialized to `42`. The object survives until it is destroyed explicitly:

```cpp
delete pointer;
pointer = nullptr;
```

`delete` destroys and deallocates the object. It does not automatically clear your pointer variable.

Copies are not cleared either:

```cpp
int* first = new int{42};
int* second = first;

delete first;
first = nullptr;

// second still dangles.
// delete second;  // Would attempt a second deletion.
```

### Arrays have a different deletion form

```cpp
int* values = new int[3]{10, 20, 30};
delete[] values;
```

Match `new` with `delete`, and `new[]` with `delete[]`. Do not delete a pointer into the middle of an allocation or the address of an ordinary local object.

Deleting a null pointer is permitted:

```cpp
int* pointer = nullptr;
delete pointer;  // Safe.
```

### C allocation is a separate family

`std::malloc` and `std::free`, from `<cstdlib>`, form another allocation family. Do not mix them with `new` and `delete`.

For classes, `malloc` does not call constructors, and `free` does not call destructors. A **constructor** initializes a new class object; a **destructor** performs cleanup when its lifetime ends. Modern C++ has subtle rules for creating some simple objects in allocated storage, but those rules do not turn `malloc` into a general class-construction operation.

Most application code should use containers and ownership objects rather than manage these pairs manually.

## Pointers to things you can call

A pointer can designate a function:

```cpp
int add(int first, int second)
{
    return first + second;
}

int (*operation)(int, int) = &add;
```

Read outward from `operation`:

1. `(*operation)`: a pointer.
2. `(int, int)`: to a function taking two integers.
3. Initial `int`: returning an integer.

Both call forms work:

```cpp
std::cout << operation(3, 4);     // 7.
std::cout << (*operation)(3, 4);  // 7.
```

The parentheses with arguments perform the call.

A function name can convert to a function pointer:

```cpp
operation = add;  // & is optional here.
```

### Parentheses distinguish two entirely different declarations

```cpp
int* obtain(int value);   // Function returning int*.
int (*operation)(int);    // Pointer to function returning int.
```

A type alias removes repeated punctuation:

```cpp
using Operation = int (*)(int, int);
Operation operation = &add;
```

`using` introduces a new name for an existing type. `Operation` is not a new kind of object.

For an overloaded function name, a target pointer type can select the intended overload:

```cpp
int twice(int value) { return value * 2; }
double twice(double value) { return value * 2; }

int (*operation)(int) = &twice;  // Selects int twice(int).
// auto ambiguous = &twice;     // No target type to select an overload.
```

### Repeated dereferencing can be legal

With `operation` pointing to `add`:

```cpp
operation(2, 3);
(*operation)(2, 3);
(**operation)(2, 3);
(***operation)(2, 3);
```

All return `5`. Dereferencing produces a function expression, which can convert back to a function pointer before another dereference.

For an integer pointer, the first dereference yields an integer, so the trick stops:

```cpp
int number = 42;
int* pointer = &number;

// **pointer;  // Compilation error: an int cannot be dereferenced.
```

### Some lambdas convert to function pointers

A **lambda** creates an unnamed function object:

```cpp
auto doubleValue = [](int value)
{
    return value * 2;
};

int (*operation)(int) = doubleValue;
```

The `[]` is the capture list. Empty brackets mean this lambda captures no surrounding variables. `(int value)` declares its parameter.

A lambda that captures state generally cannot convert to an ordinary function pointer:

```cpp
int multiplier = 3;

auto multiply = [multiplier](int value)
{
    return value * multiplier;
};

// int (*operation)(int) = multiply;  // Compilation error.
```

`[multiplier]` stores a copy of that surrounding variable in the function object. A plain function pointer provides no companion storage for this captured state.

Reference: [function-to-pointer conversion](https://eel.is/c++draft/conv.func). For lambda details, see [lambda closure types](https://eel.is/c++draft/expr.prim.lambda.closure).

## Pointers to members

An ordinary pointer designates a particular object. A **pointer to a member** can identify a member before you choose an instance.

```cpp
struct Player
{
    int health;
    int mana;
};

int Player::* selectedMember = &Player::health;
```

`Player::health` names the member within the type. `int Player::*` means “pointer to an integer member of Player.”

Apply it to an instance with `.*`:

```cpp
Player player{100, 50};

std::cout << player.*selectedMember;  // 100.

selectedMember = &Player::mana;
std::cout << player.*selectedMember;  // 50.
```

Apply it through an object pointer with `->*`:

```cpp
Player* pointer = &player;
std::cout << pointer->*selectedMember;  // 50.
```

These are real operators, not typographical accidents.

### Member functions also require an instance

```cpp
struct Player
{
    int health = 100;

    void heal(int amount)
    {
        health += amount;
    }
};

void (Player::*action)(int) = &Player::heal;

Player player;
(player.*action)(25);  // health becomes 125.

Player* pointer = &player;
(pointer->*action)(25); // health becomes 150.
```

`+=` adds to the existing value and stores the result. The outer parentheses group member selection before the call.

A member-function pointer supplies the operation. The object supplies the instance. It is not interchangeable with an ordinary function pointer.

### The instance is available through this

Inside a non-static member function:

```cpp
void heal(int amount)
{
    this->health += amount;
}
```

`this` is a pointer to the current instance. The shorter `health += amount` accesses the same member.

A `static` member function belongs to the class without requiring an instance. It has no `this`; its address can be an ordinary function pointer.

A pointer-to-member's representation may encode an offset or more complicated information. Do not assume its size matches an object pointer, or that it is an ordinary address you can convert to `void*`.

## Types are promises about access

### void* forgets an object's type

```cpp
int number = 42;
void* untyped = &number;
```

`void*` can hold an object pointer without specifying its object type. You cannot directly dereference it:

```cpp
int* typed = static_cast<int*>(untyped);
std::cout << *typed;  // 42.
```

The conversion back is appropriate because the original object is an integer.

```cpp
double* wrong = static_cast<double*>(untyped);
// *wrong;  // Invalid access: there is no double object here.
```

A cast does not transform the object. Standard C++ also provides no arithmetic on `void*`, because there is no element size to step by. Some compilers offer extensions; portable code should not rely on them.

Ordinary object pointers convert to `void*`. Function pointers have different rules; a function-pointer/void-pointer conversion is not universally portable.

### reinterpret_cast does not grant permission

`reinterpret_cast<T>` requests certain low-level conversions:

```cpp
int number = 42;
double* pointer = reinterpret_cast<double*>(&number);

// std::cout << *pointer;  // Undefined behavior.
```

Potential problems include the wrong object type and inadequate alignment. **Alignment** describes the address boundaries on which a type may be stored.

For inspecting an object's bytes, special access rules permit character-byte types such as `unsigned char`. A C++20 library approach makes the intent clearer:

```cpp
#include <cstddef>
#include <span>

int number = 42;
std::span<int> objectView(&number, 1);
auto bytes = std::as_bytes(objectView);

for (std::byte byte : bytes)
{
    std::cout << std::to_integer<unsigned int>(byte) << ' ';
}
```

`std::byte` represents a byte of storage. `std::as_bytes` creates a read-only byte view. The byte sequence depends on the platform, including its integer representation and byte order.

If you need to copy a representation into another suitable type, investigate C++20's `std::bit_cast`, whose size and type requirements are checked. It still does not promise that every arbitrary bit pattern is a valid value.

### Removing const only helps when the original object was mutable

```cpp
int number = 42;
const int* readOnly = &number;

int* writable = const_cast<int*>(readOnly);
*writable = 99;  // Allowed: number was not declared const.
```

But:

```cpp
const int permanent = 42;
const int* readOnly = &permanent;

int* writable = const_cast<int*>(readOnly);
// *writable = 99;  // Undefined behavior.
```

The cast removes a restriction from the access path. It cannot revoke the actual object's constness.

### Not every object provides an ordinary pointer target

A bit-field packs a specified number of bits:

```cpp
struct Flags
{
    unsigned int ready : 1;
};

Flags flags{};
// auto pointer = &flags.ready;  // Compilation error.
```

Its member is not an independently addressable ordinary object.

References do not have their own ordinary pointer-to-reference type. Taking `&alias` obtains the address of the object it refers to.

And `std::vector<bool>` has special packed-storage behavior:

```cpp
std::vector<bool> flags(3);
flags[0] = true;

// bool* pointer = &flags[0];  // Not an ordinary bool element address.
```

Its indexed result acts as a **proxy**, an object that performs boolean access on behalf of packed storage.

## Inheritance can adjust pointers

Inheritance lets a type contain a base-class part:

```cpp
struct First
{
    int first = 1;
};

struct Second
{
    int second = 2;
};

struct Combined : First, Second
{
};

Combined object;

Combined* whole = &object;
Second* part = whole;
```

`Combined` has both base subobjects. Converting to `Second*` may adjust the address to reach the `Second` part within it.

It is therefore too simple to say that every pointer conversion leaves the numeric address unchanged.

### Deletion through a base pointer needs the right destructor

```cpp
struct Base
{
    virtual ~Base() = default;
};

struct Derived : Base
{
};

Base* pointer = new Derived;
delete pointer;
```

The tilde names a destructor. `virtual` makes destruction select the appropriate derived behavior. `= default` asks the compiler to supply the normal implementation.

For this ordinary `new Derived` / `delete Base*` pattern, a non-virtual base destructor would make deletion undefined behavior. A smart pointer does not universally repair an incorrect deletion design.

### An array of derived objects is not an array of bases

Even if one `Derived*` converts to `Base*`, do not use a base pointer to iterate through a derived array:

```cpp
Derived objects[3];
Base* pointer = &objects[0];

// pointer[1];  // Does not safely select the next Derived object's base.
```

The conversion designates one base subobject. It does not turn the surrounding array into a `Base` array.

### Checked downcasts can return null

For polymorphic classes—classes with virtual functions—`dynamic_cast` can check whether an object has a requested derived type:

```cpp
Base ordinary;
Base* pointer = &ordinary;

Derived* derived = dynamic_cast<Derived*>(pointer);
// derived is nullptr: ordinary is not a Derived.
```

A failed pointer downcast returns null. A failed reference downcast instead throws `std::bad_cast`. Those are different failure mechanisms.

Reference: [delete expressions](https://eel.is/c++draft/expr.delete), [dynamic casts](https://eel.is/c++draft/expr.dynamic.cast).

## Addresses are not a universal numeric coordinate system

Within an array, ordering and subtraction are useful:

```cpp
int numbers[3] = {10, 20, 30};
bool earlier = &numbers[0] < &numbers[2];  // true.
```

For unrelated objects, built-in relational comparisons do not provide a universal, portable numeric address order. When a library data structure needs a total ordering of pointers, `std::less` provides the appropriate library ordering:

```cpp
#include <functional>

int first = 1;
int second = 2;

bool order = std::less<int*>{}(&first, &second);
```

The empty braces construct the comparator object. The following parentheses call it. Its order says nothing about an application-level relationship between the integers.

### Pointer sizes are platform properties

`sizeof(int*)` measures that pointer type. Do not infer that every object pointer, function pointer, and pointer-to-member has the same size.

Likewise, a null pointer's representation is not guaranteed to consist of all-zero bits. Assign `nullptr`; do not assume clearing arbitrary pointer storage with byte operations is equivalent.

On platforms that provide it, `std::uintptr_t` is an unsigned integer type that can support round-tripping `void*` through an integer:

```cpp
#include <cstdint>

int number = 42;
void* original = &number;

std::uintptr_t encoded =
    reinterpret_cast<std::uintptr_t>(original);

void* restored = reinterpret_cast<void*>(encoded);
```

This optional type is useful in specialized code. Converting an arbitrary integer into a pointer does not establish that a live object exists there. Arithmetic on an encoded address also does not replace C++'s rules for objects, bounds, and access.

## Ownership and modern alternatives

A raw pointer tells you what it points to. Its type alone does not tell you:

- Who destroys the target.
- How many elements are available.
- How long the target will remain alive.
- Whether another thread may change it.

Modern library types express some of these facts.

### unique_ptr has one owner

```cpp
#include <memory>

auto owner = std::make_unique<int>(42);
std::cout << *owner;  // 42.
```

`std::make_unique<int>` creates an integer and returns an ownership object. The angle brackets provide the element type; the parentheses supply constructor arguments.

The owned integer is destroyed automatically when its owner is destroyed.

A unique owner cannot be copied, but it can be moved:

```cpp
#include <utility>

auto newOwner = std::move(owner);
// owner is now empty; newOwner owns the integer.
```

`std::move` enables the move operation; the ownership transfer occurs in the receiving constructor.

The methods deserve separate readings:

| Method | Meaning |
| --- | --- |
| `get()` | Obtain a raw pointer without transferring ownership |
| `release()` | Relinquish ownership and return the raw pointer |
| `reset()` | Destroy the current target and become empty |
| `reset(p)` | Replace ownership with ownership of the supplied pointer |

A raw pointer from `get()` is a borrower. It can dangle when the owner resets or dies.

Use `release()` only when you have a concrete plan for taking over cleanup. It does not destroy the target.

### shared_ptr shares responsibility for lifetime

```cpp
auto firstOwner = std::make_shared<int>(42);
auto secondOwner = firstOwner;

firstOwner.reset();
std::cout << *secondOwner;  // Still 42.
```

The object remains alive until its last owning shared pointer relinquishes ownership.

The owners coordinate through a **control block** that tracks ownership. Creating two independent control blocks from the same raw pointer is a serious mistake:

```cpp
// int* raw = new int{42};
// std::shared_ptr<int> first(raw);
// std::shared_ptr<int> second(raw);  // Wrong: independent owners.
```

Both would eventually attempt to delete the same object. Copy an existing shared pointer to share its ownership.

### The exposed pointer and owned object can differ

```cpp
struct Player
{
    int health = 100;
};

auto player = std::make_shared<Player>();
std::shared_ptr<int> health(player, &player->health);

player.reset();
std::cout << *health;  // 100; the whole Player remains alive.
```

This is the **aliasing constructor**. `health` exposes a pointer to one member but shares ownership of the complete `Player`.

The supplied target must remain valid while you use it. Aliasing ownership is not a general validation service for arbitrary addresses.

There is an especially strange edge case:

```cpp
std::shared_ptr<int> emptyOwner;
int number = 42;

std::shared_ptr<int> borrowed(emptyOwner, &number);

std::cout << borrowed.use_count();  // 0.
std::cout << static_cast<bool>(borrowed); // true.
```

It has a non-null stored pointer but no owning control block. Its truth value checks the stored pointer, rather than proving ownership. `number` must outlive every access.

Conversely, an aliasing shared pointer can share ownership while storing a null pointer. Pointer presence and ownership are distinct facts.

Reference: [shared pointer constructors](https://eel.is/c++draft/util.smartptr.shared.const).

### const ownership can be shallow

```cpp
const auto owner = std::make_unique<int>(42);

*owner = 99;  // Allowed.
```

The owner object is const; the integer it owns is not.

To make the target read-only through this owner:

```cpp
auto owner = std::make_unique<const int>(42);
// *owner = 99;  // Compilation error.
```

The same distinction appears with shared ownership.

### Shared owners can form cycles

If two objects each own the other through `shared_ptr`, their ownership counts may never reach zero after external owners disappear.

`std::weak_ptr` observes a shared-owned object without extending its lifetime:

```cpp
auto owner = std::make_shared<int>(42);
std::weak_ptr<int> observer = owner;

if (auto temporaryOwner = observer.lock())
{
    std::cout << *temporaryOwner;
}
```

`lock()` obtains temporary shared ownership if the target still exists. Otherwise it returns an empty shared pointer. Use weak ownership for relationships that should not keep the target alive.

### Shared ownership is not shared-data synchronization

Different shared-pointer objects can coordinate their shared ownership safely across threads. That does not make simultaneous modification of the pointed-to integer or class safe.

Neither does it permit unsynchronized modification of the same shared-pointer variable. Thread coordination and target-data synchronization require their own design.

### array, vector, and span solve different problems

| Type | Owns elements? | Length | Typical use |
| --- | --- | --- | --- |
| Built-in array | Contains its elements | Fixed in its type | Low-level or existing interfaces |
| `std::array<T, N>` | Yes | Fixed | Fixed-size collection with value semantics |
| `std::vector<T>` | Yes | Dynamic | Resizable collection |
| `std::span<T>` | No | Carried by the view | Borrow a contiguous sequence |
| `T*` | Ownership unspecified | Not carried | Borrow one object or meet a pointer interface |

`T` is a placeholder for an element type; `N` is a fixed element count.

A span makes a length available to a function:

```cpp
#include <iostream>
#include <span>

void printNumbers(std::span<const int> numbers)
{
    for (int value : numbers)
    {
        std::cout << value << '\n';
    }
}

int main()
{
    int numbers[3] = {10, 20, 30};
    printNumbers(numbers);
}
```

The range-based `for` visits each element and copies its value into `value`.

The span borrows the array; it does not copy or own it. In C++20, ordinary span indexing still does not promise a bounds check. A length helps you write correct code, but it does not remove your responsibility to stay within it.

## A complete example that connects the pieces

```cpp
#include <iostream>
#include <span>

void addBonus(std::span<int> scores, int bonus)
{
    for (int& score : scores)
    {
        score += bonus;
    }
}

void chooseLast(int*& selected, std::span<int> scores)
{
    if (scores.empty())
    {
        selected = nullptr;
        return;
    }

    selected = &scores[scores.size() - 1];
}

int main()
{
    int scores[3] = {10, 20, 30};
    int* selected = &scores[0];

    addBonus(scores, 5);
    chooseLast(selected, scores);

    if (selected != nullptr)
    {
        std::cout << *selected << '\n';  // 35.
    }

    for (int score : scores)
    {
        std::cout << score << '\n';      // 15, 25, 35.
    }
}
```

Walk through it:

1. The array contains three integers. `selected` initially points to the first.
2. `addBonus` receives a span carrying access to those integers and their count.
3. `int& score` binds a reference to each element, so `+=` modifies the originals.
4. `chooseLast` receives a reference to the caller's pointer. Assigning `selected` redirects that caller variable.
5. The empty check prevents subtracting one from a zero length. `return;` ends this void function immediately.
6. For a nonempty span, `size() - 1` gives the final zero-based index.
7. Everything remains alive until `main` ends. No manual allocation is needed.

## Worked exercises

Try predicting the answers before reading the explanations.

### 1. Copy, then redirect

```cpp
int first = 5;
int second = 8;

int* pointer = &first;
int* copy = pointer;

pointer = &second;
*copy = 12;
*pointer = first + 1;
```

**Answer:** `first` is `12`; `second` is `13`. Copying the original pointer gave `copy` its own address value. Redirecting `pointer` did not redirect `copy`.

### 2. The reversed expression

```cpp
int numbers[4] = {10, 20, 30, 40};
int index = 1;

std::cout << (index + 1)[numbers];
```

**Answer:** `30`. The expression selects `numbers[2]`.

### 3. The reference assignment

```cpp
int first = 10;
int second = 20;
int& alias = first;

alias = second;
second = 30;
```

**Answer:** `first` and `alias` give `20`; `second` gives `30`. The assignment copied a value; it did not rebind the reference.

### 4. Which part changes?

```cpp
int numbers[3] = {10, 20, 30};
int* pointer = numbers;

int saved = *pointer++;
(*pointer)++;
```

**Answer:** `saved` is `10`; `pointer` points to the second element; the array contains `10, 21, 30`.

The first statement reads through the old pointer value while advancing it. The second increments the new target.

### 5. A pointer survives; does its target?

```cpp
int* pointer = nullptr;

{
    int local = 42;
    pointer = &local;
}
```

**Answer:** the integer's lifetime ends at the closing brace. The pointer is dangling. A non-null check cannot revive the integer.

### 6. Fixed owner or fixed target?

```cpp
int number = 42;
int* const pointer = &number;

*pointer = 99;
```

**Answer:** valid; `number` becomes `99`. The pointer itself cannot be redirected. Its target remains mutable.

## A small vocabulary worth keeping

| Term | Meaning |
| --- | --- |
| Address-of | Obtain a pointer to an object |
| Dereference / indirection | Access through a pointer |
| Pointee | The object a pointer points to |
| Reference | An alias bound to an object |
| Decay | Common name for array/function conversion to pointers |
| Null pointer | Pointer value designating no object |
| Dangling pointer | Pointer whose former target is no longer valid |
| One-past pointer | An array boundary you may form but not dereference |
| Ownership | Responsibility for managing an object's lifetime |
| Borrowing | Access without taking ownership |
| Invalidation | An event that makes a previously usable access path unusable |
| Undefined behavior | An operation for which the language imposes no behavioral requirements |

When reading unfamiliar pointer code, ask four concrete questions:

1. **What is this variable's actual type?**
2. **Which object does this pointer designate?**
3. **Is that object alive, and is this access within bounds?**
4. **Who owns the object and can invalidate this pointer?**

Then read the punctuation in its context. In a declaration, `*` says what kind of variable you are creating. In an expression, it follows a pointer. `&` can declare an alias or obtain an address. Brackets select an offset—and, occasionally, remind you that a language can be perfectly consistent while looking completely absurd.

## References and further reading

These are primary language and library references. They are precise, but they assume considerably more vocabulary than this article.

- [C++20 draft standard, N4860](https://isocpp.org/files/papers/N4860.pdf): stable version reference for the article's baseline.
- [Array-to-pointer conversion](https://eel.is/c++draft/conv.array), [array declarations](https://eel.is/c++draft/dcl.array), and [function declarations](https://eel.is/c++draft/dcl.fct).
- [Unary operators](https://eel.is/c++draft/expr.unary.op), [subscripting](https://eel.is/c++draft/expr.sub), and [pointer arithmetic](https://eel.is/c++draft/expr.add).
- [Reference declarations](https://eel.is/c++draft/dcl.ref) and [qualification conversions](https://eel.is/c++draft/conv.qual).
- [Object lifetime](https://eel.is/c++draft/basic.life) and [pointer values](https://eel.is/c++draft/basic.compound).
- [Member-pointer operators](https://eel.is/c++draft/expr.mptr.oper) and [lambda closure types](https://eel.is/c++draft/expr.prim.lambda.closure).
- [Vector capacity](https://eel.is/c++draft/vector.capacity), [vector modifiers](https://eel.is/c++draft/vector.modifiers), and [string accessors](https://eel.is/c++draft/string.accessors).
- [Unique pointers](https://eel.is/c++draft/unique.ptr), [shared pointers](https://eel.is/c++draft/util.smartptr.shared), [weak pointers](https://eel.is/c++draft/util.smartptr.weak), and [spans](https://eel.is/c++draft/views.span).
- [Object representations](https://eel.is/c++draft/basic.types), [bit casts](https://eel.is/c++draft/bit.cast), and [pointer ordering utilities](https://eel.is/c++draft/comparisons).
- [Bjarne Stroustrup's C++ FAQ](https://www.stroustrup.com/bs_faq.html): background on C++ and its relationship to C.

The live draft links evolve beyond C++20. For a version-sensitive question, use the corresponding section of N4860 rather than assuming every current-draft addition applies to the examples above.
