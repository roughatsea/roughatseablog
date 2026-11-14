---
layout: ../../layouts/SeminalIdeasLayout.astro
title: Periods of 25 Variable Stars in the Small Magellanic Cloud
description: How can a star’s changing brightness become a measure of distance? Read Leavitt on repeated observations, a shared-distance assumption, logarithmic patterns, calibration, and the limits of a promising relation.
author: Henrietta Swan Leavitt
thinker: leavitt
discipline: Astronomy and scientific reasoning
year: 1912
updated: '2026-11-14'
---

*Edition, attribution, and scope: This lesson reads all three pages of Harvard College Observatory Circular 173, dated 3 March 1912, in the NASA Astrophysics Data System scan supplied by the John G. Wolbach Library. English original; no translation. The opening explicitly credits the statement to “Miss Leavitt”; Edward C. Pickering signs the circular on p. 3. The catalogue centers Leavitt’s investigation while preserving that publication arrangement, rather than silently replacing the signature. References use printed pp. 1–3, Table I, and Figures 1–2. We distinguish the circular’s photographic magnitude scale from modern absolute magnitude, its observational relation from a physical theory, and its proposals from later uses. Equations, numerical examples, methodological labels, and evaluations are editorial unless attributed.*

## Orientation

A faint point of light could be a weak source nearby or a powerful source far away. Its appearance alone does not tell you which. To estimate distance from brightness, you need some independent way to establish how much light the source actually gives out.

Henrietta Swan Leavitt found a promising clue in stars that repeatedly brighten and fade. In a group of 25 variables in the Small Magellanic Cloud, the brighter stars generally took longer to complete a cycle. If the stars were nearly the same distance from Earth, distance could not be the main reason for their differences in apparent brightness. Their timing was connected to their light output.

The 1912 circular presents the observations, displays the relation more clearly by changing the horizontal scale of a graph, and asks for further measurements. It does not yet give an independently calibrated distance to every star. That remaining task is part of the discovery’s meaning, not a footnote to remove from a triumphant story.

**The lasting question:** Which unknown can an observation constrain, and what additional measurement would turn that constraint into a usable scale?

**The essential limit:** This is evidence about a particular set of variable stars, not a law that all brighter stars vary more slowly. Later distance measurement depends on identifying appropriate stars, calibrating the relation, and accounting for observations that can mislead it.

## Core lesson

### Repeated observation and the period

**A variable star changes in observed brightness. A period is the time required for a repeating cycle. A light curve records brightness against time.** These definitions separate the observed change, its timing, and the record from which timing is inferred.

The circular opens with practical difficulties. The relevant fields cover a large area, stars are crowded, the variables are faint, and short periods can be hard to resolve with a limited set of photographs. Long exposures are needed to record faint objects. A photograph is therefore an observation made under conditions, not a transparent inventory of everything a star does. [P. 1.](https://articles.adsabs.harvard.edu/pdf/1912HarCi.173....1L)

Page 1 explains that the maximum and minimum brightnesses in Table I are read from light curves. Its columns also include a reference epoch and a period in days. An **epoch** here supplies a reference time for the cycle; it is not the length of the cycle. Harvard numbers identify objects, rather than ranking their quality or brightness.

Peggy Wargelin’s [Harvard Plate Stacks account](https://platestacks.cfa.harvard.edu/henrietta-swan-leavitt/variable-stars) describes comparing photographs from different dates and using reference stars to make brightness estimates comparable. That historical account helps explain the labor behind the compact table. Repeated measurement and adjustment for photographic conditions precede the plotted pattern.

**Editorial example:** Imagine observing a blinking lamp once each evening. Its brightness changes, but one observation per day may fail to distinguish a short cycle from several possible longer cycles. More observations help only if their timing separates those possibilities. This constructed example illustrates a sampling problem; it is not a reconstruction of Leavitt’s observing schedule.

The circular reports that 59 variables had been measured in 1904 on a provisional magnitude scale, and that periods had previously been published for 17. The new table contains 25 determined periods. It treats the additional eight as support for a relation that had earlier seemed insufficiently established. [Pp. 1–2.] These are different counts with different jobs: measured stars, stars with determined periods, and the larger catalogue are not interchangeable populations.

**Takeaway:** Before interpreting a pattern, ask what each row represents, how each quantity was obtained, and which objects could not supply it.

### Common distance as a working assumption

**Apparent brightness is the light we receive from a source. Intrinsic light output concerns what the source emits.** In modern astronomy, luminosity expresses emitted power; comparisons must also specify which wavelengths are being measured. A blue-sensitive photographic record and an infrared observation do not measure precisely the same part of a star’s light.

The central inference appears on p. 3. The variables are probably nearly the same distance from Earth, so their periods seem associated with their actual emission of light. The uncertainty words matter. The circular does not assert that the stars occupy an infinitely thin sheet or that their distances have already been measured individually.

Our reconstruction is:

1. The observed stars belong to a common distant system.
2. Treat their differences in distance as small enough for the intended comparison.
3. Their apparent brightnesses then provide a way to compare their emitted light without knowing the system’s absolute distance.
4. Observe that the brighter members generally have longer periods.
5. Infer a connection between period and intrinsic output, subject to the common-distance approximation and measurement limits.

The assumption removes a major source of ambiguity. It does not remove every source. Unequal dimming, overlapping star images, measurement error, or substantial depth along the line of sight could still affect the comparison. Those are methodological concerns raised by our reconstruction; the circular does not quantify them all.

**Editorial example:** Compare lamps placed along the same far wall. Their received light may help rank their power. Mix those lamps with others beside your chair, and apparent brightness ceases to provide the same comparison. Even at one wall, a shade over one lamp would introduce a different source of dimming.

The scientific importance lies partly in what becomes unnecessary. Leavitt does not need the absolute distance first to investigate the relative relation. She needs a defensible reason why distance differences within the group should not dominate it.

### Magnitudes and logarithmic structure

**Magnitude is astronomy’s numerical brightness scale: smaller magnitude numbers mean brighter sources.** Keep that direction in mind when reading the table. A change from 15 to 12 is a change toward greater brightness, not a decrease in light.

These three rows are transcribed from Table I on p. 2. They are examples from the complete 25-star table, not a new statistical fit.

| Harvard number | Maximum brightness, magnitude | Minimum brightness, magnitude | Period, days |
| --- | ---: | ---: | ---: |
| 1505 | 14.8 | 16.1 | 1.25336 |
| 818 | 13.6 | 14.7 | 10.336 |
| 821 | 11.2 | 12.1 | 127.0 |

The slower-changing star in the last row is brighter at both maximum and minimum than the faster-changing star in the first. Three rows illustrate the direction; the complete table and its scatter carry the evidential burden.

Figure 1 uses period in days along the horizontal axis and magnitude vertically. It draws separate sequences for maximum and minimum. Figure 2 replaces period with its logarithm. A **logarithmic scale** represents equal multiplication by equal steps: using base ten, periods of 1, 10, and 100 days have logarithms 0, 1, and 2. It makes ratios, rather than equal additions of days, visually comparable.

The circular says that a straight line can be drawn among each of the maximum and minimum sequences in Figure 2. It reports an increase of about 0.48 in the logarithm of period for each magnitude of increased brightness. This is an approximate historical description using the provisional scale, not a modern universal calibration. [P. 2; figures on p. 3.]

Notice what changes and what does not. The logarithm changes the representation of the measured period. It does not create a new set of stars, supply a missing observation, or prove that an exact line governs every case. It helps expose a simple candidate relation already constrained by the data.

**Editorial example:** Measurements at 1, 10, and 100 units crowd the first two values together on an axis running from 0 to 100. A logarithmic axis separates the two tenfold steps equally. That choice is useful when proportional change matters. It can mislead if the reader thinks equal spacing still means equal added units.

**Takeaway:** When a plot becomes persuasive, read the axes before accepting the explanation. Ask whether the transformation clarifies a relation and whether departures remain visible.

### Calibration before distance

**Calibration connects an observation or relation to an independently established scale.** Knowing that longer-period variables are brighter is a relation. Knowing how luminous an appropriate variable of a given period is requires an absolute reference for distance work.

Two calibrations must be kept apart. The circular discusses improving its provisional photographic magnitude scale, including reference to the North Polar Sequence. In that setting, its phrase “absolute scale of magnitudes” concerns a dependable photometric scale. We should not read every occurrence as the modern technical term **absolute magnitude**, a star’s magnitude standardized to a distance of ten parsecs, as defined in NASA/MSFC’s [magnitude teaching sheet](https://wwwastro.msfc.nasa.gov/solar/AIMS/activities/star_bright_student.html). A parsec is an astronomical unit of distance; no conversion is needed to follow the argument here.

Calibrating photographic brightness measurements does not by itself establish the stars’ physical distances. A well-measured apparent brightness remains apparent brightness. The paper separately hopes that parallaxes of brighter variables of similar type can be measured. **Parallax** is an apparent positional shift caused by viewing an object from different positions; with a known observing baseline, that shift can establish a geometric distance. [P. 1; p. 2, provisional-scale discussion; p. 3, proposed further study.]

The later distance method combines an appropriate calibrated period–luminosity relation with observed brightness. NASA’s [StarChild explanation](https://starchild.gsfc.nasa.gov/docs/StarChild/questions/cepheids.html) supplies the elementary distance reasoning. Under the simplifying conditions of light spreading freely from a source, received light falls with the square of distance. We can express that teaching model as `f = L / (4πd²)`: `f` is received power per area, `L` is emitted power, and `d` is distance. The model assumes isotropic emission, meaning the same output per direction, and no intervening attenuation.

**Editorial numerical example:** Two suitable stars have the same inferred intrinsic output. If one supplies one quarter as much received light, it is twice as far away in this idealized model. If dust removes light, or another unresolved star adds light, brightness alone gives a misleading distance unless the additional effect is addressed. This is our calculation, not a distance derived in Circular 173.

For different periods, one first uses the calibrated relation to account for different intrinsic output. A long-period Cepheid is not simply interchangeable with every short-period one. **A standard candle is a source whose intrinsic brightness can be estimated sufficiently well for distance work; it need not have the same brightness as every other member of its class.**

The distinction gives the result its proper scale. The circular establishes a promising way of comparing output and timing. It helps make a distance method possible without completing every step of that method within its three pages.

### Residuals and unfinished inquiry

**A residual is an observation’s departure from the value assigned by a fitted relation.** Table I includes residuals for maxima and minima against the lines of Figure 2. The stars are not presented as lying perfectly on an exact line.

The text suggests that deviations might become smaller with an improved magnitude scale, and might even indicate corrections needed for the provisional scale. It also notes an average maximum-to-minimum range of about 1.2 magnitudes. That range measures a star’s brightness variation during a cycle. It is not its period and not the scatter of all stars around the proposed relation. [Pp. 2–3.]

There is a methodological danger inside a reasonable suggestion. If departures from a proposed law are always assigned to the measuring system, the law can become protected from testing. Conversely, treating every departure as a refutation ignores genuine measurement limitations. The question is what independent evidence can distinguish a faulty scale, an incorrect period, a different kind of object, and real variation around an approximate relation.

**Editorial example:** A ruler consistently reads too long against an independent reference. Correcting it is justified by that reference. Adjusting each measurement merely until every point lies on a preferred line would instead assume the result the graph is supposed to test.

The circular ends with proposed work on spectra, parallaxes, light-curve forms, distribution, and a more systematic study of the variables. A **spectrum** separates light by wavelength and can disclose physical differences hidden in an undifferentiated brightness measurement. The request for further study keeps the finding open to refinement. [P. 3.]

**Takeaway:** A useful pattern tells us what to measure next. Its departures can be information, rather than untidiness to erase.

## Deep exploration

### What the three pages establish

The circular’s brevity can encourage retrospective overstatement. Separate the original result from what later readers know how to do with it.

| Claim or task | Standing in the 1912 circular |
| --- | --- |
| Measured periods and maximum/minimum magnitudes for 25 objects | Reported in Table I, with observations and provisional scale described. |
| Longer periods generally accompany greater brightness | Empirical pattern shown in the table and figures. |
| A near-linear relation after taking logarithms of period | Approximate description of both plotted sequences, with residuals retained. |
| Period is associated with intrinsic light output | Inference conditional on nearly common distance, stated on p. 3. |
| Independent geometric distances and an absolute luminosity scale | Further work is requested; the circular does not supply a completed distance calibration. |
| A physical explanation for pulsation and its relation to output | Suggested questions about stellar properties, not a demonstrated mechanism. |
| A measured expansion rate of the universe | Not a result of this paper. |

The table is an empirical contribution: particular observations support a relation. Our evaluation concerns the strength and limits of the inference, not a philosophical vote on whether nature should obey it. Later use provides a history of the result’s fruitfulness; later measurements supply additional evidence. Neither should be silently inserted into the original table.

### Why the shared-distance assumption needs scrutiny

The common-distance approximation is powerful because it holds one large influence approximately constant. It is not the same as experimentally controlling every variable.

Imagine a system with substantial depth. If longer-period stars happened to sit systematically nearer us, some of the period–brightness association could be caused by distance. If depth were unrelated to period, it could instead broaden the relation. These are constructed possibilities, not findings that the circular’s sample has either arrangement. They show why a common-group label is a reason to investigate comparability rather than a guarantee of it.

The stronger test asks how large the possible distance variation is compared with the observed brightness range, whether it is connected to period, and whether another group reproduces the relation. A sample can be informative before every uncertainty is quantified, provided the argument does not conceal the uncertainty.

Compare [Snow’s natural experiment](/seminal-ideas/on-the-mode-of-communication-of-cholera/#natural-experiment). His intermixed households help separate water supply from neighborhood. Leavitt’s common system helps separate output from distance. These are editorial comparisons of reasoning, not evidence of borrowing or equivalent study designs. In both, the work lies in explaining why a comparison reduces a specific ambiguity.

### Which stars enter the pattern?

The 25 objects have determined periods. They are not a random sample of all stars, all variable stars, or even all the variables named in the larger catalogue. The circular itself explains why faintness, crowding, and limited photographs complicate measurement. [P. 1.]

**Selection bias** occurs when which cases enter an analysis systematically distorts the relation being studied. For example, if a hypothetical survey can recognize a short-period star only when its variation is unusually conspicuous, its measured sample may misrepresent the broader population. That is an editorial warning about study design, not a newly measured bias in Table I.

Likewise, one should not treat the paper’s historical comparison with variables in globular clusters as a license to apply one relation indiscriminately to every pulsating star. Modern sources call the relevant distance indicators Cepheids. Correct identification is part of the distance method. A reliable relation for a defined class can coexist with very different behavior elsewhere.

The useful response to a small, selected sample is to specify scope and seek further observations. “Only 25” neither invalidates a clear pattern automatically nor establishes its unrestricted universality.

### Brightness measurements can imitate distance

The ideal distance calculation is easy; making its inputs trustworthy is harder. Crowding can blend neighboring star images. Unequal observational conditions can change recorded brightness. Intervening material can dim light. The primary circular emphasizes observational difficulty and provisional photometry; modern practice must distinguish additional effects from actual distance.

NASA/JPL-Caltech’s [2012 Spitzer account](https://science.nasa.gov/photojournal/cepheids-as-cosmology-tools/) describes observations of 10 Milky Way Cepheids and 80 in the Large Magellanic Cloud, using infrared measurements to reduce dust-related dimming and obtain a tighter relation. This is a later example of refining the measuring method. Its Large Magellanic Cloud sample must not be substituted for Leavitt’s Small Magellanic Cloud sample, nor its infrared measurements for the circular’s photographs.

The 1912 NASA account is evidence of a particular later application, not a current claim that the distance scale has no uncertainty. “Most precise yet” in an older announcement is a dated comparison, not a timeless record. This lesson makes no numerical claim about today’s expansion rate or any present disagreement over it.

An **error budget** is an account of the different sources of uncertainty contributing to a result. As an editorial exercise, separate period estimation, recorded brightness, distance calibration, and intervening dimming. More repeated observations of one component will not necessarily repair a shared error in another. A consistently misplaced zero point can move many inferred distances together.

### Discovery and credit in an institutional publication

Page 1 credits Leavitt’s preparation of the statement; p. 3 bears Pickering’s name. Both facts belong in a citation. Centering Leavitt’s scientific contribution does not require pretending the signed document has a different signature, and citing only the signature would conceal its explicit attribution of the work.

The [Harvard Plate Stacks biography](https://platestacks.cfa.harvard.edu/women-at-hco/henrietta-swan-leavitt) identifies her as an American astronomer, 1868–1921, and describes her work at Harvard College Observatory. That setting matters because the table depended on accumulated photographs, comparison standards, measurement, and record keeping. A three-page publication is an endpoint of organized work, not the entirety of its production.

The lesson does not infer private motives from the byline, invent conversations between Leavitt and Pickering, or treat scientific analysis as routine merely because it involved measuring photographs. A faithful account can recognize both an investigator’s contribution and the institutional form through which readers received it.

### From a relation to a distance ladder

A **distance ladder** joins methods with overlapping ranges so that one can help calibrate another. Geometric distance measurements can anchor a relation used for more distant sources; those sources can then help extend the chain. This is the later methodological significance of the result, rather than a completed ladder drawn in Circular 173.

The Harvard Plate Stacks history describes subsequent calibration and use of Cepheids in extending astronomical distances. William B. Ashworth Jr.’s [Linda Hall Library account](https://www.lindahall.org/about/news/scientist-of-the-day/henrietta-swan-leavitt/) likewise explains the need for calibration before applying the relation to distant systems and connects it to Hubble’s later work on Andromeda. These contextual sources document reception and application. The guide does not reduce those later achievements to one discovery or claim that Leavitt herself measured cosmic expansion in 1912.

The broader intellectual contribution is an observable quantity that constrains an otherwise inaccessible one. Timing helps estimate output; output compared with received light helps estimate distance. Each transition needs its own warrant. The simplicity of the final calculation is earned by the observations and assumptions preceding it.

### Connections to other entries

These are editorial comparisons, not claims of direct historical influence.

- [Lovelace on representation](/seminal-ideas/notes-on-the-analytical-engine/#representation-beyond-quantity) asks how numerical operations preserve a meaningful correspondence. Taking a logarithm can make a stellar relation easier to represent; interpreting the result still requires knowing what period and magnitude mean.
- [Poincaré on verification after conviction](/seminal-ideas/mathematical-creation/#verification-after-conviction) distinguishes an arresting idea from completed knowledge. The circular’s residuals and requests for further measurements keep a visually persuasive relation answerable to evidence.
- [Nightingale on observation before summaries](/seminal-ideas/notes-on-nursing/#observation-before-reassuring-summaries) asks which particulars support a report. Here, “brighter stars have longer periods” is meaningful only after identifying the stars, measurements, and conditions to which the summary applies.

### Common distortions

- **“Brightness tells us distance directly.”** A faint appearance can reflect output, distance, or other dimming; a calibrated estimate of intrinsic brightness is needed.
- **“All stars with long periods are brighter than all stars with short periods.”** The relation has a defined stellar scope and observational scatter.
- **“A standard candle always emits exactly the same amount of light.”** A predictable variation can make an object useful once calibrated.
- **“The logarithm straightened the data, so the law is proved.”** A transformation clarifies a proposed relation; residuals and rival explanations still require examination.
- **“Absolute scale means absolute stellar luminosity was already known.”** Photometric standardization and physical distance calibration are distinct tasks in this historical reading.
- **“Twenty-five means twenty-five isolated photographs.”** Each determined period depends on observations across time.
- **“The paper is only Pickering’s because he signed it.”** Its opening explicitly credits Leavitt. Conversely, preserving her contribution does not justify erasing the signature.
- **“The discovery immediately supplied the universe’s size and expansion rate.”** Calibration, observations of other systems, and later investigations were additional achievements.

### Test your understanding

1. Why does one measurement of brightness fail to determine a variable star’s period?
2. What ambiguity does the nearly common distance assumption reduce? What does it leave unresolved?
3. Which is brighter on the magnitude scale, 11.2 or 14.8? What changes when period becomes logarithm of period?
4. Why does a well-calibrated photographic brightness scale fail to supply a geometric distance by itself?
5. In the idealized equal-output example, what does receiving one quarter as much light imply? Why might dust defeat the inference?
6. What is the difference between the 1.2-magnitude average range and a residual from the plotted relation?
7. How could correcting the measuring scale become circular?
8. What should a citation preserve about Leavitt and Pickering?

<details>
<summary>Compare your reasoning</summary>

<p><strong>1.</strong> A period concerns recurrence. A single value supplies neither the duration nor the repeated pattern; even several poorly timed observations can leave competing periods possible.</p>
<p><strong>2.</strong> It reduces distance differences as an explanation of brightness differences within the group. It does not guarantee identical distances, eliminate measurement error or dimming, establish absolute luminosity, or explain the physical cause of variation.</p>
<p><strong>3.</strong> 11.2 is brighter. A logarithmic period axis places equal multiplicative changes at equal distances; the observed stars and their measured periods remain the same.</p>
<p><strong>4.</strong> It makes apparent brightness measurements dependable. To infer intrinsic output, one still needs distance information or an independently calibrated relation linking another property to output.</p>
<p><strong>5.</strong> Twice the distance, assuming equal intrinsic output, free propagation, and comparable measurements. Dust can reduce received light without increasing distance, so ignoring it can make a source seem too far away.</p>
<p><strong>6.</strong> The range compares maximum and minimum within a star’s cycle. A residual compares an observed magnitude with the relation’s assigned value at that star’s period.</p>
<p><strong>7.</strong> If the only reason for each correction is that it makes the preferred line exact, the relation supplies its own apparent confirmation. Independent standards or new observations help distinguish correction from forcing agreement.</p>
<p><strong>8.</strong> The circular explicitly says Leavitt prepared the statement and is signed by Pickering. Credit the investigation while identifying the document actually published.</p>

</details>

### If you read only a little

Read the [three-page scan](https://articles.adsabs.harvard.edu/pdf/1912HarCi.173....1L) in full, then retrace these points. Printed page numbers, table, and figure labels are the references used here.

1. **P. 1, opening and observational difficulties:** Notice the credit to Leavitt, the provisional magnitude scale, and the distinct counts of variables measured and periods determined.
2. **Pp. 1–2, Table I introduction and table:** Choose one star and trace its identifier, maximum, minimum, and period. Do not confuse epoch with period or smaller magnitude with fainter light.
3. **P. 2, explanation of the figures; p. 3, Figures 1–2:** State exactly what changes between the two horizontal axes. Find a departure from the straight-line approximation.
4. **P. 3, paragraph above the figures:** Identify the nearly common distance assumption and the inference about actual emission. Say why it is conditional.
5. **P. 3, closing paragraphs and signature:** List the further observations requested. Separate what the paper reports, what it infers, and what it hopes someone will measure next.

For the next attractive graph you encounter, write down the measured quantity, the transformation of its scale, the assumption that makes the comparison informative, and the independent reference needed to use it for prediction. A good line becomes more useful when those dependencies stay visible.

## Sources

**Primary work, read in full and visually checked:** Henrietta S. Leavitt’s statement, issued under Edward C. Pickering’s signature, “Periods of 25 Variable Stars in the Small Magellanic Cloud,” *Harvard College Observatory Circular* 173, 3 March 1912, pp. 1–3. [NASA ADS scan, supplied by the John G. Wolbach Library](https://articles.adsabs.harvard.edu/pdf/1912HarCi.173....1L). Table I and both figures were inspected in the scan, not reconstructed from a search summary. English original; no translator. This 1912 publication is public domain in the United States. Its preliminary observational scale and proposed further inquiries are preserved; a modern calibration is not substituted for its numbers.

**Historical method and subsequent application:** Peggy Wargelin, [“Variable Stars,” Harvard Plate Stacks](https://platestacks.cfa.harvard.edu/henrietta-swan-leavitt/variable-stars), 2018, sections on comparing plates and publication; and [the Plate Stacks Leavitt biography](https://platestacks.cfa.harvard.edu/women-at-hco/henrietta-swan-leavitt), for life dates and Harvard context. William B. Ashworth Jr., [“Henrietta Swan Leavitt,” Linda Hall Library](https://www.lindahall.org/about/news/scientist-of-the-day/henrietta-swan-leavitt/), for the distinction between the relation, calibration, and later Andromeda application. These are contextual accounts, not substitutes for the circular. We do not adopt every simplification or historical dating in them where the scanned circular supplies the relevant statement directly.

**Distance reasoning and a later observational example:** NASA/GSFC, [“Cepheids,” StarChild](https://starchild.gsfc.nasa.gov/docs/StarChild/questions/cepheids.html), for the elementary period–brightness and inverse-square distance method; NASA/JPL-Caltech, [“Cepheids as Cosmology Tools,” PIA15819](https://science.nasa.gov/photojournal/cepheids-as-cosmology-tools/), 3 October 2012, for the Spitzer samples and infrared refinement. These teaching sources support the limited explanations given here, not an assertion that all Cepheids have identical output or that a dated precision claim remains current.

**Magnitude terminology:** NASA/MSFC, [“Star Light, Star Bright,” student sheets](https://wwwastro.msfc.nasa.gov/solar/AIMS/activities/star_bright_student.html), background section, for the modern distinction between apparent magnitude and absolute magnitude at ten parsecs. This definition is not attributed to the historical circular.

**Editorial standing:** Definitions, reconstructed steps, hypothetical lamps and surveys, the equal-output distance calculation, objections, and cross-entry comparisons are editorial. Measurement, empirical inference, physical explanation, calibration, and historical influence remain separate claims requiring their own evidence.
