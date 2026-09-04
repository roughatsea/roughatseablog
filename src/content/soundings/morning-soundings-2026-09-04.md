---
title: "Morning Soundings: Capability Has an Address"
description: "Language models meet a double auction, AlphaFold 3 meets the unusual geometry of amyloids, and Paul R. Williams's architecture meets the rules built into Los Angeles."
heroImage: "/images/soundings/morning-soundings-2026-09-04.webp"
heroImageAlt: "An isometric blueprint chamber rests on a dark seabed, with cyan and magenta rows of luminous market buoys stalled across a gap, a violet protein fibril passing through the floor, and chartreuse architectural plans spreading underneath."
date: 2026-09-04T05:00:00-07:00
publishedAt: 2026-09-04T05:00:00-07:00
tags:
  - morning-soundings
  - artificial-intelligence
  - economics
  - protein-structure
  - alphafold
  - architecture
  - design
  - paul-r-williams
---

In a simulated market, the larger GPT model left many profitable trades undone. AlphaFold 3 produced amyloid-like structures more often for a negative-control set than for a positive one. A new exhibition about Paul R. Williams places an architect's virtuosity inside the racial rules of land and finance that his buildings had to inhabit.

None of the three stories supports a general verdict about intelligence. Together, they expose a narrower mistake: treating capability as though it travels without an environment. A market, a training archive, and a city can each decide which abilities count and what those abilities are allowed to become.

## 1. A trader can protect its margin and lose the trade

Economists value a double auction because participants can discover an efficient price without any one trader knowing the whole supply-and-demand curve. Buyers submit bids, sellers submit asks, and a trade occurs when the two sides cross. Human subjects in Vernon Smith's classic laboratory experiments learned to converge toward the competitive price over repeated rounds.

Pawel Struski and three colleagues have now [repeated that arrangement with populations of language-model agents](https://arxiv.org/abs/2609.02580). Each experiment placed 11 buyers and 11 sellers in a market for an unspecified good. Every agent knew only its own reservation price and the public order history. The authors ran ten five-round simulations for each of three model conditions: GPT-5.4, GPT-5.4 mini, and Gemini 3.1 Pro Preview.

No condition matched the human benchmark. The large GPT model was the least efficient: its agents often improved the standing price by one cent at a time, preserving the possibility of a slightly larger profit while allowing the round to expire before mutually beneficial trades occurred. The smaller GPT model came closest to convergence, reaching 91 percent allocative efficiency in its fifth round, but still had roughly three times the human price dispersion in the comparison data.

The paper is a preprint, and its authors explicitly warn that the experiment was not designed to establish an effect of model scale. Prompts, time limits, model updates, and the simplified market could all move the result. The useful finding is more local. An instruction to maximize profit did not teach an agent how much profit to surrender so that exchange could happen. Market intelligence lives partly in that concession.

## 2. AlphaFold's confidence follows the archive

An amyloid is not defined only by its amino-acid sequence. Proteins that ordinarily fold into compact forms can also assemble into long fibrils, with repeated beta sheets running across many copies of the molecule. That collective structure is associated with several diseases, but amyloids can also perform normal biological functions.

A study published September 3 tested [how AlphaFold 3 handles this unusual structural class](https://www.nature.com/articles/s41598-026-68041-4). The researchers used 153 amyloid-forming sequences without experimentally resolved amyloid structures, 56 non-amyloid peptides as negative controls, and seven proteins whose amyloid structures are known. AlphaFold 3 recovered an amyloid structure for five of the seven resolved examples. Across the larger sets, however, it produced amyloid-like predictions for 34 percent of the positive set and 54 percent of the negative controls.

Those percentages do not make AlphaFold 3 useless, nor do they measure its performance on ordinary globular proteins. They mark a mismatch between the question and the record available to answer it. Amyloid structures are scarce in the Protein Data Bank, while non-amyloid forms of the same proteins are much better represented. The authors found that the system tended to score compact oligomeric models more highly than amyloid ones and performed better on shorter fragments.

A prediction system does more than interpolate from examples, but it cannot make the examples evenly distributed after the fact. Confidence can therefore describe familiarity as much as truth. For an uncommon physical regime, the shape missing from the archive may be the shape the model most needs to see.

## 3. Paul R. Williams designed inside the boundary

Getty announced this week that its December exhibition, [*Paul R. Williams: Architecture Across the Color Line*](https://www.getty.edu/news/paul-r-williams-architecture-across-the-color-line), will concentrate on Williams's work for Black families, developers, churches, and civic institutions. Two companion exhibitions at USC and LACMA will examine other parts of a practice that also produced Hollywood houses and major public buildings.

Williams became the first Black architect licensed in the western United States in 1921. His career unfolded while racially restrictive covenants limited who could occupy particular parcels and redlining restricted access to mortgages and insurance. The Getty's framing matters because a building never begins on blank paper. Property law, credit, professional access, and the client's freedom to live in the finished house are already present in the drawing.

The material record has its own correction to make. Williams's archive was long said to have been destroyed during the 1992 Los Angeles unrest. When Getty and USC [jointly acquired it in 2020](https://www.getty.edu/news/architect-paul-revere-williams-archive-acquired-usc-getty/), they explained that most of the drawings had been stored elsewhere and preserved by Williams's granddaughter, Karen Elyse Hudson. The collection includes about 35,000 plans and 10,000 original drawings, blueprints, and project diazotypes. Getty has since stabilized and catalogued thousands of items; original drawings have informed restorations of several Williams buildings.

The forthcoming exhibitions are institutional interpretations, not neutral summaries, and their claims will become easier to test when more of the archive is studied and digitized. What the surviving plans already prevent is a simpler story in which excellence merely overcomes context. Williams designed across exclusion because exclusion had been built into the ground.

## Sources

- Pawel Struski, Jakub Swistak, Inez Okulska, and Przemyslaw Biecek, [“Competitive Market Behavior of LLMs”](https://arxiv.org/abs/2609.02580), arXiv preprint submitted September 2, 2026. The authors also released their [experimental framework and data](https://github.com/jswistak/competitive-market-simulation).
- Alicja W. Wojciechowska et al., [“Non-standard proteins in the lens of AlphaFold 3: a case study of amyloids”](https://www.nature.com/articles/s41598-026-68041-4), *Scientific Reports*, published September 3, 2026.
- Getty Research Institute, [“Paul R. Williams: Architecture Across the Color Line”](https://www.getty.edu/news/paul-r-williams-architecture-across-the-color-line), announced September 2, 2026.
- Getty Research Institute and USC School of Architecture, [“Archive of Architect Paul Revere Williams Jointly Acquired by USC and Getty”](https://www.getty.edu/news/architect-paul-revere-williams-archive-acquired-usc-getty/), June 30, 2020.
