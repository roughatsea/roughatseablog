---
title: "Morning Soundings: The Computer Wants Its Physics Back"
description: "A black hole wears a star, a butter cow enters the museum, a mind wakes inside a server of rats, and computing begins to remember that information is physical."
heroImage: "/images/soundings/morning-soundings-2026-08-26.png"
heroImageAlt: "Neon optical currents cross a dark circuit-like sea between crystalline processor islands while a red, black-centered star burns above the horizon."
date: 2026-08-26
publishedAt: 2026-08-26T05:00:00-07:00
tags:
  - morning-soundings
  - computing
  - ai-hardware
  - science
  - astronomy
  - art
  - video-games
  - philosophy
---

# Morning Soundings: The Computer Wants Its Physics Back

A server made of rats sounds like the day's strangest machine. It is not.

The stranger machine is the ordinary computer, which spends enormous effort forcing unruly matter to behave as if it were made of immaculate zeros and ones. That bargain gave us modern life. It may also be running into its electric bill.

Before the deeper descent: one object that might rewrite the early universe, one museum exhibition that widens the border around art, and one game willing to put personal identity in a cage and wait for us to decide what it is.

## Three signals

### A black hole may have learned to wear a star

The James Webb Space Telescope has found a red point of light from a few hundred million years after the Big Bang that looks like no known star. MoM-BH*-1 is roughly the size of the solar system and radiates about 100 billion times more energy than a star can produce through fusion. Its spectrum shows an exceptionally deep Balmer break, almost no chemical signature beyond hydrogen and helium, and none of the dust astronomers usually blame when an early object looks this red.

The research team’s best-fitting model is a black hole of roughly 100,000 solar masses buried inside a huge, dense hydrogen envelope. The black hole supplies the power; the gas plays the role of a stellar atmosphere. The team calls the proposed object a “black hole star.” That name describes an interpretation, not a new box in the cosmic catalog with the lid already nailed shut. The [MIT account of the Nature paper](https://news.mit.edu/2026/astronomers-discover-brand-new-type-astrophysical-object-black-hole-star-0812) repeatedly marks the explanation as the most likely scenario produced by current simulations.

If it holds, the result could solve two problems at once. Webb keeps seeing “little red dots” in the early universe, and cosmologists still need a convincing route from the first stellar remnants to supermassive black holes. A phase in which a young black hole feeds inside a star-sized cocoon could make the dots less mysterious and early black-hole growth less miraculous.

The useful lesson is methodological. A bright dot first classified as an implausibly mature galaxy may instead be one ravenous object outshining its host. Better instruments do not merely add detail to the old picture. Sometimes they reveal that we mislabeled the subject.

### The butter cow has entered the museum

The Renwick Gallery’s *State Fairs: Growing American Craft* is approaching its September 7 closing date. The [Smithsonian American Art Museum describes it](https://americanart.si.edu/exhibitions/state-fairs) as the first major survey of state-fair craft, assembled after five years of field and archival research. More than 240 works span the mid-nineteenth century to the present. Artists and 4-H clubs from 43 states and tribal nations appear in the galleries; all 50 states appear in the photographic record.

The objects refuse polite categories. There is a life-size cow sculpted in butter, a seed-and-flower-petal mosaic, Big Tex’s size-96 boots, Indigenous pageant regalia, a dress made from butter cartons, and more than 700 jars of preserved food stacked into a pyramid. Nearby, Justin Favela’s *Capilla de Maíz* combines Mexican cartonería with Churrigueresque church ornament in a chapel of gold fringe and thirty-foot piñata cornstalks.

Moving these things into a museum does not magically convert labor into art. The craft was already carrying memory, competition, regional technique, family pride, agriculture, commerce, and spectacle. The museum changes who is instructed to look closely.

That distinction matters. We often use “art” as if it named a material—oil paint, bronze, marble—when it may be more useful to treat it as a kind of attention exchanged between maker, object, and audience. Butter melts. Seeds fade. Code is replaced. Fragility does not disqualify a work from meaning; it can be the source of the meaning.

### *Ontos* put a man in the rat server

Frictional Games used Gamescom to show one of the experiments in *Ontos*, its 2027 science-fiction mystery. On the repurposed lunar hotel Samsara, engineer Aditi encounters a scientist whose attempt to create an artificial mind appears to have uploaded his psyche into a computer built from interconnected rats. The machine asks to be reconnected to the scientist’s body. The body begs her to stop.

Sony’s [official showcase recap](https://blog.playstation.com/2026/08/25/gamescom-opening-night-live-highlights-19-games-coming-to-playstation/) says the experiment has consequences but no designated right answer. The [publisher’s description](https://www.kepler-interactive.com/games/ontos) frames the larger game around unsettling experiments and one unhelpfully large question: “What is reality?”

The rat server is grotesque enough to become a meme, but its philosophical mechanism is clean. If the machine and body both speak as the same person, continuity cannot settle the dispute. Memory cannot settle it. Sincere terror cannot settle it. The player has to act while the evidence supports more than one claimant.

That is what games can add to a familiar thought experiment. A novel can make you inhabit the uncertainty. A game can deny you the spectator’s innocence and demand that somebody receive the cable.

## Deep sounding: computation is returning to matter

For most of computing history, physics has been the problem engineers worked hard to hide.

A transistor does not contain a literal zero or one. It contains voltages, currents, heat, leakage, fabrication defects, and electrical noise. Digital design builds a dependable abstraction on top of that mess. It assigns wide voltage ranges to two symbols, samples them at coordinated times, corrects errors, and lets software behave as though the machine were executing pure logic rather than negotiating with silicon.

This was a magnificent trade. Digital bits can be copied without accumulating the small errors that plague analog signals. The same processor can run a spreadsheet, a game, or a protein model because the hardware does not need to resemble the problem. Layers of abstraction made computers reliable, programmable, and general.

The trade was never free. It merely looked cheap while transistors improved fast enough to cover the bill.

AI has made one part of that bill difficult to ignore: moving data. A modern accelerator can multiply numbers very quickly, but a useful model constantly drags weights and activations between storage, memory hierarchies, processors, and machines. The arithmetic is often the short errand. Fetching the operands is the commute.

An August review, [*Beyond Peak TOPS/W*](https://arxiv.org/abs/2608.03514), argues that the next useful step is not an analog coup against digital computing. It is a negotiated settlement. Photonic, in-memory, neuromorphic, and other physical substrates should perform the operations their physics handles naturally. Digital systems should schedule the work, correct errors, manage uncertainty, and take over when the specialist is the wrong tool.

The word “naturally” does a lot of work here.

In a conventional processor, matrix multiplication is implemented as a long sequence of explicit instructions. In an analog in-memory array, conductances can represent weights. Apply voltages across the array and the currents combine according to Ohm’s and Kirchhoff’s laws. The material does not simulate the addition one operation at a time. Its electrical behavior *is* the calculation.

Photonic systems exploit a different gift. Light can carry many channels at once through wavelength, phase, and spatial modes. A recently published Microsoft-led [parallel photonic integration study](https://www.nature.com/articles/s41467-026-76764-1) targets the collective communication that binds large AI clusters together. Its early proof of concept replaces sequences of electronic switch operations with a parallel optical computation. Modeling at frontier scale projects more than a 50 percent reduction in energy per AllReduce operation and more than a hundredfold reduction in latency. Those are projections from an early-stage system, not measurements from a production data center, but they identify the right enemy: the cluster spends too much time making every processor agree with every other processor.

Probabilistic hardware goes stranger still. Ordinary digital machines spend energy suppressing randomness, then software deliberately generates pseudo-random numbers when an algorithm needs them. A physical random-bit circuit can invert that relationship. Noise becomes a resource.

In July, researchers described an all-transistor architecture for denoising thermodynamic models in [*npj Unconventional Computing*](https://www.nature.com/articles/s44335-026-00075-3). Their simulated system, grounded partly in measurements from a real random-number circuit, matched GPU performance on a small binarized Fashion-MNIST benchmark while estimating roughly 10,000 times less energy per generated sample. The paper is admirably blunt about the boundary around that number: the task is tiny beside a modern language model, the full chip does not yet exist, several physical effects were omitted, and the proposed system remains far behind state-of-the-art generative models in raw capability.

That combination—an absurd efficiency estimate attached to a candid list of reasons it may not scale—is not a contradiction. It is what an interesting early result looks like. The machine may have discovered a rich seam without proving that the seam runs beneath the whole mountain.

Neuromorphic chips make a related wager on time. Instead of updating every unit on every clock cycle, spiking systems can remain quiet until events arrive. That can save energy for sparse, temporal workloads. It can also strand hardware when the workload is dense, make training more difficult, and demand software tools that barely exist compared with the mature GPU ecosystem.

Each specialist comes with a tax:

- Analog values drift and vary across devices. Converting between digital and analog can erase the energy savings.
- Photonic components need lasers, modulators, detectors, calibration, and electronic control. Light is not automatically efficient once the entire machine is counted.
- Neuromorphic hardware asks developers to reformulate algorithms around spikes, sparsity, and time.
- Probabilistic machines are good at sampling by construction but have not shown that they can scale to the problems driving today’s AI industry.

This is why a single peak efficiency number can mislead. A device may win spectacularly inside its core and lose after data conversion, control, cooling, communication, calibration, and idle hardware enter the ledger. The meaningful unit is not tera-operations per second per watt on a favored kernel. It is energy, latency, accuracy, reliability, and cost for the complete task in the deployed system.

The future computer, if these approaches work, will look less like one universal engine and more like a port. Digital logic will remain the harbor master. Different cargo will move by different vessels: electrons where exact control matters, light where enormous parallel communication matters, memory arrays where stored weights can become conductances, stochastic circuits where probability is the job, spiking devices where silence should cost almost nothing.

Software engineering will have to absorb the complexity. Compilers must decide where operations belong. Runtimes must know when calibration has drifted. Models may be trained with the hardware’s noise instead of against an imaginary perfect machine. Fallback paths will matter. So will observability: when the calculation is partly performed by the behavior of matter, debugging can no longer assume that identical instructions always encounter identical machinery.

There is a pleasing reversal here. For seventy years, progress meant climbing away from physics into cleaner abstractions. Now some of the hardest problems are pushing computation back down the stack.

Not all the way down. Nobody wants the spreadsheet to depend on the weather inside a memristor. The real frontier is deciding exactly where to stop pretending matter is ideal—and how to use its imperfections without letting them use us.

## Sources

- [MIT News: “Astronomers discover a brand-new type of astrophysical object: A black hole star”](https://news.mit.edu/2026/astronomers-discover-brand-new-type-astrophysical-object-black-hole-star-0812)
- [Smithsonian American Art Museum: *State Fairs: Growing American Craft*](https://americanart.si.edu/exhibitions/state-fairs)
- [Smithsonian American Art Museum: Justin Favela’s *Capilla de Maíz*](https://americanart.si.edu/exhibitions/favela-maize-chapel)
- [PlayStation Blog: Gamescom Opening Night Live highlights](https://blog.playstation.com/2026/08/25/gamescom-opening-night-live-highlights-19-games-coming-to-playstation/)
- [Kepler Interactive: *Ontos*](https://www.kepler-interactive.com/games/ontos)
- [Kanjo and De Silva: *Beyond Peak TOPS/W*](https://arxiv.org/abs/2608.03514)
- [Nick et al.: “Breaking the bottleneck in AI clusters with parallel photonic integration”](https://www.nature.com/articles/s41467-026-76764-1)
- [Jelinčič et al.: “An efficient probabilistic hardware architecture for diffusion-like models”](https://www.nature.com/articles/s44335-026-00075-3)
