---
title: "Which End Comes First? Understanding Endianness"
description: "Byte order, bit numbering, and wire order explained through hex dumps, Intel and Apple processors, embedded systems, and a surprisingly consequential dispute about eggs."
heroImage: "/images/notes/which-end-comes-first.svg"
heroImageAlt: "The integer 0x12345678 stored at increasing addresses: big-endian 12 34 56 78; little-endian 78 56 34 12."
date: 2026-09-13
publishedAt: 2026-09-13T02:33:04Z
tags: ["software engineering", "computer science", "hardware", "endianness", "history"]
---

Open a file in a hex editor and find these four bytes:

```text
78 56 34 12
```

A program tells you that they represent the integer `0x12345678`. The digits seem to have been rearranged. Perhaps the machine reads backward. Perhaps it reverses the bits, too. Then someone mentions that network data uses the opposite order, and a manageable question starts accumulating exceptions.

The way through is to name what is being ordered. Memory addresses, numeric significance, diagram labels, and transmission time are different things. Once those distinctions are visible, an apparently backward number becomes straightforward to read.

**Prerequisites:** A byte contains eight bits in every example here. Hexadecimal is base 16: one hexadecimal digit represents four bits, so two digits represent one byte. The prefix `0x` marks a hexadecimal number.

## 1. Byte order begins with a value larger than one byte

Consider the unsigned 32-bit integer `0x12345678`. Its four bytes, written from greatest to least numeric significance, are `12`, `34`, `56`, and `78`.

“Significance” means positional weight. In decimal 1234, the 1 contributes a thousand while the 4 contributes four. In our hexadecimal integer, the byte `12` contributes its value multiplied by 256³; the byte `78` contributes its value multiplied by 256⁰.

Memory gives each byte a numbered address. To store the integer, the computer must assign its four bytes to four addresses.

| Memory address | Big-endian storage | Little-endian storage |
| --- | --- | --- |
| A + 0 | `12` — most significant byte | `78` — least significant byte |
| A + 1 | `34` | `56` |
| A + 2 | `56` | `34` |
| A + 3 | `78` — least significant byte | `12` — most significant byte |

**Big-endian puts the most significant byte at the lowest address. Little-endian puts the least significant byte there.**

Both arrangements represent the same integer when interpreted according to the matching convention. Reading little-endian storage as big-endian instead produces a different value: `0x78563412`.

The direction on the page is incidental. A memory diagram could put low addresses at the bottom. “Lowest address” remains precise when “leftmost” stops being useful.

Nor does little-endian storage turn `0x78` into `0x87`. Each two-digit group represents a whole byte. Those groups change positions; the digits within each group retain their ordinary numeric meaning.

## 2. Bit 0 usually means the LSB—with a qualification

Within a byte, the conventional programming notation assigns bit positions according to powers of two.

| Bit position | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Weight | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
| Bit value in `0x96` | 1 | 0 | 0 | 1 | 0 | 1 | 1 | 0 |

Here, bit 7 is the **most significant bit**, or MSB, and bit 0 is the **least significant bit**, or LSB. The set bits contribute 128 + 16 + 4 + 2 = 150, which is `0x96`.

This numbering works the same way when the byte sits inside either a big-endian or a little-endian integer. Byte order does not reverse these weights. It also does not change what an ordinary numeric shift or mask means: `value & 1` tests the least significant bit of a nonnegative integer.

The qualification concerns **labels**. A specification can number the most significant bit as bit 0. The Internet Protocol specification, RFC 791, explicitly does this in its diagrams. Its bit labeled 0 is the high-order bit. That is a documented numbering convention, so reading the label as an exponent would be a mistake. [RFC 791, Appendix B](https://www.rfc-editor.org/rfc/rfc791#appendix-B).

For that convention, the same byte would appear as:

| Specification label | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Weight | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
| Bit value in `0x96` | 1 | 0 | 0 | 1 | 0 | 1 | 1 | 0 |

Only the labels changed. The value is still 150.

Use bit 0 = LSB as the default for programming, then check a specification's numbering before translating its diagrams into code. Also identify the width: bit 7 is the MSB of an eight-bit byte, while bit 31 is the MSB of a 32-bit integer under the same numbering convention.

## 3. Which systems use which byte order?

For ordinary data storage, Intel and AMD x86 PCs and Apple Silicon Macs are little-endian. Changing from an Intel Mac to an Apple Silicon Mac changes the processor architecture without changing that byte order.

The useful classification is **architecture plus platform**, rather than manufacturer alone. A platform includes the operating system and its application binary interface, or ABI: the rules compiled programs follow to agree about data and function calls.

| System or platform | Byte order for ordinary multi-byte data |
| --- | --- |
| Intel and AMD x86 / x86-64 PCs | Little-endian |
| Intel Macs | Little-endian |
| Apple Silicon Macs; ARM-based iPhones and iPads | Little-endian |
| Windows on ARM64 | Little-endian |
| Historical Motorola 68000 Macs | Big-endian |
| Historical PowerPC Macs | Big-endian |
| STM32 Cortex-M4 microcontrollers covered by ST's PM0214 manual | Little-endian |
| IBM Power systems | Platform-dependent; both big- and little-endian environments exist |

Intel documents the x86 data layout in its [architecture manuals](https://cdrdv2-public.intel.com/825743/325462-sdm-vol-1-2abcd-3abcd-4.pdf). Apple's open-source [ARM byte-order definitions](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/arm/_endian.h) specify little-endian operation. Microsoft's [ARM64 introduction](https://devblogs.microsoft.com/oldnewthing/20220726-00/?p=106898) distinguishes the architecture's capabilities from Windows' exclusive use of little-endian mode. Apple's historical [Universal Binary Programming Guidelines](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/universal_binary/universal_binary.pdf) discuss the PowerPC-to-Intel byte-order change.

An architecture that supports both orders is called **bi-endian**. That does not establish that every chip implementing a related architecture supports both, or that a particular operating system lets applications switch freely. Microsoft's ARM64 discussion and IBM's [account of little-endian Linux on Power](https://developer.ibm.com/articles/l-power-little-endian-faq-trs/) illustrate why the platform qualification matters.

Embedded work makes precise identification especially valuable. “ARM microcontroller” is a starting point for finding a manual, not a complete memory-format specification. ST's [Cortex-M4 programming manual](https://www.st.com/resource/en/programming_manual/pm0214-stm32-cortexm4-mcus-and-mpus-programming-manual-stmicroelectronics.pdf) explicitly says the processors it covers manage memory accesses as little-endian. That is a firmer basis for implementation than a claim about all Cortex processors.

A desktop application often handles values through libraries that conceal these boundaries. Firmware may directly read a sensor, inspect a peripheral register, construct a packet, and write persistent storage. Each interface can bring its own encoding rules. This is why endianness can feel much more prominent in embedded development even when the processor itself is little-endian.

The distinction is not “consumer equals little, embedded equals big.” The distinction is how many separately specified representations your program must handle.

## 4. Bit transmission order: what actually comes first?

Memory addresses describe where bytes are stored. A serial interface introduces another ordering: time.

Suppose an interface sends the byte `0x96`, whose usual binary representation is `10010110`. It could transmit its data bits in either order:

| Convention | Data bits, earliest to latest |
| --- | --- |
| MSB-first | `1 0 0 1 0 1 1 0` |
| LSB-first | `0 1 1 0 1 0 0 1` |

An LSB-first receiver that follows the same rule reconstructs `0x96`. The transmission sequence does not make the received value `0x69`; that would result from interpreting those temporal positions with the wrong significance.

**Bit transmission order** or **bit serialization order** is the clearest name for this distinction. “Bitwise endianness” sometimes refers to it, but can also refer to bit numbering or packing. “Wire order” is useful informal language, although it can include the order of bytes and fields too. A **wire format** describes the broader encoding, including framing and field layout.

Two interfaces make the distinction concrete:

- **I²C** sends the most significant bit of each byte first, as specified in NXP's [I²C-bus specification](https://www.nxp.com/docs/en/user-guide/UM10204.pdf).
- **Conventional UART framing** sends a start bit and then the least significant data bit first. Microchip's [USART frame documentation](https://onlinedocs.microchip.com/oxy/GUID-80B1922D-872B-40C8-A8A5-0CBE009FD908-en-US-3/GUID-FF93E240-2F3F-4EB9-AC89-9F8C22F65782.html) gives an explicit example.

SPI controllers commonly offer a choice of bit order; both ends must follow the selected device's requirements. None of these interface choices determines the CPU's native byte order.

For multi-byte transfers, ask two questions separately: which byte first, and which bit within each byte first? The following table serializes the value `0x1234` four ways. Spaces separate the two bytes; time runs left to right. Framing is omitted.

| Byte serialization order | Bit order within each byte | Data-bit sequence |
| --- | --- | --- |
| Most significant byte first | MSB-first | `00010010 00110100` |
| Most significant byte first | LSB-first | `01001000 00101100` |
| Least significant byte first | MSB-first | `00110100 00010010` |
| Least significant byte first | LSB-first | `00101100 01001000` |

The CPU can prepare any of these representations, provided the interface supports the required transmission behavior.

## 5. Network byte order does not define every bit on a cable

**Network byte order** means big-endian byte order. RFC 791 specifies that the most significant octet of a multi-octet numeric quantity is transmitted first. An *octet* is exactly eight bits. [RFC 791, Appendix B](https://www.rfc-editor.org/rfc/rfc791#appendix-B).

Thus a protocol field containing the 16-bit value `0x1234` in network byte order is serialized as bytes `12 34`. A little-endian host might hold the native integer as `34 12` before preparing that field.

The familiar C socket functions name this boundary:

| Function | Conversion |
| --- | --- |
| `htons` | Host to network, 16 bits |
| `htonl` | Host to network, 32 bits |
| `ntohs` | Network to host, 16 bits |
| `ntohl` | Network to host, 32 bits |

On a big-endian host, these conversions can leave the bits unchanged. On a little-endian host, the corresponding byte swap is needed. Apple's [network conversion definitions](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/sys/_endian.h) show both cases.

This does not mean every application's network payload must be big-endian. A protocol defines its own fields; a TCP connection can carry an application format containing little-endian integers. Nor does the phrase specify every physical signal on an Ethernet cable. Lower layers can frame, encode, and distribute data in ways that require their own explanation.

A useful hypothetical embedded example is a little-endian microcontroller communicating with an I²C sensor whose data sheet defines a two-byte measurement as high byte followed by low byte. The sensor's register sequence supplies the byte order, I²C supplies MSB-first transmission within each byte, and the firmware reconstructs a native integer. All three rules coexist.

## 6. Packed fields introduce another convention

Some formats divide a byte into smaller fields. Imagine a header with a three-bit field named A and a five-bit field named B. The format must specify which positions each occupies.

If A occupies the three most significant bits, let A = 5 (`101`) and B = 6 (`00110`). Packing them gives `10100110`, or `0xA6`.

```python
a = 5
b = 6

packed = (a << 5) | b
assert packed == 0xA6
assert (packed >> 5) & 0b111 == a
assert packed & 0b11111 == b
```

If a different format assigns A to the three least significant bits, the packing expression becomes `(b << 3) | a`, giving `0x35`. A CPU's byte order alone cannot choose between these layouts.

C bit-field declarations also need care:

```c
struct Header {
    unsigned int a : 3;
    unsigned int b : 5;
};
```

That declaration does not guarantee an eight-bit structure or a portable external encoding. Allocation order, alignment, and other layout decisions depend on implementation and ABI rules. GCC documents these dependencies in its [bit-field implementation notes](https://gcc.gnu.org/onlinedocs/gcc/Structures-unions-enumerations-and-bit-fields-implementation.html). Explicit masks and shifts make the intended field positions visible.

## 7. What the hex editor can—and cannot—tell you

A byte-oriented hex dump normally prints bytes in increasing file-offset order, using conventional hexadecimal notation within each byte. A memory dump uses addresses instead of file offsets.

For our opening bytes, a simple dump might show:

```text
Offset    Hex bytes     ASCII
00000000  78 56 34 12    xV4.
```

The ASCII column interprets printable bytes as characters and substitutes a dot for the nonprintable `12`. It is another view of the same bytes. It provides no evidence that the file is actually text.

Likewise, the dump cannot determine whether those four bytes are one integer, two integers, four independent fields, or part of compressed data. You need the format's rules to choose.

Python makes the two integer interpretations explicit:

```python
data = bytes.fromhex("78 56 34 12")

print(f"{int.from_bytes(data, 'little'):08X}")
print(f"{int.from_bytes(data, 'big'):08X}")
```

Output:

```text
12345678
78563412
```

The input bytes remain unchanged. The byte-order argument changes their interpretation. To perform the opposite operation, use `(0x12345678).to_bytes(4, "little")` or `(0x12345678).to_bytes(4, "big")`. These explicit choices work independently of the host's native endianness. [Python integer conversion documentation](https://docs.python.org/3/library/stdtypes.html#int.from_bytes).

A dump expression such as `f"{byte:02X}"` merely prints one byte as uppercase hexadecimal, with a minimum width of two characters and zero padding. It makes no multi-byte endianness decision.

Also avoid “fixing” a file by reversing all its bytes. A record could contain a four-byte integer followed by a two-byte integer and a text string. Converting the two integers would require respecting their individual boundaries; reversing the entire record would also move fields and reverse the text.

## 8. The names began with an argument about eggs

In Jonathan Swift's *Gulliver's Travels*, first published in 1726, a dispute about which end of an egg to break becomes a matter of law, rebellion, and conflict. The traditional practice is to break the larger end. After a royal child cuts a finger doing so, an edict requires the smaller end instead. People who persist with the larger end are called Big-Endians. Swift turns a breakfast habit into religious and political satire. [*Gulliver's Travels*, Part I, Chapter IV](https://www.gutenberg.org/files/829/829-h/829-h.htm).

Computer scientist Danny Cohen borrowed this dispute for his paper **“On Holy Wars and a Plea for Peace,”** dated April 1, 1980, and issued as Internet Experiment Note 137. He applied the opposing names to disagreements about which end of a computer's data should come first. His discussion includes both bit and byte ordering, which helps explain why the vocabulary has never belonged exclusively to one level. [Cohen's original paper](https://history.rfc-editor.org/ien/ien137.txt).

The allusion gives us a mnemonic: big-endian starts with the significant, “big” end; little-endian starts with the “little” end. It also carries a warning about treating a convention as a cause worth fighting over.

Neither order changes the arithmetic value when writer and reader agree. The engineering work is to establish that agreement and handle the boundaries where conventions differ.

Return to `78 56 34 12`. You can now describe exactly what you have: four bytes in a known sequence. To turn them into `0x12345678`, you need one additional fact—that this field is a 32-bit little-endian integer. The hex dump supplied the evidence. The format supplies the meaning.
