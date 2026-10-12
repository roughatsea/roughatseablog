# C++ pointer article: coverage inventory

Prepared before drafting, 2026-10-12. Article target: a clever fourteen-year-old; define syntax before relying on it. Baseline: C++20, with explicitly labeled newer-version notes.

## Foundations
1. Variables, objects, addresses, and illustrative memory locations.
2. Declaration versus expression meanings of * and &.
3. Pointer assignment versus pointed-to-object assignment.
4. References as aliases; binding versus assignment.
5. Null, uninitialized, dangling, and one-past pointers; undefined behavior.
6. Raw pointers do not encode ownership, length, or lifetime.
7. Copying a pointer versus copying its target.
8. Pointer-to-pointer; reference-to-pointer function parameters.

## Arrays and arithmetic
9. Array-to-pointer decay and its exceptions: sizeof, &, references, decltype.
10. Array parameters adjusted to pointers; sizes not enforced.
11. Pointer arithmetic counts elements; same-array subtraction.
12. One-past pointers; formation outside bounds.
13. Negative indexing from interior pointers.
14. Reversed subscripting: 1[a], 2[a], (index + 1)[a].
15. C heritage; compatibility rather than a bespoke reverse-index feature.
16. Operand sequencing qualification: value equivalence is not arbitrary side-effect interchangeability.
17. Array pointer versus element pointer; pointer-to-array declaration.
18. Two-dimensional arrays decay to row pointers, not T**.
19. Contiguous rows do not authorize walking an inner-row pointer through all rows.
20. Arrays of pointers versus pointers to arrays.
21. A single object acts as a one-element array for pointer arithmetic.
22. Array extent preservation with reference parameters; std::array and std::span.

## Declarations and operations
23. Each declarator needs its own *.
24. const pointee versus const pointer; shallow const.
25. Multilevel const conversion trap and safe const intermediate level.
26. Precedence: *p++, (*p)++, *++p, ++*p.
27. -> versus (*p).member.
28. auto versus auto& deduction with arrays.
29. Character pointers print strings; terminators, literal constness, embedded null.
30. void* erases object type; no standard void* arithmetic.
31. Pointer sizes are not universally identical; nullptr need not be all-zero bits.
32. & can be overloaded; std::addressof.
33. Pointers cannot normally designate bit-fields or references; vector<bool> proxy.

## Callable and member pointers
34. Function pointer declaration, decay, call forms, repeated dereference.
35. Returning a pointer versus a pointer to a function; aliases.
36. Overload selection requires a function-pointer target type.
37. Noncapturing lambda conversion; capturing state.
38. Data-member pointers, .* and ->*.
39. Member-function pointers and object-plus-operation calls.
40. this pointer; static members have no this.
41. Ordinary function pointers versus member pointers; representation and void* limits.

## Lifetime, types, and ownership
42. Stack-local and temporary/string c_str() dangling pointers.
43. vector reallocation, string changes, erase, and span invalidation.
44. new versus new[]; matching delete; delete nullptr; no automatic clearing.
45. malloc/free versus new/delete; raw storage versus construction.
46. Base-subobject address adjustment; virtual destructor.
47. Derived arrays are not arrays of bases; pointer stride pitfall.
48. dynamic_cast null on failed pointer downcast.
49. reinterpret_cast, alignment, aliasing, byte inspection, bit_cast.
50. const_cast only permits writing if original object is mutable.
51. unrelated pointer ordering; std::less where a total order is needed.
52. uintptr_t is optional; integer conversion is not permission to invent pointers.
53. unique_ptr move/get/release/reset.
54. shared_ptr aliasing, stored pointer versus ownership, shallow const.
55. Independent shared_ptr control blocks from one raw pointer; double destruction.
56. shared_ptr cycles and weak_ptr.
57. Thread-safe shared ownership does not make target data thread-safe.
58. Address reuse does not establish continuing identity/lifetime.

## Teaching and verification
- Explain int, initialization braces, =, ==, &, *, [], (), ->, ::, templates, auto, casts, and include directives locally.
- Provide complete runnable starter and capstone; short examples explicitly independent.
- Mark compile errors and undefined behavior as commented-out examples.
- Supply worked exercises, vocabulary, practical choices, and primary-source links.
- Avoid claiming exhaustive coverage of every C++ corner case.
- Local compiler/build unavailable: report honestly; use deployed build and live-page verification.
