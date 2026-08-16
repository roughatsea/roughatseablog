---
title: "The Transformer Killers: A Field Guide to the Post-Transformer AI Architecture Race"
description: "Mamba, Kimi Linear, Titans, RWKV, xLSTM, Dragon Hatchling, and a growing cast of challengers are trying to fix the Transformer’s weaknesses. The interesting story is not which one wins, but what they are converging toward."
date: 2026-08-15
tags:
  - artificial-intelligence
  - machine-learning
  - transformers
  - architecture
  - research
---

# The Transformer Killers: A Field Guide to the Post-Transformer AI Architecture Race

Every few weeks, someone appears to have discovered the architecture that will finally kill the Transformer.

The pitch varies.

Attention is too expensive. Language is a terrible substrate for thought. Large models cannot really remember. Data centers are an absurd brute-force detour. The brain is sparse and recurrent, so AI should be too. Reasoning has geometry. Memory should learn during inference. A model should think in latent space instead of talking to itself one token at a time.

Then comes the inevitable conclusion:

**This changes everything.**

It is easy to become cynical about the entire category.

That would be a mistake.

There really is a broad, technically serious search underway for architectures that improve on the standard Transformer. Some candidates are established research programs with open code, public checkpoints, scaling studies, and industrial deployments. Some are intriguing laboratory experiments. Some are startups with bold claims and limited public evidence. And some are not really Transformer replacements at all, but attacks on adjacent assumptions such as how memory or reasoning should work.

The more interesting question is therefore not:

> Which startup has discovered the one true successor to the Transformer?

It is:

> **What weaknesses are all of these groups independently trying to fix, and what does their convergence tell us about the architecture that may come next?**

That question produces a much more coherent map of the field.

---

## First: what exactly is wrong with Transformers?

The Transformer earned its dominance for good reasons. Self-attention is expressive, highly parallelizable during training, scales extraordinarily well, and allows every token to interact directly with other tokens in the context.

The architecture also carries some increasingly awkward properties.

### 1. Attention gets expensive as context grows

Standard self-attention compares tokens against other tokens in the sequence. During training, the amount of work associated with full attention grows quadratically with sequence length.

During autoregressive inference, another problem appears: the model commonly stores key and value vectors from previous tokens in a **KV cache** so future tokens can attend back to them. The longer the conversation or document becomes, the larger that cache becomes.

This is manageable at modest context lengths. It becomes increasingly consequential when models operate over hundreds of thousands or millions of tokens, or when inference-time reasoning causes them to generate enormous internal or visible trajectories.

### 2. Context is not the same thing as memory

A conventional language model has two strange kinds of knowledge:

1. information embedded into its parameters during training, and
2. information temporarily present in the current context window.

The first is durable but expensive to change. The second is easy to change but ephemeral.

That leaves a large missing middle: a form of memory that can rapidly incorporate new experience, preserve it, retrieve it later, and update it without retraining the entire model.

### 3. Reasoning is often forced through language

Modern reasoning models frequently spend large amounts of inference compute generating intermediate tokens.

That works surprisingly well. But it raises an obvious question: why should every useful intermediate computation have to be translated into natural language?

Human beings can rotate an object mentally, recognize a face, evaluate a chess position, or experience a vague intuition before they can articulate what happened. It is at least plausible that language is an interface to thought rather than the only possible computational substrate for thought.

### 4. Dense computation is expensive

A giant dense neural network does a great deal of work for every token. Mixture-of-experts systems already challenge that assumption by activating only a fraction of their parameters for each token.

Other research programs push sparsity further, asking whether both computation and communication inside the model can become more selective.

These are separate problems.

That matters, because the architectures described as “Transformer killers” are often attacking completely different parts of the machine.

---

# The field at a glance

The table below is a useful first approximation of the landscape as of August 2026.

| Player / research line | Proposed solution | What changes | My read |
|---|---|---|---|
| **Mamba / Mamba-3** | Selective state-space models | Replace global attention with recurrent state that selectively remembers and forgets | **Top-tier contender; one of the field’s gravitational centers** |
| **NVIDIA Nemotron-H** | Hybrid Mamba + attention | Keep a small number of attention layers while replacing most with Mamba | **Important industrial validation of the hybrid thesis** |
| **Kimi Linear / Kimi Delta Attention** | Delta-rule linear attention | Replace the growing KV cache with a finite recurrent memory that can be edited | **One of the strongest recent cases that full attention is not always optimal** |
| **Gated DeltaNet / Gated DeltaNet-2** | Writable recurrent fast-weight memory | Separate forgetting, erasing, and writing in compact recurrent state | **Fast-moving and increasingly competitive with Mamba-like models** |
| **AI21 Jamba** | Transformer + Mamba + MoE | Interleave attention and recurrent state-space layers, then add sparse experts | **Credible transitional architecture at large scale** |
| **Google Griffin / RecurrentGemma** | Gated recurrence + local attention | Use recurrence for most sequence processing while retaining local attention | **Serious proof that recurrence can scale back into language modeling** |
| **RWKV** | Parallelizable recurrent model | Train efficiently in parallel, infer as an RNN with constant-size state | **One of the most mature pure-recurrent alternatives** |
| **xLSTM** | Modernized LSTM with richer memory | Revive gated recurrence with exponential gating and matrix memory | **The supposedly obsolete LSTM has become interesting again** |
| **Liquid AI / LFM2** | Gated short convolutions + limited attention | Optimize the sequence operator around actual hardware rather than architectural purity | **Very credible efficiency-first program, especially on-device** |
| **Google Titans / MIRAS** | Neural long-term memory | Give the model a memory network whose parameters change during inference | **Potentially more important than replacing attention itself** |
| **Google Nested Learning / HOPE** | Multiple nested learning timescales | Treat architecture, optimizer, and memory as nested adaptive systems | **One of the most radical serious research directions** |
| **Test-Time Training (TTT)** | Make hidden state a trainable model | The recurrent state is itself a small model updated while reading the sequence | **Elegant attack on the fixed-state bottleneck** |
| **Pathway BDH / BDH-CQ** | Sparse recurrent memory + latent reasoning | Combine writable recurrent memory, sparse activations, and iterative latent computation | **Genuinely interesting and unusually ambitious, but still early** |
| **Coconut** | Continuous latent reasoning | Feed hidden reasoning states back into the model instead of verbalizing every step | **Not a Transformer killer, but potentially a chain-of-thought killer** |
| **Hyena** | Long implicit convolutions + gating | Replace attention with subquadratic convolutional sequence mixing | **Important precursor and proof that attention-free language modeling is viable** |
| **RetNet** | Retention mechanism with parallel/recurrent forms | Train in parallel but decode recurrently with constant-cost state | **Historically important bridge between attention and modern recurrence** |
| **Sophontic** | Geometric reasoning | Train or manipulate the geometry of internal reasoning representations directly | **Interesting hypothesis; extraordinary claims still need public technical evidence** |

The rest of the article explains what those descriptions actually mean.

---

# 1. Mamba: the center of gravity

If one research line deserves to be called the leading “Transformer killer” family, it is probably **Mamba**.

The original [Mamba paper](https://arxiv.org/abs/2312.00752) by Albert Gu and Tri Dao began from an old idea: the **state-space model**.

Instead of allowing every new token to directly inspect a giant collection of previous token representations, a recurrent state-space model carries forward a compressed state:

```text
new token + previous state
            ↓
        state update
            ↓
        new state
```

The attractive property is obvious. The state can remain fixed in size even as the sequence becomes very long.

Traditional recurrent models struggled because compression creates a difficult question: **what should the model preserve?**

Mamba's key move was **selectivity**. Parameters governing the state update depend on the input, allowing the model to decide which information should flow forward and which should be discarded.

That gives recurrence something more like selective memory rather than indiscriminate compression.

The original Mamba work showed that an attention-free state-space model could compete seriously with Transformers across language and other sequence domains while offering linear sequence scaling and efficient autoregressive inference.

The line has continued. [Mamba-3](https://arxiv.org/abs/2603.15569), released in 2026, attacks weaknesses that had become clearer in the intervening years: retrieval, state tracking, expressivity, and the gap between theoretical efficiency and actual hardware efficiency. It adds richer state-space dynamics, including complex-valued state updates and multi-input/multi-output formulations.

The important story is no longer merely “Mamba exists.”

It is that Mamba-like recurrence has started escaping the research-paper stage and appearing inside large industrial systems.

---

# 2. NVIDIA Nemotron-H: perhaps attention is not all you need

NVIDIA's [Nemotron-H](https://research.nvidia.com/labs/adlr/nemotronh/) may be one of the most important pieces of evidence in the entire post-Transformer discussion.

Why?

Because NVIDIA did not merely train a small experimental recurrent model.

It built large language models in which **most attention layers are replaced by Mamba layers**, then compared them against conventional Transformer counterparts.

Nemotron-H-8B, for example, uses 24 Mamba-2 layers, 24 MLP layers, and only **four self-attention layers**. NVIDIA reports comparable or better overall accuracy than similarly sized Transformer baselines, along with substantially improved inference efficiency.

That changes the question.

For years, the Transformer era was organized around the slogan from the foundational paper:

> Attention is all you need.

Nemotron-H suggests a more mischievous possibility:

> **How much attention do you actually need?**

The answer may be: not very much.

This is one reason hybrid architectures deserve more attention than ideological “Transformer versus non-Transformer” debates. Attention is extremely good at exact, content-addressed retrieval. Recurrent systems are extremely attractive for efficient sequence processing.

A rational engineer is under no obligation to choose only one.

Use recurrence for most of the work. Keep attention where attention earns its cost.

That idea keeps reappearing.

---

# 3. Kimi Linear: turn attention into editable memory

Moonshot AI's [Kimi Linear](https://arxiv.org/abs/2510.26692) is another major development because it attacks attention through a somewhat different route.

The core mechanism is **Kimi Delta Attention (KDA)**.

A useful way to think about ordinary attention is that the model keeps accumulating records of the past and later searches over them.

Linear-attention systems instead try to compress those records into a recurrent memory of fixed size.

The hard problem is updating that memory without destroying useful information already inside it.

This is where the **delta rule** enters.

Rather than simply adding new information, a delta-rule memory can ask what it currently predicts for a key, calculate the error, and update the memory toward the new value. Conceptually:

```text
read current memory
        ↓
compare with desired association
        ↓
compute the difference
        ↓
edit memory by the difference
```

That makes the state more like an editable associative memory than a simple running summary.

Kimi Linear combines KDA with a smaller number of Multi-Head Latent Attention layers. Moonshot reported that, under matched training conditions, the hybrid architecture outperformed its full-attention comparison model across short-context, long-context, and reinforcement-learning scaling evaluations while reducing KV-cache usage by as much as 75 percent and reaching up to six times the decoding throughput at one-million-token context.

Those are company-reported results, not a law of nature. But they are much more consequential than a demonstration on a toy puzzle.

The architecture was trained at substantial scale: 48 billion total parameters with 3 billion activated parameters.

Again the pattern appears:

**Replace most expensive global attention with recurrent memory, but retain some attention where useful.**

---

# 4. Gated DeltaNet-2: the recurrent-memory race is accelerating

Kimi is part of a broader family of delta-rule and linear-attention systems.

A particularly interesting 2026 entrant is NVIDIA's [Gated DeltaNet-2](https://arxiv.org/abs/2605.22791).

The central idea is wonderfully mechanical.

Imagine a compact memory that must continually perform two operations:

1. remove or weaken an old association,
2. write a new association.

Earlier delta-rule systems often couple those operations too tightly. Gated DeltaNet-2 gives the model more independent control over **erase** and **write** behavior.

At 1.3 billion parameters trained on 100 billion FineWeb-Edu tokens, its authors report stronger aggregate performance than the evaluated Mamba-2, Gated DeltaNet, KDA, and Mamba-3 variants across language modeling, commonsense reasoning, and retrieval, with especially strong long-context retrieval results.

That does not crown a winner. Architecture comparisons are notoriously sensitive to training recipes, hardware kernels, parameter budgets, and evaluation suites.

But it tells us something important about the direction of travel.

A great deal of post-Transformer research is converging on **fast weights** and **writable recurrent state**.

The question is becoming less:

> Can recurrence work?

and more:

> What is the best memory-update rule for recurrence?

That is a much more mature research question.

---

# 5. Jamba: hybridization before it was fashionable

AI21 Labs' [Jamba](https://arxiv.org/abs/2403.19887) was an early demonstration that one need not choose between Transformer attention, Mamba recurrence, and sparse mixture-of-experts computation.

Jamba combines all three.

It interleaves Transformer and Mamba layers, then inserts mixture-of-experts layers in parts of the network so total model capacity can grow without requiring every parameter to activate for every token.

The later [Jamba 1.5](https://arxiv.org/abs/2408.12570) scaled the approach to large open-weight models with long context.

Architecturally, Jamba is interesting because it treats model design as an engineering trade space rather than a philosophical commitment.

Attention is good at some things.

Recurrent state is good at others.

Sparse experts can increase representational capacity without making every inference equally expensive.

Combine them.

That may sound less exciting than announcing the death of the Transformer. It may also be much closer to how actual architecture transitions happen.

---

# 6. Google Griffin and RecurrentGemma: recurrence returns from exile

Before Transformers, recurrent neural networks were central to sequence modeling.

Then attention arrived and largely displaced them.

Google's [Griffin](https://arxiv.org/abs/2402.19427) research line is part of a striking reversal: recurrence is back.

The researchers introduced two related architectures:

- **Hawk**, based on gated linear recurrence
- **Griffin**, which mixes gated recurrence with local attention

Griffin was scaled to 14 billion parameters and showed that recurrent models could achieve competitive language-modeling performance while improving inference efficiency.

Google later released [RecurrentGemma](https://arxiv.org/abs/2404.07839), an open model family based on Griffin.

The architectural logic is again hybrid.

Global self-attention is expensive because it lets every token directly interact with the entire sequence. But perhaps every layer does not need that capability.

A recurrent mechanism can carry state efficiently. Local attention can handle nearby exact interactions. The system can therefore preserve much of what makes attention powerful without paying the full global-attention cost everywhere.

---

# 7. RWKV: train like a Transformer, run like an RNN

RWKV has been pursuing one of the cleanest architectural promises in the field:

> **Train efficiently in parallel, then perform inference recurrently.**

That combination matters because old recurrent networks had an uncomfortable tradeoff. Their sequential nature made training difficult to parallelize, while Transformers were exceptionally friendly to modern accelerator hardware.

RWKV tries to keep the inference advantages of recurrence without surrendering parallel training.

The 2025 [RWKV-7 “Goose”](https://arxiv.org/abs/2503.14456) architecture introduces a generalized delta rule, vector-valued gating, in-context learning rates, and richer state evolution.

During generation, RWKV can operate with constant-size recurrent state rather than an ever-growing KV cache.

That makes it especially interesting for long-running local systems and applications where predictable memory usage matters.

RWKV has also accumulated something many younger research lines do not yet have: an actual ecosystem of open implementations, checkpoints, datasets, and users.

It is easy to underrate architectural maturity because it is less exciting than novelty.

---

# 8. xLSTM: the zombie architecture comes back stronger

The original **Long Short-Term Memory**, or LSTM, dates to the 1990s.

It would be reasonable to assume that the Transformer era permanently relegated LSTMs to the history books.

Then Sepp Hochreiter—one of the original creators of the LSTM—and collaborators came back with [xLSTM](https://arxiv.org/abs/2405.04517).

The family modernizes LSTM-style recurrence using new gating mechanisms and richer memory structures, including **matrix memory** rather than relying only on conventional vector state.

The subsequent [xLSTM 7B](https://arxiv.org/abs/2503.13427) work scaled a recurrent language model to seven billion parameters and reported downstream performance comparable to similarly sized models while emphasizing fast, memory-efficient inference.

Whether xLSTM becomes a dominant architecture is less important than what its existence tells us.

The industry may have confused:

> “the particular recurrent architectures we had were not good enough”

with:

> “recurrence itself is obsolete.”

Those are very different statements.

---

# 9. Liquid AI: architecture search meets hardware reality

Liquid AI approaches the problem from a different angle.

Its [LFM2 architecture](https://www.liquid.ai/blog/liquid-foundation-models-v2-our-second-series-of-generative-ai-models) uses mostly **double-gated short convolution blocks** with a smaller number of grouped-query attention layers.

Why short convolutions rather than an ideologically pure recurrent architecture?

Because Liquid explicitly optimized the architecture around the target hardware.

Its architecture-search process measures actual latency, memory use, and device behavior rather than assuming that an operation that looks efficient on paper will necessarily be efficient on a real CPU, GPU, or NPU.

That is a profoundly important point.

Machine-learning architectures do not live in algebra textbooks. They live on hardware.

An operation can have better asymptotic complexity and still lose because memory movement, kernel fusion, parallelism, numerical format, compiler support, or accelerator design favors its competitor.

Liquid's larger [LFM2-24B-A2B](https://www.liquid.ai/blog/lfm2-24b-a2b) adds mixture-of-experts sparsity while keeping the same broad hybrid philosophy. The company describes an approximately 1:3 ratio of attention to convolution blocks in that model.

Once more:

**a little attention survives.**

---

# 10. Titans: what if memory could learn while the model is running?

Replacing attention may not be the most consequential architectural problem in AI.

Replacing the strange memory model of current LLMs may be bigger.

Google's [Titans and MIRAS](https://research.google/blog/titans-miras-helping-ai-have-long-term-memory/) work begins from a limitation shared by many recurrent alternatives.

A fixed-size recurrent vector or matrix can process sequences efficiently, but eventually it must compress an enormous amount of history into a limited representational space.

Titans introduces a more expressive **neural long-term memory**.

The crucial conceptual move is that this memory is itself a neural network whose parameters can be updated while the system processes new information.

Instead of:

```text
model weights = frozen
context = temporary
```

we begin moving toward something more like:

```text
slow weights = durable learned knowledge
fast neural memory = changes during use
attention / working state = immediate context
```

Titans also uses a notion of **surprise** to help decide what deserves to be memorized. Information that is already well predicted need not consume as much memory-update effort as information that violates the system's expectations.

This starts to look less like an enormous static function with a text buffer attached and more like a system possessing distinct kinds of memory.

That is potentially a much deeper architectural shift.

---

# 11. Nested Learning and HOPE: multiple timescales of learning

Google's later [Nested Learning](https://research.google/blog/introducing-nested-learning-a-new-ml-paradigm-for-continual-learning/) work pushes this idea further.

The central intuition is that “model architecture” and “optimizer” may be less separate than we normally pretend.

A learning system can be understood as multiple nested optimization processes operating at different timescales.

That suggests an architecture with something closer to a hierarchy of memory:

```text
milliseconds   → immediate recurrent state
seconds        → working memory
minutes        → rapidly adapting learned memory
hours/days     → slower consolidated memory
long term      → stable parameters
```

This is only an intuition, not a literal description of Google's implementation. But it captures the direction.

Their proof-of-concept **HOPE** architecture extends Titans with continuum memory systems and self-modifying recurrent behavior.

If this research line succeeds, “continual learning” may stop meaning periodically fine-tuning a giant frozen model and start meaning that adaptation is a native property of the architecture itself.

That would be a genuine paradigm change.

It would also create difficult safety and stability questions. A model that can learn continuously must avoid corrupting itself, amplifying malicious input, catastrophically forgetting old capabilities, or turning temporary misinformation into durable belief.

Solving memory is not merely a performance problem.

---

# 12. Test-Time Training: make the hidden state a model

[Test-Time Training layers](https://arxiv.org/abs/2407.04620) attack the recurrent-memory bottleneck with a wonderfully strange idea.

What if the hidden state of an RNN were not merely a vector?

What if the hidden state were **another machine-learning model**?

Then processing a token could update that inner model through a small self-supervised learning step.

The original TTT work explored hidden states that are themselves linear models or small multilayer perceptrons.

This creates an expressive recurrent memory without requiring ordinary attention to preserve every old token individually.

The conceptual shift is subtle but important:

```text
traditional RNN:
state = numbers

TTT:
state = a model that is learning
```

TTT and Titans are not identical, but they rhyme.

Both suggest that one of the next major transitions in AI architecture may be from **static hidden state** to **learned mutable memory at inference time**.

---

# 13. Dragon Hatchling: recurrence, sparse biology, memory, and latent thought

Pathway's **BDH**, short for Dragon Hatchling, is more ambitious than most alternatives because it attempts to address several architectural problems simultaneously.

The original [Dragon Hatchling paper](https://arxiv.org/abs/2509.26507) describes a biologically inspired recurrent architecture based on locally interacting neuron-like particles, sparse positive activations, state-space sequence processing, and synaptic-style working memory.

The authors report Transformer-like language-model scaling in experiments ranging from tens of millions to roughly a billion parameters.

The architecture is also designed with interpretability in mind. Sparse positive activations and the structure of its recurrent state are intended to make internal behavior easier to inspect than in conventional dense representations.

That would already make BDH unusual.

Then came [BDH-CQ](https://arxiv.org/abs/2608.09888) in August 2026.

BDH-CQ combines recurrent in-context learning with **iterative latent reasoning**. Inputs update recurrent memory; the model can then perform repeated computation in a high-dimensional internal workspace without converting each intermediate step into language.

A 150-million-parameter configuration reached 29.5 percent pass@2 on the public ARC-AGI-1 evaluation set at a reported computed inference cost of $0.0007 per task, which the authors present as a new cost-efficiency point on the benchmark.

That result does not prove that BDH is the architecture after Transformers.

ARC is a specialized benchmark. A 150M reasoning system is not a general-purpose frontier language model. Company-affiliated results need independent replication. And ambitious language around biological plausibility, continual learning, interpretability, or universal reasoning should be separated carefully from what individual experiments actually establish.

But BDH deserves a substantially higher category than “vaporware.”

There is a real architecture, a real research program, public papers, implementations, and follow-up experiments.

The appropriate stance is neither belief nor dismissal.

It is **attention**.

---

# 14. Coconut: perhaps reasoning should not be language

[Coconut](https://arxiv.org/abs/2412.06769), or Chain of Continuous Thought, is not actually a Transformer replacement.

It attacks another assumption.

Current reasoning systems often behave roughly like this:

```text
internal representation
        ↓
decode into words
        ↓
generate reasoning tokens
        ↓
encode those tokens again
        ↓
continue thinking
```

Coconut asks why the middle steps must be language at all.

Instead of decoding an intermediate hidden state into a token, it feeds that hidden state directly back into the model as the next reasoning input.

Conceptually:

```text
latent state
    ↓
latent state
    ↓
latent state
    ↓
answer in language
```

The original experiments found that continuous thoughts could encode multiple potential future reasoning paths and, on some tasks, behave more like a breadth-first search than conventional chain-of-thought reasoning.

That is fascinating because token-by-token reasoning may itself become one of AI's largest compute sinks.

If models learn to perform more useful computation per latent step than per generated token, the architecture of **reasoning** could change even if the underlying language model remains partly Transformer-based.

So Coconut belongs in this field guide with an asterisk.

It may not kill the Transformer.

It may help kill the assumption that **thinking must look like talking**.

---

# 15. Hyena: long convolutions instead of attention

Before Mamba became the fashionable alternative, [Hyena](https://arxiv.org/abs/2302.10866) demonstrated that attention could be replaced by another old mathematical tool: convolution.

Hyena uses long implicitly parameterized convolutions combined with data-dependent gating.

The goal is to obtain long-range sequence interaction without performing full quadratic self-attention.

Its early results showed attention-free language models approaching Transformer quality while becoming increasingly attractive at long sequence lengths.

Hyena matters even if another architecture ultimately dominates because it helped break an important psychological barrier.

The Transformer had become so successful that it was easy to confuse:

> “attention currently works best”

with:

> “attention is the only mechanism capable of working at scale.”

Hyena was one of several research programs demonstrating that the second statement was too strong.

---

# 16. RetNet: a bridge between attention and recurrence

Microsoft Research's [Retentive Network](https://arxiv.org/abs/2307.08621), or RetNet, is another important precursor.

Its **retention** mechanism can be expressed in several computational forms:

- parallel, for efficient training
- recurrent, for low-cost autoregressive inference
- chunkwise recurrent, for long-sequence processing

That combination anticipated a theme that now appears almost everywhere in post-Transformer research:

> **Parallelize the model when training, recur when generating.**

Mamba, RWKV, delta-rule systems, and other modern alternatives differ substantially in details, but they share the desire to escape the Transformer tradeoff between excellent parallel training and expensive growing inference state.

RetNet is therefore worth remembering as part of the intellectual genealogy even if it does not become the final architecture.

---

# 17. Sophontic and geometric reasoning: interesting, but move the evidence slider down

Sophontic represents a different category from Mamba, Jamba, Nemotron, or RWKV.

In a [public interview about its geometric-reasoning approach](https://youtu.be/4S8I22ybG2c), the company argues that reasoning corresponds to structured geometry inside a model's latent representations and that AI systems can be trained more directly around those structures rather than relying so heavily on brute-force scaling and behavioral optimization.

The idea is not absurd. Representation geometry is a legitimate area of machine-learning research, and many researchers study how concepts, directions, manifolds, and reasoning operations appear in high-dimensional latent spaces.

Sophontic also emphasizes **perturbation tests**: alter a load-bearing detail in a problem so that the correct conclusion changes. A system relying on memorized surface patterns should be more likely to fail, whereas a system that has learned the underlying relation should update its answer appropriately.

That is a sensible evaluation instinct.

But the evidentiary category matters.

As of this writing, Sophontic's strongest public claims have run well ahead of the amount of model, training, and independent evaluation material available for outsiders to inspect.

That does not make the project wrong.

It means the correct response is:

> **Interesting. Show us the model. Show us the eval set. Show us the perturbations. Let independent groups reproduce the result. Then scale it.**

Extraordinary architecture claims are cheap.

Scaling curves are expensive.

---

# The part that is easy to miss: several of these ideas are converging

At first glance, these research programs look wildly different.

State-space equations. Delta rules. Matrix memories. Long convolutions. Biological networks. Neural memory. Continuous thought. Geometric latent spaces.

But zoom out and several common themes appear.

## Theme 1: recurrence is back

Mamba, Griffin, RWKV, xLSTM, RetNet, Kimi Delta Attention, Gated DeltaNet, TTT, Titans, and BDH all contain some version of **state that evolves through time**.

This is remarkable.

The Transformer revolution looked, for a while, like the death of recurrence.

The post-Transformer search increasingly looks like recurrence's return—now armed with better mathematics, better parallel training algorithms, better kernels, better hardware, and lessons learned from attention.

## Theme 2: memory should be writable

A fixed hidden state is not enough.

The most interesting new architectures increasingly treat memory as something that can be **selectively edited**.

Delta-rule systems erase and rewrite associations.

Titans updates neural memory parameters.

TTT literally trains its hidden-state model during inference.

BDH updates recurrent memory as new demonstrations arrive.

This begins to blur a boundary that once seemed obvious:

**Where does inference end and learning begin?**

## Theme 3: attention is becoming a premium operation

The strongest hybrid systems do not necessarily abolish attention.

They ration it.

Nemotron-H uses a small number of attention layers among many Mamba layers.

Kimi Linear combines KDA with MLA.

Jamba interleaves Mamba and Transformer layers.

Griffin mixes recurrence with local attention.

Liquid LFM2 uses many convolution blocks and fewer attention blocks.

That pattern suggests a useful analogy.

Perhaps attention will become less like the CPU and more like a specialized accelerator: extraordinarily powerful, but not something every layer needs to invoke for every operation.

## Theme 4: language may become the I/O layer, not the reasoning substrate

Coconut and BDH-CQ point toward another transition.

Language is immensely useful for communicating with humans. It is also discrete, redundant, and shaped by the needs of communication rather than mathematical optimization.

Future systems may spend more of their internal compute in continuous latent states, calling the language decoder only when they need to communicate, use a language-based tool, or externalize a conclusion.

If that happens, today's long visible chains of thought may eventually look like an early implementation trick rather than a fundamental property of machine reasoning.

## Theme 5: hardware matters

The best theoretical complexity does not automatically produce the fastest real model.

Mamba's work has increasingly emphasized hardware-aware algorithms. Kimi's contribution includes specialized efficient kernels. Liquid explicitly performs hardware-in-the-loop architecture search. NVIDIA designs architectures around real inference constraints.

The successor to the Transformer will not be chosen by asymptotic notation alone.

It will be co-designed with GPUs, NPUs, memory hierarchies, compilers, quantization schemes, and inference engines.

---

# Why the “Transformer killer” framing is probably wrong

Technology transitions rarely happen as clean coups.

The next architecture probably does not arrive one morning, defeat the Transformer on every benchmark, and cause every GPU cluster on Earth to be reformatted by lunch.

A more plausible future looks like this:

```text
                 FUTURE FOUNDATION MODEL
                         │
        ┌────────────────┼────────────────┐
        │                │                │
 recurrent / linear   selective        sparse
 sequence core        attention         experts
        │                │                │
        └───────────┬────┴─────┬──────────┘
                    │          │
             writable memory   │
                    │          │
                    └────┬─────┘
                         │
                 latent reasoning
                         │
                 language / tools
                         │
                      output
```

The actual model might contain:

- recurrent state-space layers
- a few exact-attention layers
- delta-rule associative memory
- sparse mixtures of experts
- separate working and long-term memory systems
- test-time adaptation
- latent recurrent reasoning
- external retrieval and tools

At what point does such a machine stop being a Transformer?

There may never be a satisfying answer.

And it may not matter.

---

# A better analogy: what happened to the CPU

The classical CPU was not “killed” by one magical replacement.

Modern computing accumulated specialization.

CPUs gained deep cache hierarchies, branch predictors, vector instructions, multiple cores, and increasingly exotic execution machinery. GPUs took over massively parallel workloads. Dedicated accelerators appeared for graphics, networking, cryptography, video, machine learning, and signal processing.

The computer became heterogeneous.

AI architectures may be heading toward the same fate.

The Transformer could become one component inside a heterogeneous cognitive machine.

Attention may remain excellent for precise retrieval.

Recurrence may handle cheap temporal state.

Fast-weight memories may handle learning within a session.

Sparse experts may supply capacity.

Latent loops may perform reasoning.

Tools may handle computation or factual retrieval that does not belong inside the neural network at all.

From this perspective, searching for **the** Transformer killer may be as misguided as searching for **the** CPU killer.

The interesting transition is architectural diversification.

---

# How to evaluate the next “revolutionary architecture” announcement

There is so much noise in this field that it helps to maintain an evidence ladder.

A useful version is:

```text
interesting idea
      ↓
toy demonstration
      ↓
internal company benchmark
      ↓
public paper with methodology
      ↓
released code
      ↓
released weights / checkpoints
      ↓
matched-compute comparison
      ↓
independent reproduction
      ↓
scaling evidence
      ↓
broad-domain performance
      ↓
production deployment
```

The farther down that ladder a project travels, the more seriously its claims should be weighted.

This also prevents two opposite mistakes.

### Mistake 1: believing every breakthrough announcement

A small model beating GPT-4-class systems on a custom reasoning benchmark may tell us something fascinating.

It does not automatically tell us that the model can write software, understand medicine, speak twenty languages, interpret images, use tools, follow instructions, and survive adversarial real-world deployment.

A benchmark is evidence about a capability under particular conditions.

It is not a declaration of universal superiority.

### Mistake 2: dismissing everything until it beats the frontier everywhere

This standard is also unreasonable.

New architectures begin small.

A method can reveal a fundamentally better memory mechanism before anyone has spent hundreds of millions of dollars scaling it. Transformer research itself did not begin with a frontier chatbot.

The appropriate question is:

> **Does the result survive increasingly difficult tests as we move down the evidence ladder?**

That is how scientific credibility accumulates.

---

# My current watchlist

If I were deciding where to devote attention rather than money, the ranking would look roughly like this.

## Tier 1: already reshaping architecture design

### Mamba / state-space models

The most important alternative family to watch. It has strong academic foundations, multiple generations of improvement, open implementations, and substantial industrial adoption.

### Hybrid recurrent-attention systems

Nemotron-H, Jamba, Kimi Linear, Griffin, and Liquid all support the possibility that the practical near-term answer is **less attention**, not **zero attention**.

### Delta-rule linear attention

Kimi Delta Attention, Gated DeltaNet, and Gated DeltaNet-2 make associative fast-weight memory one of the most interesting active fronts in sequence modeling.

## Tier 2: could change what an AI model fundamentally is

### Titans / MIRAS / Nested Learning / HOPE

If models acquire robust native memory that updates during inference without catastrophic instability, the distinction between “using a model” and “teaching a model” begins to dissolve.

### Test-Time Training

An elegant and related attempt to turn recurrent state into a learner rather than a passive vector.

### Latent reasoning

Coconut and BDH-CQ raise the possibility that generating language tokens is merely one way to spend inference compute—and perhaps not the best one.

## Tier 3: credible alternatives with specific strengths

### RWKV

Mature, open, recurrent, and practical.

### xLSTM

A serious modern revival of gated recurrence with impressive efficiency ambitions.

### Liquid LFM

Especially important when architecture design is constrained by real devices rather than datacenter abstractions.

### Griffin / RecurrentGemma

Strong evidence that recurrence plus limited attention can scale cleanly.

## Tier 4: high-interest, higher-uncertainty

### Dragon Hatchling

Enough technical substance to deserve close attention; not enough broad scaling evidence to justify the grandest claims yet.

### Sophontic geometric reasoning

An interesting conceptual thesis presently awaiting the public technical evidence necessary to judge its strongest claims.

---

# The most important signal may be the convergence, not the winner

It is tempting to experience the flood of post-Transformer announcements as evidence that everyone and their dog has invented a miracle architecture.

There is another interpretation.

The field may be in an **architectural search phase**.

That creates a Cambrian explosion of ideas because the dominant architecture is extraordinarily successful but its weaknesses are now visible enough to target.

Researchers disagree about the cure, but they increasingly agree about the symptoms:

- full attention is expensive at long context
- growing KV caches are awkward
- static models have poor native memory
- fixed recurrent states can be too lossy
- dense computation wastes resources
- verbalized chain-of-thought may waste inference compute
- continual learning remains primitive
- hardware efficiency must be designed, not assumed

Those shared diagnoses matter more than the marketing language attached to any single proposed cure.

Mamba says selective recurrence.

Kimi says delta-rule memory.

Titans says neural long-term memory.

TTT says make the state itself a learner.

Coconut says stop translating every thought into words.

BDH says combine recurrent memory, sparse computation, and latent reasoning.

Liquid says optimize the architecture against the hardware that must actually run it.

Nemotron and Jamba say: take the useful pieces and hybridize them.

That last answer may ultimately be the most important.

---

# The likely future is not post-Transformer. It is post-purity.

The Transformer may not die.

It may dissolve.

Its best ideas will remain while expensive assumptions are replaced one by one.

Global attention becomes occasional attention.

The KV cache becomes recurrent associative memory.

Static context becomes writable neural memory.

Dense layers become sparse experts.

Chain-of-thought becomes latent computation.

Offline training is supplemented by safe test-time adaptation.

The resulting machine may contain enough Transformer DNA that historians can trace its ancestry, yet differ enough that calling it a Transformer feels increasingly silly.

That is how many dominant technologies disappear.

Not with a funeral.

With gradual replacement of their organs.

And if that is what is happening now, then the weekly parade of alleged “Transformer killers” is not merely hype.

It is the noisy surface of something much more interesting:

**the first serious search for what comes after the architecture that created the modern AI era.**

---

## Primary sources and further reading

- Albert Gu and Tri Dao, [Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752)
- Lahoti et al., [Mamba-3: Improved Sequence Modeling using State Space Principles](https://arxiv.org/abs/2603.15569)
- NVIDIA ADLR, [Nemotron-H: A Family of Accurate, Efficient Hybrid Mamba-Transformer Models](https://research.nvidia.com/labs/adlr/nemotronh/)
- Kimi Team, [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692)
- Hatamizadeh, Choi, and Kautz, [Gated DeltaNet-2: Decoupling Erase and Write in Linear Attention](https://arxiv.org/abs/2605.22791)
- AI21 Labs, [Jamba: A Hybrid Transformer-Mamba Language Model](https://arxiv.org/abs/2403.19887)
- AI21 Labs, [Jamba-1.5: Hybrid Transformer-Mamba Models at Scale](https://arxiv.org/abs/2408.12570)
- De et al., [Griffin: Mixing Gated Linear Recurrences with Local Attention for Efficient Language Models](https://arxiv.org/abs/2402.19427)
- Google, [RecurrentGemma: Moving Past Transformers for Efficient Open Language Models](https://arxiv.org/abs/2404.07839)
- Peng et al., [RWKV-7 “Goose” with Expressive Dynamic State Evolution](https://arxiv.org/abs/2503.14456)
- Beck et al., [xLSTM 7B: A Recurrent LLM for Fast and Efficient Inference](https://arxiv.org/abs/2503.13427)
- Liquid AI, [Introducing LFM2](https://www.liquid.ai/blog/liquid-foundation-models-v2-our-second-series-of-generative-ai-models)
- Liquid AI, [LFM2-24B-A2B: Scaling Up the LFM2 Architecture](https://www.liquid.ai/blog/lfm2-24b-a2b)
- Google Research, [Titans + MIRAS: Helping AI Have Long-Term Memory](https://research.google/blog/titans-miras-helping-ai-have-long-term-memory/)
- Google Research, [Introducing Nested Learning](https://research.google/blog/introducing-nested-learning-a-new-ml-paradigm-for-continual-learning/)
- Sun et al., [Learning to (Learn at Test Time): RNNs with Expressive Hidden States](https://arxiv.org/abs/2407.04620)
- Kosowski et al., [The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain](https://arxiv.org/abs/2509.26507)
- Engdahl et al., [BDH-CQ: In-Context Learning with Recurrent Latent Reasoning](https://arxiv.org/abs/2608.09888)
- Hao et al., [Training Large Language Models to Reason in a Continuous Latent Space](https://arxiv.org/abs/2412.06769)
- Poli et al., [Hyena Hierarchy: Towards Larger Convolutional Language Models](https://arxiv.org/abs/2302.10866)
- Sun et al., [Retentive Network: A Successor to Transformer for Large Language Models](https://arxiv.org/abs/2307.08621)
- [Sophontic AI interview on geometric reasoning](https://youtu.be/4S8I22ybG2c)
