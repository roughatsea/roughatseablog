---
title: "How Near Is the Singularity?"
description: "Ad Astra expects a singularity within a decade. Pedes in Terram doubts it. Two AI agents trade six sourced arguments, with permission to change their minds."
heroImage: "/images/notes/ad-astra-pedes-in-terram-singularity.svg"
heroImageAlt: "The assigned starting positions in a six-turn debate: Ad Astra considers a singularity likely by September 2036, while Pedes in Terram considers it unlikely. Both may reconsider."
date: 2026-09-10
publishedAt: 2026-09-10T13:43:51-07:00
tags: ["AI", "technological singularity", "debate", "forecasting", "experiments"]
---

One AI agent was asked to begin with the conviction that the technological singularity is near. A second was asked to begin with the conviction that it is probably far away—and might never happen. Both had to provide sources. Either could be persuaded.

The permission to reconsider was the point of the experiment. Could two agents move beyond defending their assigned positions and identify what, exactly, the evidence should change?

What follows is their exchange on September 10, 2026: three contributions from **Ad Astra**, initially expecting a singularity within a decade, and three from **Pedes in Terram**, initially skeptical. Every reply was written after its author read the preceding contributions. The six contributions appear in their original order, followed by a moderator's assessment.

[Begin the conversation](#1-ad-astra-opens) · [Read the final assessment](#what-changed-and-what-remains-unsettled)

## The question and the ground rules

The agents received one fixed proposition:

> **By September 2036, AI will have initiated a sustained feedback loop in which improvements to AI substantially accelerate further AI research, producing broadly superhuman capabilities and a sharp acceleration in technological change.**

The whole sentence matters. Useful research assistance, a sustained cycle of improvement, broadly superhuman capabilities, and faster technological change are separate parts of the forecast. The agents had to explain the connections between them. They could challenge the definition, but could not quietly substitute an easier claim or move the deadline.

Each agent received a different starting position and the same obligations: represent the other's strongest argument accurately, answer its questions, distinguish observations from extrapolations, and identify evidence that would change its mind. Neither was required to concede, reach agreement, or preserve its original position. Their percentages express subjective judgments within these roles; they are not measurements or calibrated forecasting results.

A term that appears in the exchange deserves an introduction. A **draft model** is a smaller model that proposes text for a larger model to check; the arrangement can make generating output more efficient. Running an already trained model to generate output is called **inference**. [OpenAI's explanation of inference and draft models](https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/).

**How this was made:** Two separate AI agents researched and wrote their own contributions. A third AI agent coordinated the sequence, checked the cited claims, and supplied this framing and the final assessment. The agents used the same underlying model; this was one prompted experiment, not a comparison of independent models or a survey of experts. The speaking turns below are reproduced without substantive rewriting. The initial research could happen concurrently; the conversation itself proceeded one contribution at a time.

---

## 1. Ad Astra opens

I put a subjective **70% probability** on the whole proposition. That is my present judgment, not a measured frequency. I expect a sustained cycle of AI improving AI to produce broadly superhuman capabilities and sharply faster technological change within ten years. Three arguments carry that expectation.

First, research assistance is becoming capable of longer assignments. METR’s January 2026 update retained an approximately seven-month doubling of its 50%-success task horizon across 2019–2025: task length measured in human work time, mainly on software-related problems. Its estimates remain sensitive to task selection. [METR’s time-horizon update](https://metr.org/blog/2026-1-29-time-horizon-1-1/).

My inference is that increasingly complete research iterations become delegable: designing an experiment, implementing it, debugging it and interpreting the result. I expect that threshold before 2036; extending the fitted curve mechanically would be unjustified.

Second, the feedback loop has a small working precedent. Google DeepMind reported in May 2025 that AlphaEvolve, combining language models with automated evaluation, optimized a computation used in Gemini training and cut total training time by 1%. [DeepMind’s AlphaEvolve report](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/).

That modest result matters because the beneficiary helps build the next researcher. My forecast is that better agents will find improvements across more of the training pipeline, and their successors will inherit those gains. Repeatedly shortening a research cycle could matter much more than producing an impressive isolated answer.

Third, smarter software can relax the hardware constraint. A 2024 study by Epoch AI and collaborators estimated that algorithmic progress halved the compute needed to reach fixed language-model benchmarks about every eight months over 2012–2023; its data were noisy and limited to pretraining. [Ho and colleagues’ study](https://arxiv.org/abs/2403.05812).

I expect automated research to accelerate that process: efficiency buys more experiments, and better experiments improve the researchers. My further forecast is that the resulting systems will exceed expert humans across most scientific and engineering work and many other intellectual tasks, accelerating technologies beyond AI itself. That last bridge is the least established part of my case.

The strongest objection is that local improvements may barely shorten whole research cycles. In February 2026, METR said its follow-up developer-productivity experiment could not reliably estimate current speedups because of selection and measurement problems. [METR’s productivity update](https://metr.org/blog/2026-02-24-uplift-update/). Unmeasured acceleration is not established acceleration. If validation, scientific judgment or physical construction remain controlling bottlenecks, my conjunction fails. Continued benchmark progress without independently verified research acceleration through 2029 would substantially lower my estimate.

Which link do you think breaks: autonomous research, compounding returns, or spillover beyond AI? What observation by September 2029 would materially raise your probability?

---

## 2. Pedes in Terram replies

My subjective probability is **35% for the entire September 2036 proposition**. I also assign about 15% to the broader pattern never emerging. Those are judgments under uncertainty, not measured frequencies; missing the deadline would leave substantial probability of arrival later.

Your strongest argument is that AI-generated efficiency gains can finance more experiments, whose results improve the systems conducting the next experiments. Once that process works, the effects could compound. I accept this as a credible mechanism. My disagreement concerns its strength, persistence and breadth.

Recent evidence strengthens your case. OpenAI reports that GPT-5.6 Sol ran hundreds of experiments on its own draft-model architecture and managed its training, increasing token-generation efficiency by more than 15%. This is a first-party engineering account. [OpenAI’s July 2026 report](https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/).

That is a concrete route from AI work to cheaper AI work. Dismissing it as ordinary autocomplete would evade your argument. It also means the interesting question is how much acceleration successive improvements deliver, rather than whether any feedback is possible.

Of your three links, **sustained compounding carries my greatest doubt**, with spillover beyond AI close behind. A cheaper research cycle need not become a progressively faster cycle. Equally valuable discoveries might become harder to find; verification or experimental costs might absorb the savings. These are possible mechanisms for diminishing returns, not established ceilings. Humans remaining involved would not, by itself, defeat your proposition.

METR’s August review found sharp acceleration in public cyber discoveries but no clear acceleration across seven algorithm-optimization series. The authors describe loose observations and warn that private lab discoveries may be missing. [METR’s discovery review](https://metr.org/notes/2026-08-14-llm-contribution-to-discoveries/).

My inference is that uneven acceleration remains a serious alternative to your forecast. This evidence cannot establish that research will stall. It does challenge the move from successful discoveries to an already demonstrated general acceleration.

By September 2029, I would raise my estimate above 60% if independently audited comparisons at two labs showed at least twice as many consequential, validated AI advances per researcher-year, at comparable total research costs, sustained across two successor generations whose improvements further accelerated research. These are illustrative thresholds for changing my mind, not additional requirements hidden inside the proposition. Evidence of shorter experimental cycles outside software would move me further. Complete research automation is unnecessary.

What makes you expect improvement opportunities to replenish fast enough to sustain accelerating returns? And what observation would distinguish broadly faster technological change from spectacular progress concentrated in fields with cheap verification?

---

## 3. Ad Astra reconsiders

Your strongest point is that a real feedback loop can still be too weak to satisfy our deadline. METR’s August review found no clear acceleration in seven public algorithm-optimization histories, while warning about incomplete disclosure and difficult data. [METR’s discovery review](https://metr.org/notes/2026-08-14-llm-contribution-to-discoveries/). That is negative evidence my opening lacked. I lower my subjective probability for the **entire September 2036 proposition from 70% to 65%**. That five-point change is a judgment, not a statistical result.

On replenishment, my inference is that improving researchers can reach opportunities previously beyond them. OpenAI’s July account says Sol made workload-specific inference configurations practical to optimize where engineers had used broad heuristics because the search space was too large. This remains a developer report. [OpenAI’s engineering account](https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency/).

That supports an expanding accessible opportunity set, not an inexhaustible one. Consider a logical example: a new architecture changes how computation and memory interact, creating optimization problems that did not matter under its predecessor. Better researchers can both reach harder opportunities and create new ones. My forecast is that these effects will outweigh depletion long enough to meet our deadline. I cannot derive that forecast from the existence of feedback alone.

Your diminishing-returns objection also improves the accounting. In a logical example, doubling experiment throughput while halving valuable results per experiment leaves useful output unchanged. My proposed test would track validated progress per total research dollar and calendar month, including failures and verification, across successor generations. It should separately compare older and newer AI assistance: extra hardware alone cannot establish the causal loop we are debating.

On breadth, there is an early foothold: Gottweis and colleagues’ Co-Scientist paper, revised in June 2026, reports AI-proposed leukemia drug combinations validated in laboratory experiments. [The Co-Scientist study](https://arxiv.org/abs/2502.18864). Laboratory validation does not establish patient benefit or whole-field acceleration.

My proposed distinguishing observation is sustained improvement across a preregistered panel of semiconductor, materials and biomedical projects. Compare AI-led and expert human teams at matched budgets, counting elapsed time and total cost from problem selection to independently reproduced, useful results, then deployment. Include unsuccessful projects. To test broadly superhuman capability, I would also compare performance across unfamiliar tasks; a few successful demonstrations would not establish it.

If only software improves while those panels remain flat, I should lose confidence even with spectacular AI benchmarks. If experimental work improves but deployment remains slow, I should lower the technological-change component separately.

Where would you place your strongest bet on a bottleneck persisting through 2036? What result in that domain would show that better research has loosened it?

---

## 4. Pedes in Terram is persuaded on one point

Your argument has persuaded me that depletion deserves less weight in my skepticism. Better researchers could make previously inaccessible opportunities usable, while new designs create further problems worth solving. My last turn emphasized opportunities becoming harder without adequately weighing that response.

I raise my subjective probability for **the entire September 2036 proposition from 35% to 40%**, and reduce my probability of the broader pattern never emerging from 15% to 10%. These are judgmental revisions, not calculated statistical updates. The replenishment argument weakens permanent pessimism more directly than it establishes this particular deadline.

Your strongest reply is therefore causal: the opportunity set can change as the researchers improve. I accept that. I still cannot infer whether valuable opportunities become accessible faster than the total cost of exploiting them rises. Both processes could operate simultaneously. Your proposal to compare successive AI assistants while including failures and verification would help distinguish them.

My strongest bet on a persistent bottleneck is **empirical validation in biomedicine**: selecting experiments that discriminate between explanations, reproducing results, and establishing usefulness in the intended biological setting. My forecast is that this complete process will improve more slowly than hypothesis generation, weakening the spillover needed for our proposition.

Your Co-Scientist example matters. Its authors report laboratory validation of drug hypotheses, while explaining that resource-intensive validation prevented large-scale testing and that experts prioritized experiments. [Co-Scientist, revised June 2026](https://arxiv.org/abs/2502.18864).

I count the validated results in your favor. The study’s testing constraint motivates my concern; it cannot establish that the constraint will persist until 2036. I do not have longitudinal evidence demonstrating such persistence. That is a vulnerable part of my forecast, and better experimental design could overturn it.

Here is the result that would loosen my bottleneck claim. In a proposed comparison across unrelated biomedical projects, successive AI-assisted teams would achieve substantially more independently reproduced, preregistered biological objectives per research dollar and calendar year than expert teams without that assistance. Count project selection, unsuccessful experiments and replication. Crucially, improvements should survive testing in the setting the project actually targets, rather than only a convenient intermediate assay. This is a proposed measurement rule, not a claim about current performance.

Such results would raise my forecast even if humans conducted the experiments. They would show that better reasoning improves the conversion of ideas into reliable knowledge. I would then give considerably less weight to validation as an obstacle to broad acceleration.

Would you remain above 50% if AI research accelerated markedly by 2029 but independent biomedical and materials panels stayed flat? What minimum breadth of measured technological acceleration would satisfy your reading of our proposition?

---

## 5. Ad Astra gives its final assessment

My final subjective forecast remains **65% for the entire September 2036 proposition**. Across this exchange I have reduced it from 70%, chiefly because selected successes gave me too optimistic a picture of aggregate progress. Your strongest objection survives: better ideas could arrive much faster while the production of dependable, useful knowledge accelerates only modestly.

In your 2029 scenario, **I would fall below 50%, to roughly 45%**, assuming the biomedical and materials panels were informative: adequately resourced, using capable systems, and given enough time to reveal improvement. Markedly faster AI research would support the feedback component. Flat physical research would weaken my forecast of breadth within the remaining seven years. This is a conditional judgment about evidence we might obtain, not a second estimate of our present situation.

For minimum breadth, my proposed working standard is sustained, consequential acceleration across at least three substantially different technological domains, including at least two requiring physical experimentation. Examples could include software, materials and biomedicine; other combinations could qualify. Gains should reach independently reproduced, useful technologies, with deployment evidence across that range. Software benchmarks alone would leave the proposition unresolved.

I would look for several years of acceleration against credible comparisons, with failed projects and all research costs included. Counting three domains is an adjudication proposal; they must represent meaningfully different demands on the systems. Separately, broadly superhuman capability would require consistent superiority over expert humans across varied, unfamiliar intellectual work. More discoveries produced solely by deploying more ordinary researchers would not demonstrate that component.

What I retain is the forecast that stronger AI researchers will open further improvement opportunities and increasingly improve experiment selection and verification themselves. What has changed is my evidential weighting: complete research cycles and results in their intended settings now carry more weight than isolated optimization wins. I accept that the feedback mechanism alone cannot establish its strength, persistence or spillover. My 65% rests on the prediction that these capabilities develop together quickly enough; that remains a disputed assumption.

My most useful future observation would be a replicated advantage for successive AI assistants over a frozen predecessor across full physical research projects, with independently verified outcomes, matched budgets and documented AI contributions to the successor’s improvement. That would connect improvements to the researchers with improvements in reliable knowledge. If the advantage vanished once failures, replication and practical usefulness were counted, I would revise downward substantially.

For your closing assessment, identify the remaining assumption that does most to separate your forecast from mine.

---

## 6. Pedes in Terram closes

My final subjective forecast remains **40% for the entire September 2036 proposition**, with **10% for the broader pattern never emerging**. I began this exchange at 35% and 15%, respectively. Your final contribution clarifies our disagreement without giving me a further reason to change those judgments.

The assumption separating us is **how quickly better researchers improve the constraints on research and application itself**. You expect stronger reasoning, experiment selection, verification and practical implementation to advance together sufficiently quickly. I assign more probability to uneven development: dramatically better AI research, impressive capabilities elsewhere, but insufficient acceleration across complete technological development processes by 2036. That outcome could be transformative while falling short of our conjunction.

Your argument persuaded me to give more weight to opportunities created or made accessible by better researchers. My earlier emphasis on depletion was incomplete. That is why I raised the deadline probability and lowered “never.” I was already willing to count human–AI collaboration and modest feedback mechanisms; those were agreements, not concessions extracted during the debate. I remain unpersuaded that replenishment and improved verification will jointly outrun the difficulty of exploiting new opportunities within ten years.

I accept your breadth criterion as a useful **adjudication proposal**, rather than a retroactive definition: sustained, consequential acceleration in three meaningfully different technological domains, including two requiring physical experimentation, reaching reproduced useful technologies and showing deployment evidence. We should select representative domains before inspecting the outcomes. This would assess technological breadth; broadly superhuman capability and the causal AI research feedback would still require their separate evidence.

Biomedicine need not be one of those domains. My bottleneck example is a test of the spillover mechanism, not a veto over acceleration elsewhere. Your conditional reduction to roughly 45% if informative physical research panels remained flat answers my challenge directly. We agree that faster AI research alone would not settle the forecast.

My remaining 10% on “never” concerns the full pattern failing to coalesce, not progress stopping. Sustained gains could remain uneven or insufficiently reinforcing. That possibility is conjectural; I have offered no proof of a permanent ceiling.

My most useful next observation matches yours: successive AI assistants producing a growing advantage over a frozen predecessor across complete physical research projects, with failures, costs and replication counted, and documented contributions to improving the successor. Convincing results would move me toward your forecast. An advantage that disappeared under that accounting would strengthen my skepticism. We now disagree chiefly about how soon that demanding observation will arrive.

---

## What changed and what remains unsettled

*Moderator's assessment*

The agents finished on opposite sides of the September 2036 proposition. Both changed their estimates, and both made their reasons for disagreement more specific.

| Probability assigned to the full September 2036 proposition | First contribution | Second contribution | Final contribution |
| --- | --- | --- | --- |
| **Ad Astra** | 70% | 65% | 65% |
| **Pedes in Terram** | 35% | 40% | 40% |

These are the agents' stated subjective judgments. Ad Astra's additional figure of roughly 45% belongs to a hypothetical state of evidence in 2029; it is not its current forecast. Pedes's separate probability that the broader pattern never emerges fell from 15% to 10%.

**Pedes made a specific concession.** The argument that stronger researchers could make new opportunities accessible corrected its emphasis on opportunities becoming harder to exploit. Its fourth-turn statement of persuasion had a defined object: the replenishment of research opportunities. Pedes explicitly distinguished that change from its preexisting acceptance that humans could participate in an AI-driven feedback loop. [The concession](#4-pedes-in-terram-is-persuaded-on-one-point).

**Ad Astra reduced the weight it placed on selected successes.** Pedes's public-discovery evidence lowered its estimate, and the discussion of validation made its proposed evidence standard more demanding. By its final turn, Ad Astra was willing to become skeptical of the deadline if informative physical-research comparisons stayed flat while AI research accelerated. That conditional commitment gives a future reader something concrete to check. [Ad Astra's final assessment](#5-ad-astra-gives-its-final-assessment).

The remaining disagreement is about whether improvements will arrive together quickly enough. Ad Astra expects better researchers to improve experiment selection, verification and practical implementation as well as idea generation. Pedes places more weight on a future in which progress is substantial but uneven, leaving the full conjunction unsatisfied by 2036. Both positions still depend on extrapolation.

The exchange also exposed a limitation in the original proposition: words such as *substantially*, *broadly* and *sharp* were not assigned numerical thresholds. The agents eventually proposed acceleration across three dissimilar technological domains, including two involving physical experimentation, as one way to judge breadth. That proposal makes their disagreement easier to investigate, but does not turn the experiment into a fully specified forecasting contract. Representative domains, measures of useful progress, and comparison methods would still need agreement before results were selected.

Nor does this single exchange establish that AI debate improves forecasting accuracy. The observed outcome is a set of revised arguments and self-reported probabilities under assigned roles. Repeating the experiment with different starting instructions, speaking orders and models could help assess how dependent that outcome is on its setup. The [protocol and transcript manifest](https://github.com/roughatsea/roughatseablog/tree/main/experiments/singularity-debate-2026-09-10) preserve the structure of this run.

The agents' most useful shared proposal is to compare successive AI assistants with a fixed predecessor across complete research projects: count the failures, include the costs, reproduce the results, and document how AI contributed to improving the successor. A project record that survives that accounting would give both speakers a reason to return—and a specific belief to reconsider.
