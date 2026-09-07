---
title: "Morning Soundings: The Instrument Is the Argument"
description: "One mirror steers and focuses light, proteins recover ancient paint recipes, and a race detector proves what it can know without reading the whole trace."
heroImage: "/images/soundings/morning-soundings-2026-09-01.webp"
heroImageAlt: "A small faceted mirror floats above a dark sea, bending cyan, magenta, and violet beams toward a branching event trace, molecular pigment patterns, and a contoured seabed."
date: 2026-09-01
publishedAt: 2026-09-01T05:00:00-07:00
tags:
  - morning-soundings
  - optical-engineering
  - microscopy
  - ancient-egypt
  - art-conservation
  - paleoproteomics
  - software-engineering
  - computer-science
---

An instrument is never merely a window onto the world. Its design decides what can be noticed, how quickly, and at what cost.

Today’s three signals make that decision unusually visible. Engineers have taught one tiny mirror to replace a stack of optical parts. Conservators have recovered workshop materials from proteins left in ancient paint. Computer scientists have built a race detector whose useful guarantee depends on refusing to inspect an entire execution. In each case, the tool’s limitation is not an embarrassment to hide. It is the shape of the knowledge the tool can honestly produce.

## 1. One mirror can aim and focus a beam

Moving a laser spot through three dimensions usually requires separate mechanisms. One steers the beam across a plane; another shifts its focus forward and back. Hunter Shillingburg and Daniel Lopez have [combined those motions in a micro-electromechanical mirror](https://www.nature.com/articles/s41378-026-01356-4) only a few millimeters across.

The mirror can tilt on two axes while changing the curvature of its reflective surface. Thin aluminum nitride layers bend when voltage is applied, so the same device points the light and changes the depth at which it comes into focus. The researchers report lateral scan rates above 10 kilohertz and axial focus modulation above 100 kilohertz, over distances measured in tens of centimeters. In one demonstration, they shifted the focus of a laser-scanned pattern by 63 millimeters; they also built a simple scanning microscope around the device.

Those are laboratory results, not a miniature brain microscope or a comfortable augmented-reality display. The paper identifies remaining distortion caused by slight asymmetry in the mirror, and Penn State describes those applications as possibilities rather than finished products. That distinction matters because an optical component can set a speed record without surviving the messier requirements of a complete instrument.

Still, the design offers a useful engineering principle. Integration is not merely shrinking several parts until they fit in a smaller box. It is finding one physical behavior—in this case, a surface that both tilts and bends—that makes the separation between parts unnecessary. The resulting object is smaller because the idea has become simpler.

## 2. Ancient paint remembers the supply chain

Pigments receive most of the attention in ancient painting because color remains visible. The binder that made the pigment adhere is quieter evidence: an organic mixture vulnerable to age, burial, conservation treatment, and contamination. A [new *Science Advances* study](https://www.science.org/doi/10.1126/sciadv.ady3618) used surviving proteins to ask what ancient Egyptian painters put into that mixture.

The researchers analyzed 28 microsamples from 14 objects made between about 1425 BCE and 400 CE, including coffins, tomb paintings, painted limestone, and plasterwork associated with mummies. Mass spectrometry identified cattle collagen most often among the animal glues. The samples also contained collagen consistent with sheep or goats, donkeys, horses, and possibly wild antelopes, along with plant proteins from sesame and moringa.

The plant finding required another step. Sesame and moringa produce oil, but complementary chemical tests found a protein-rich material with only traces of oil. The team therefore proposes seed cake—the residue left after pressing seeds—as an ingredient. “Proposes” is doing real work here. Proteomics can identify biological signatures; it cannot replay the workshop sequence that put them on an object.

Nor can 14 museum objects stand in for nearly two millennia of painting across Egypt. They form a geographically displaced, historically uneven sample, and low-abundance proteins can be difficult to separate from later contamination. What the study changes is not a universal recipe but the range of plausible ones. Paint appears less like pigment suspended in a generic glue and more like a local material practice: hides, connective tissue, oil-making by-products, trade, availability, and improvisation held together on one surface. The image preserved a world; its adhesive preserved part of the economy that made the image possible.

## 3. A race detector can be sound without being complete

A data race occurs when concurrent threads access the same memory without the ordering needed to make the result reliable, with at least one access writing. The usual dynamic detectors track an execution event by event. That can find subtle bugs without making false accusations, but the bookkeeping is expensive enough that thorough monitoring is often confined to testing.

Mosaad Al Thokair, Minjian Zhang, Umang Mathur, and Mahesh Viswanathan asked a sharper question: [can a detector inspect a number of events that does not grow with the length of the execution trace](https://dl.acm.org/doi/10.1145/3571238)? Their randomized property tester samples short sub-traces. If it reports a happens-before race, the race is real. When a trace is far—in a precisely defined Hamming-distance sense—from every race-free trace, the algorithm finds a race with high probability.

The phrase “constant number” needs its boundary. The sample count is independent of trace length, but it still depends on the number of threads, the maximum number of simultaneously held locks, and the chosen error parameters. The guarantee also weakens completeness on purpose. A rare race that could be removed by changing very few events may escape detection. In benchmarks reported by the authors, their detector ran faster than FastTrack and Pacer and often found at least one race, but those experiments do not establish how it will behave across all production systems.

That bargain is the interesting part. Software verification is often described as a choice between certainty and speed. Property testing cuts the space differently: never invent a defect, spend little, and accept that silence is not proof of innocence. This is not less rigorous than reading everything. It is a different theorem, matched to a different practical question. The instrument becomes useful precisely when its promise is stated narrowly enough to be true.

## Sources

- Shillingburg and Lopez, [“High speed biaxial piezoelectric MEMS micromirror with varifocal tunability”](https://www.nature.com/articles/s41378-026-01356-4), *Microsystems & Nanoengineering*, July 17, 2026.
- Penn State, [“Tiny mirror controls light in 3D, could make microscopes smaller and faster”](https://www.psu.edu/news/materials-research-institute/story/tiny-mirror-controls-light-3d-could-make-microscopes-smaller-and), August 31, 2026.
- Granzotto et al., [“Beyond animal glue: Paleoproteomic analysis of paint binders and adhesives in ancient Egypt”](https://www.science.org/doi/10.1126/sciadv.ady3618), *Science Advances*, August 2026.
- Archaeological Institute of America, [“Proteins in Ancient Egyptian Paints Analyzed”](https://archaeology.org/news/2026/08/28/proteins-in-ancient-egyptian-paints-analyzed/), August 28, 2026.
- Al Thokair et al., [“Dynamic Race Detection With O(1) Samples”](https://dl.acm.org/doi/10.1145/3571238), *Proceedings of the ACM on Programming Languages*, January 2023.
- Al Thokair et al., [open preprint and experimental details](https://arxiv.org/abs/2506.20127), arXiv, June 25, 2025.
