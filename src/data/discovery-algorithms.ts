export const discoveryAlgorithms = [
  {
    "slug": "linear-search",
    "name": "Linear search",
    "short": "Linear",
    "family": "array-search",
    "prerequisites": "Arrays, indices, and equality comparisons",
    "summary": "Inspect items one at a time until the target appears.",
    "detail": "An array stores items at numbered positions called indices. Linear search starts at index zero and compares each value with a target. It returns the first matching index, or reports that no match exists after reaching the end. No ordering is required.",
    "experiment": "Choose Last item, then Not present. Both require checking every item. Choose Repeated values to see that the first match is returned.",
    "complexity": "Best O(1), worst O(n) value comparisons; O(1) working space. n is the array length.",
    "limitation": "Works on unsorted arrays and small collections. Searching repeatedly through a large collection may justify an index or a different data structure.",
    "reading": "An inspected cell is pink, a rejected cell is faded, and a found cell is green. Indices start at zero.",
    "source": "https://introcs.cs.princeton.edu/java/42sort/"
  },
  {
    "slug": "binary-search",
    "name": "Binary search",
    "short": "Binary",
    "family": "array-search",
    "prerequisites": "Sorted arrays, indices, and comparing values",
    "summary": "Halve a sorted search interval after each comparison.",
    "detail": "Binary search requires values in ascending order. It maintains inclusive lower and upper indices. It compares the middle value with the target. If the middle is too small, every value at or before it can be discarded; if too large, every value at or after it can be discarded. The interval shrinks until a match is found or no candidates remain.",
    "experiment": "Use the same ascending array as Linear search and choose Last item. Compare value-comparison counts. Try Repeated values: this version returns a matching index, which need not be the first.",
    "complexity": "O(log n) worst-case iterations, O(1) working space. The editor additionally validates sorted order in O(n); that validation is separate from the search.",
    "limitation": "An unsorted array invalidates the interval-elimination rule. This editor rejects such inputs instead of silently sorting them. Duplicates are allowed; returning the first match requires a different boundary rule.",
    "reading": "The remaining interval stays cyan, discarded values fade, and the current midpoint is pink. A green cell is the returned match.",
    "source": "https://cp-algorithms.com/num_methods/binary_search.html"
  },
  {
    "slug": "naive-string-search",
    "name": "Naïve string matching",
    "short": "Naïve",
    "family": "string-matching",
    "prerequisites": "Strings, character positions, and comparing characters",
    "summary": "Try the pattern at every possible starting position.",
    "detail": "A string is a sequence of characters. A pattern is the smaller string we want to locate inside a text. The naïve algorithm aligns the pattern with each possible text position and compares characters from left to right. A mismatch moves the alignment one position forward. A full match records that starting index. This version finds all occurrences, including overlapping matches.",
    "experiment": "Choose Repeated prefix. Many candidate alignments agree for a while before failing. Switch to KMP with the same text and pattern and compare character tests. Choose Overlapping to find starts 0, 1, and 2.",
    "complexity": "O(nm) worst-case character comparisons, O(1) working space excluding returned matches. n is text length and m is pattern length.",
    "limitation": "Simple and effective for short patterns. Rechecking a long repeated prefix can be costly. Empty patterns are excluded here to avoid ambiguity about which positions count as matches.",
    "reading": "The pattern is positioned beneath the text. Pink marks the current comparison; cyan marks characters already matched in the current alignment. The match list stores zero-based starting indices.",
    "source": "https://algs4.cs.princeton.edu/53substring/"
  },
  {
    "slug": "kmp-search",
    "name": "Knuth–Morris–Pratt search",
    "short": "KMP",
    "family": "string-matching",
    "prerequisites": "String matching, prefixes, suffixes, and array indices",
    "summary": "Reuse matched prefixes instead of restarting after a mismatch.",
    "detail": "A prefix begins at the start of a string; a suffix ends at its end. KMP first builds a prefix table for the pattern. Each entry records the length of the longest proper prefix that is also a suffix of the pattern through that position. Proper means shorter than the whole substring. On a mismatch, this table tells the search how much of its already matched prefix can be kept. The text cursor never moves backward.",
    "experiment": "Choose Repeated prefix and step through both table construction and text search. Watch j fall back through the prefix table while i stays put. Choose Overlapping: after a complete match, fallback preserves a suffix that could begin another match.",
    "complexity": "O(n + m) time and O(m) working space excluding returned matches. Counters separate prefix-building tests from text-search tests.",
    "limitation": "Pays a preprocessing cost to avoid repeated text work. Exact, case-sensitive matching only. This teaching version splits strings into Unicode code points; it does not normalize accents or combine grapheme clusters.",
    "reading": "During preprocessing, pink pattern cells are compared and the prefix table grows. During search, i is the text cursor and j is the matched-prefix length. A mismatch can change the alignment without consuming the current text character.",
    "source": "https://cp-algorithms.com/string/prefix-function.html"
  },
  {
    "slug": "euclidean-gcd",
    "name": "Euclidean algorithm",
    "short": "Euclid",
    "family": "number-theory",
    "prerequisites": "Whole numbers, divisibility, and remainders",
    "summary": "Find a greatest common divisor through successive remainders.",
    "detail": "A common divisor divides both integers without a remainder. The greatest common divisor, or GCD, is the largest such positive integer. Dividing a by b gives a quotient q and remainder r: a = q × b + r. The common divisors of a and b are exactly those of b and r. Replacing (a, b) with (b, r) therefore preserves their GCD. When b reaches zero, a is the answer.",
    "experiment": "Try 252 and 105, then consecutive Fibonacci numbers such as 233 and 144. The latter require many small reductions. Try one zero input: the other number is immediately the answer.",
    "complexity": "O(log max(a,b)) remainder steps for positive inputs; O(1) stored integers. This treats bounded-integer arithmetic as constant cost.",
    "limitation": "Useful for reducing fractions and checking whether numbers are coprime. Inputs here are nonnegative integers, not fractions. gcd(0,0) is conventionally returned as 0 in this implementation.",
    "reading": "The current pair appears as two blocks. The division history records a, b, q, and r; each next row replaces the pair with b and r.",
    "source": "https://cp-algorithms.com/algebra/euclid-algorithm.html"
  },
  {
    "slug": "extended-euclid",
    "name": "Extended Euclidean algorithm",
    "short": "Extended Euclid",
    "family": "number-theory",
    "prerequisites": "Euclid’s algorithm and integer linear combinations",
    "summary": "Find a GCD and coefficients explaining how the inputs produce it.",
    "detail": "Extended Euclid retains the remainder reduction and tracks its algebra. For original inputs A and B, each current remainder r is stored alongside coefficients x and y such that r = A × x + B × y. Subtracting q times the next remainder updates all three quantities together. When the next remainder becomes zero, the surviving coefficients express the GCD as an integer linear combination of A and B.",
    "experiment": "Use 252 and 105. The result can be written 21 = 252 × (−2) + 105 × 5. Try coprime inputs such as 35 and 12; the final combination equals 1.",
    "complexity": "O(log max(A,B)) quotient steps for positive inputs; O(1) stored integers under the bounded-arithmetic model.",
    "limitation": "Used in modular inverses and integer equations. Coefficients need not be unique. Negative coefficients are valid even though the inputs here are nonnegative. Both-zero inputs return GCD 0 with a valid zero identity.",
    "reading": "Two rows hold successive remainders and their coefficients. Every recorded row satisfies A × x + B × y = r. The quotient determines the next simultaneous update.",
    "source": "https://cp-algorithms.com/algebra/extended-euclid-algorithm.html"
  },
  {
    "slug": "sieve-of-eratosthenes",
    "name": "Sieve of Eratosthenes",
    "short": "Sieve",
    "family": "number-theory",
    "prerequisites": "Divisibility, multiples, and prime numbers",
    "summary": "Cross out multiples and reveal every prime up to a limit.",
    "detail": "A prime is an integer greater than one whose positive divisors are only one and itself. The sieve begins by treating every integer from 2 through N as a candidate. For each unmarked p with p² ≤ N, it marks multiples starting at p² as composite. Smaller multiples have already been reached by smaller prime factors. At the end, all remaining candidates are prime.",
    "experiment": "Use limit 50. Watch 2 remove even composites, then 3 remove multiples that remain, then 5 and 7. Before completion, a surviving cyan number is only a candidate; after completion, green certifies prime status.",
    "complexity": "O(N log log N) marking work and O(N) storage. These bounds describe the sieve, excluding recorded playback copies.",
    "limitation": "Efficient for listing many primes up to a limit. It allocates storage proportional to the limit; checking a single huge number calls for a different approach. One is not prime.",
    "reading": "Pink is the current multiple, amber is the prime whose multiples are being processed, faded cells are composite, and green at completion marks primes. The grid is responsive and wraps on narrow screens.",
    "source": "https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html"
  },
  {
    "slug": "binary-exponentiation",
    "name": "Binary exponentiation",
    "short": "Power",
    "family": "number-theory",
    "prerequisites": "Integer exponents, multiplication, and parity",
    "summary": "Build large powers by repeated squaring and halving.",
    "detail": "An exponent counts repeated multiplication. Binary exponentiation maintains an accumulator, a current base, and a remaining exponent. If the exponent is odd, it multiplies the accumulator by the base. It halves the exponent and squares the base for the next round. Each round processes one binary digit. The invariant is accumulator × base^remaining = originalBase^originalExponent.",
    "experiment": "Try 3 raised to 13. Its binary exponent is 1101, so only the set bits contribute factors. Compare multiplication count with multiplying by 3 thirteen times. Try exponent zero: the result is 1.",
    "complexity": "O(log e) arithmetic multiplications for positive exponent e and O(1) stored big integers. Bit-operation time and storage grow with the size of the numbers; multiplication is not constant cost for arbitrary precision.",
    "limitation": "Uses BigInt internally and displays exact decimal strings. Large results cost more than the multiplication count alone suggests. This playground restricts the base to 1–20 and exponent to 0–20.",
    "reading": "The state shows accumulator, current base, remaining exponent, and its binary digits. A history row follows each multiplication, shift, or square; the displayed invariant lets you follow the preserved result.",
    "source": "https://cp-algorithms.com/algebra/binary-exp.html"
  },
  {
    "slug": "fibonacci-tabulation",
    "name": "Fibonacci tabulation",
    "short": "Fibonacci",
    "family": "dynamic-programming",
    "prerequisites": "Arrays, addition, and a recurrence",
    "summary": "Store smaller answers and build the next Fibonacci number.",
    "detail": "A recurrence defines a value using smaller values. Fibonacci numbers begin F(0) = 0 and F(1) = 1; every later term is F(i−1) + F(i−2). Tabulation fills an array from smaller indices to larger ones, computing each term once. This illustrates dynamic programming: choose subproblems, record their answers, and reuse those answers instead of repeatedly recomputing them.",
    "experiment": "Use n = 12 and watch each cell depend on the preceding two. Try n = 0 and n = 1 to see why base cases come first. Compare this table mentally with naïve recursive calls that repeatedly revisit the same indices.",
    "complexity": "O(n) additions and O(n) stored values under unit-cost arithmetic. This bounded demo uses exact Number integers through n = 30. A rolling two-value version needs O(1) working space.",
    "limitation": "A complete table is useful when multiple earlier terms will be queried. If only the last term is required, retaining every earlier result is unnecessary. Tabulation is one implementation of the recurrence, not a new definition of Fibonacci numbers.",
    "reading": "Gray dots are uncomputed entries, cyan cells are completed subproblems, amber cells are dependencies, and pink marks the newly written answer. The final requested term is green.",
    "source": "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/lecture-19-dynamic-programming-i-fibonacci-shortest-paths/"
  },
  {
    "slug": "zero-one-knapsack",
    "name": "0/1 knapsack",
    "short": "Knapsack",
    "family": "dynamic-programming",
    "prerequisites": "Arrays, integer capacity, and maximizing a value",
    "summary": "Build a table of best choices under a weight limit.",
    "detail": "Each item has a positive integer weight and a nonnegative value. The task is to maximize total value without exceeding a capacity, using each item at most once. Table entry dp[i][c] is the best value using only the first i items with capacity c. Either skip item i, taking dp[i−1][c], or take it if it fits, adding its value to dp[i−1][c−weight]. Both choices consult the previous row, so an item cannot be reused.",
    "experiment": "Start with weights 2, 3, 4, values 4, 5, 7, and capacity 5. The optimum takes items 1 and 2 for value 9. Watch each cell consult the row above, then follow the reconstruction path to see which items were chosen. Try reducing capacity to 3.",
    "complexity": "O(nC) table work and O(nC) storage, where n is item count and C is integer capacity. This is pseudopolynomial: C itself can be exponential in the number of bits used to encode it.",
    "limitation": "This solves indivisible-item knapsack, not fractional knapsack. Values need not increase with weights. Equal-valued take and skip choices prefer skipping the current item; there may be several optimal selections.",
    "reading": "Rows represent how many items are available; columns represent capacity. Pink marks the current cell, amber marks consulted subproblems, and green follows the final reconstruction. A dot means the cell is not computed. The table scrolls inside its own panel on mobile.",
    "source": "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/recitation-21-dynamic-programming-knapsack-problem/"
  }
] as const;
export const discoveryFamilies = [
  {
    "slug": "array-search",
    "name": "Searching arrays",
    "description": "Compare sequential inspection with halving a sorted interval.",
    "playground": "array search"
  },
  {
    "slug": "string-matching",
    "name": "String matching",
    "description": "Locate every occurrence of a pattern and see how prefix reuse avoids repeated work.",
    "playground": "string matching"
  },
  {
    "slug": "number-theory",
    "name": "Number theory",
    "description": "Follow remainders, prime elimination, integer coefficients, and repeated squaring.",
    "playground": "number theory"
  },
  {
    "slug": "dynamic-programming",
    "name": "Dynamic programming",
    "description": "Build answers from stored subproblems, then recover the choices behind an optimum.",
    "playground": "dynamic programming"
  }
] as const;
