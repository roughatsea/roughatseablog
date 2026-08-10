---
title: "Physics: The Extreme Basics"
description: "A from-zero introduction to the basic ideas of physics: measurement, motion, forces, energy, momentum, waves, fields, relativity, and quantum mechanics."
date: 2026-08-10
tags:
  - physics
  - science
  - beginners
---

# Physics: The Extreme Basics

Physics is the study of how the physical universe behaves.

That sounds enormous because it is. Physics tries to describe things as ordinary as a ball rolling across a floor and things as extreme as black holes, atoms, light, and the beginning of the universe.

But the basic strategy is surprisingly simple:

1. Identify things that can be measured.
2. Look for patterns in how those measurements change.
3. Express those patterns as mathematical relationships.
4. Test whether those relationships correctly predict what happens next.

This article starts at the beginning and assumes very little prior physics knowledge.

## Physics begins with quantities

A **physical quantity** is something about the world that can be measured.

Examples include:

- distance
- time
- mass
- temperature
- speed
- electric charge
- energy

A number by itself is usually not enough.

If someone says a table is "2 long," that does not tell us much. Two what?

We need a **unit**.

For example:

- 2 meters
- 2 feet
- 2 centimeters

Physics uses a standard system of units called the **International System of Units**, usually abbreviated **SI**.

Some important SI units are:

| Quantity | SI unit | Symbol |
| --- | --- | --- |
| Length | meter | m |
| Time | second | s |
| Mass | kilogram | kg |
| Temperature | kelvin | K |
| Electric current | ampere | A |

Many other units are built from these.

For example, speed is measured in meters per second:

```latex
\mathrm{m/s}
```

## Position: where is something?

One of the simplest questions physics can ask is:

> Where is the object?

Suppose we draw a straight number line and place an object somewhere on it.

We can describe its **position** with a variable such as $x$.

If the object is 5 meters to the right of our chosen origin, we might write:

```latex
x = 5\ \mathrm{m}
```

The **origin** is simply the location we have chosen to call zero.

There is nothing physically magical about the origin. It is a reference point.

## Distance and displacement are not quite the same thing

**Distance** tells us how much ground an object traveled.

**Displacement** tells us how much its position changed.

Suppose you walk 10 meters east and then 10 meters west.

Your total distance traveled is 20 meters.

But you end where you started, so your displacement is zero.

If initial position is $x_i$ and final position is $x_f$, displacement can be written as:

```latex
\Delta x = x_f - x_i
```

The Greek letter delta, $\Delta$, is commonly used in physics to mean **change in**.

So $\Delta x$ simply means "change in position."

## Speed and velocity

**Speed** describes how quickly distance is being covered.

The basic relationship is:

```latex
\text{speed} = \frac{\text{distance}}{\text{time}}
```

If a car travels 100 meters in 5 seconds, its average speed is:

```latex
\text{speed} = \frac{100\ \mathrm{m}}{5\ \mathrm{s}} = 20\ \mathrm{m/s}
```

**Velocity** is closely related to speed, but velocity includes direction.

A car traveling 20 m/s east and a car traveling 20 m/s west have the same speed but different velocities.

Average velocity can be written:

```latex
v = \frac{\Delta x}{\Delta t}
```

where:

- $v$ is velocity
- $\Delta x$ is change in position
- $\Delta t$ is change in time

## Acceleration: changing velocity

An object **accelerates** whenever its velocity changes.

That can mean:

- speeding up
- slowing down
- changing direction

Average acceleration is:

```latex
a = \frac{\Delta v}{\Delta t}
```

The SI unit of acceleration is meters per second per second, usually written:

```latex
\mathrm{m/s^2}
```

An acceleration of $2\ \mathrm{m/s^2}$ means the velocity changes by 2 meters per second every second.

## Newton's first law: motion does not require a continuing push

Everyday experience can make it seem as though objects naturally want to stop moving.

Push a book across a table and it eventually stops.

But the book stops because forces such as **friction** act on it.

If no net force acted on an object, it would continue moving at constant velocity.

This is the core idea of **Newton's first law of motion**.

An object at rest tends to remain at rest, and an object moving at constant velocity tends to continue moving at constant velocity, unless a net external force acts on it.

This resistance to changes in motion is called **inertia**.

## Mass

**Mass** is a measure of how much inertia an object has.

An object with more mass is harder to accelerate than an object with less mass, assuming the same force is applied.

Mass is measured in kilograms.

Mass is not exactly the same thing as weight.

Mass is an intrinsic property of an object.

**Weight** is a force caused by gravity.

Your mass would be essentially the same on Earth and on the Moon, but your weight would be much smaller on the Moon because the Moon's gravitational field is weaker.

## Force

A **force** is an interaction that can change an object's motion.

Examples include:

- gravity
- friction
- the push from your hand
- tension in a rope
- electromagnetic forces

Force is measured in **newtons**, abbreviated N.

One newton is defined as the force required to accelerate a 1-kilogram mass at 1 meter per second squared.

That definition comes from one of the most famous equations in physics.

## Newton's second law

Newton's second law is commonly written:

```latex
F = ma
```

where:

- $F$ is net force
- $m$ is mass
- $a$ is acceleration

This equation says that acceleration depends on two things:

1. how much net force is applied
2. how much mass the object has

If the same force is applied to two objects, the less massive object accelerates more.

For example, suppose a net force of 10 N acts on a 2 kg object.

```latex
a = \frac{F}{m}
```

so:

```latex
a = \frac{10\ \mathrm{N}}{2\ \mathrm{kg}} = 5\ \mathrm{m/s^2}
```

## Net force

Usually more than one force acts on an object at once.

The **net force** is the combined effect of all of them.

Suppose two people push a box in opposite directions.

One pushes right with 10 N and the other pushes left with 7 N.

The net force is 3 N to the right.

If equal forces act in opposite directions, the net force is zero.

Zero net force does **not** necessarily mean the object is stationary.

It means the object's velocity is not changing.

It could therefore be sitting still or moving at constant velocity.

## Newton's third law

Newton's third law says that forces come in pairs.

If object A exerts a force on object B, then object B exerts an equal-magnitude force in the opposite direction on object A.

This is often summarized as:

> For every action there is an equal and opposite reaction.

The forces act on different objects, which is important.

When you stand on the floor, gravity pulls you downward, but you also push downward on the floor. The floor pushes upward on you.

## Gravity

Gravity is an interaction between objects that have mass-energy.

Near Earth's surface, falling objects accelerate downward at approximately:

```latex
g \approx 9.8\ \mathrm{m/s^2}
```

Ignoring air resistance, a heavy object and a light object fall with the same gravitational acceleration.

Newton described gravitational attraction between two masses with:

```latex
F = G\frac{m_1m_2}{r^2}
```

where:

- $F$ is gravitational force
- $m_1$ and $m_2$ are the two masses
- $r$ is the distance between their centers
- $G$ is the gravitational constant

The $r^2$ in the denominator means gravity gets weaker rapidly as distance increases.

Double the distance and the force becomes one quarter as large.

## Energy

**Energy** is one of the most important and abstract ideas in physics.

A useful beginner definition is:

> Energy is a quantity that keeps track of a system's capacity to produce physical change.

Energy appears in many forms, including:

- kinetic energy
- gravitational potential energy
- chemical energy
- thermal energy
- electromagnetic energy
- nuclear energy

Energy is measured in **joules**, abbreviated J.

## Kinetic energy

An object has **kinetic energy** because it is moving.

For an ordinary object moving much slower than light, kinetic energy is:

```latex
K = \frac{1}{2}mv^2
```

where:

- $K$ is kinetic energy
- $m$ is mass
- $v$ is speed

Notice the square on velocity.

If speed doubles, kinetic energy increases by a factor of four.

That is one reason high-speed collisions become dramatically more energetic.

## Potential energy

**Potential energy** is energy associated with configuration or position.

Near Earth's surface, gravitational potential energy can be approximated by:

```latex
U = mgh
```

where:

- $U$ is gravitational potential energy
- $m$ is mass
- $g$ is gravitational acceleration
- $h$ is height relative to a chosen reference level

Raise an object and you increase its gravitational potential energy.

Drop it and that potential energy can become kinetic energy.

## Conservation of energy

One of the deepest ideas in physics is that energy is **conserved**.

Energy can move between objects and change forms, but in a closed system the total amount of energy remains constant.

For a simple falling object with no air resistance:

```latex
K + U = \text{constant}
```

As the object falls, gravitational potential energy decreases while kinetic energy increases.

Energy has not vanished. It has changed form.

## Work

In physics, **work** has a more precise meaning than it does in everyday speech.

A force does work when it causes displacement.

For a constant force acting in the same direction as motion:

```latex
W = Fd
```

where:

- $W$ is work
- $F$ is force
- $d$ is displacement

More generally:

```latex
W = Fd\cos\theta
```

where $\theta$ is the angle between the force and the displacement.

Work transfers energy.

## Power

**Power** tells us how quickly energy is transferred or work is done.

```latex
P = \frac{W}{t}
```

Power is measured in **watts**, abbreviated W.

One watt equals one joule per second.

Two machines may perform the same amount of work, but the one that does it faster produces more power.

## Momentum

Another conserved quantity in physics is **momentum**.

For an ordinary object moving much slower than light:

```latex
p = mv
```

where:

- $p$ is momentum
- $m$ is mass
- $v$ is velocity

Momentum has direction because velocity has direction.

In an isolated system, total momentum is conserved.

That principle is extremely useful for analyzing collisions.

For two objects colliding:

```latex
p_{\text{before}} = p_{\text{after}}
```

assuming no important external forces act on the system.

## Scalars and vectors

Some physical quantities have only a magnitude.

These are called **scalars**.

Examples include:

- mass
- temperature
- energy
- speed

Other quantities have both magnitude and direction.

These are called **vectors**.

Examples include:

- displacement
- velocity
- acceleration
- force
- momentum

Direction matters enormously when vectors are combined.

Ten newtons east plus ten newtons west gives zero net force, not twenty newtons.

## Waves

A **wave** is a pattern or disturbance that propagates through space or through a medium.

Examples include:

- sound waves
- water waves
- light
- radio waves

Important wave quantities include **wavelength**, **frequency**, and **speed**.

**Wavelength**, usually represented by the Greek letter lambda $\lambda$, is the spatial length of one complete cycle.

**Frequency**, usually represented by $f$, tells us how many cycles occur per second.

Frequency is measured in **hertz**, abbreviated Hz.

One hertz means one cycle per second.

For a wave:

```latex
v = f\lambda
```

where:

- $v$ is wave speed
- $f$ is frequency
- $\lambda$ is wavelength

## Sound

Sound is a mechanical wave produced by vibrations traveling through matter.

Sound therefore needs a medium such as air, water, or solid material.

There is no ordinary sound in a perfect vacuum because there is no material there to carry the pressure disturbance.

Pitch is strongly related to frequency.

Higher frequency generally means higher pitch.

## Light

Light is an electromagnetic phenomenon.

Visible light is only a small part of the **electromagnetic spectrum**.

The electromagnetic spectrum also includes:

- radio waves
- microwaves
- infrared
- ultraviolet
- X-rays
- gamma rays

In vacuum, all electromagnetic waves travel at the speed of light:

```latex
c \approx 3.00 \times 10^8\ \mathrm{m/s}
```

That is about 300,000 kilometers per second.

## Fields

Modern physics often describes interactions using **fields**.

A field assigns some physical quantity to every point in space and time.

For example, a gravitational field tells us what gravitational acceleration an object would experience at different locations.

An electric field tells us what electric force a charged object would experience.

A useful way to think about a field is as an invisible map spread throughout space.

At every point, the map tells you something about what would happen to an appropriate object placed there.

## Electric charge

Matter can carry **electric charge**.

There are two signs of electric charge:

- positive
- negative

Like charges repel each other.

Opposite charges attract each other.

The electric force between two point charges is described by Coulomb's law:

```latex
F = k\frac{|q_1q_2|}{r^2}
```

where:

- $q_1$ and $q_2$ are electric charges
- $r$ is their separation
- $k$ is Coulomb's constant

Notice how similar this looks to Newton's law of gravity.

Both are inverse-square laws.

## Atoms

Ordinary matter is made of atoms.

An atom contains a tiny central **nucleus** surrounded by electrons.

The nucleus contains:

- protons, which have positive electric charge
- neutrons, which have no net electric charge

Electrons carry negative electric charge.

Almost all of an atom's mass is concentrated in the nucleus, while most of the atom's volume is associated with the region occupied by its electrons.

## Temperature and heat

**Temperature** and **heat** are related but different ideas.

Temperature is connected to the statistical behavior of the microscopic particles making up a system.

**Heat** refers to energy transferred because of a temperature difference.

If a hot object touches a colder object, energy generally flows from the hotter object to the colder object until they approach thermal equilibrium.

## Entropy

**Entropy** is one of the most commonly misunderstood quantities in physics.

It is sometimes loosely called "disorder," but that description can be misleading.

A more useful beginner idea is that entropy measures, in a statistical sense, how many microscopic arrangements are compatible with the macroscopic state we observe.

The **second law of thermodynamics** says that the entropy of an isolated system tends not to decrease.

This helps explain why many physical processes have a preferred direction in time.

A broken glass can easily scatter across a floor, but the pieces do not spontaneously leap together and reconstruct the glass.

## Relativity

Newtonian physics works extremely well for ordinary objects moving at ordinary speeds.

But when velocities become comparable to the speed of light, we need **special relativity**.

Einstein's special theory of relativity begins with two central ideas:

1. The laws of physics have the same form for all inertial observers.
2. The speed of light in vacuum is the same for all inertial observers.

These assumptions lead to surprising results.

Moving clocks can run more slowly relative to other observers, lengths can contract along the direction of motion, and simultaneity depends on the observer's state of motion.

One famous relationship from relativity is:

```latex
E = mc^2
```

This says that mass contributes to the energy of a system.

A more complete energy-momentum relationship is:

```latex
E^2 = (pc)^2 + (mc^2)^2
```

## General relativity

Einstein later developed **general relativity**, our modern classical theory of gravity.

In general relativity, gravity is not treated simply as an invisible pulling force between masses.

Matter and energy affect the geometry of spacetime, and objects move through that curved spacetime.

A common summary is:

> Matter tells spacetime how to curve, and curved spacetime tells matter how to move.

This theory describes phenomena including planetary orbits, gravitational lensing, black holes, and gravitational waves.

## Quantum mechanics

At atomic and subatomic scales, classical physics is not enough.

We need **quantum mechanics**.

Quantum mechanics does not simply say that tiny objects behave like miniature billiard balls.

Instead, physical systems are described by mathematical objects called **quantum states**.

The theory predicts probabilities for the results of measurements.

One of its central mathematical objects is the **wavefunction**, often represented by the Greek letter psi, $\psi$.

The probability density for finding a particle in a particular region is related to:

```latex
|\psi|^2
```

Quantum mechanics also tells us that quantities such as energy can sometimes come in discrete allowed amounts rather than varying continuously.

That is where the word **quantum** comes from.

## Photons

Light behaves in ways that can be described using particles called **photons**.

The energy of a photon is related to its frequency:

```latex
E = hf
```

where:

- $E$ is photon energy
- $h$ is Planck's constant
- $f$ is frequency

Higher-frequency light therefore consists of photons with greater energy.

## The uncertainty principle

Quantum mechanics contains a fundamental limit on how sharply certain pairs of quantities can simultaneously be defined.

For position and momentum, the Heisenberg uncertainty relation is commonly written:

```latex
\Delta x\,\Delta p \geq \frac{\hbar}{2}
```

This is not merely a statement that our instruments are imperfect.

It is built into the structure of quantum mechanics itself.

## The four fundamental interactions

As far as current physics knows, the basic interactions of nature can be grouped into four categories:

1. **Gravity** — dominates the behavior of planets, stars, galaxies, and other large-scale systems.
2. **Electromagnetism** — responsible for electricity, magnetism, light, chemistry, and much of ordinary contact between objects.
3. **Strong interaction** — binds quarks together and is ultimately responsible for holding atomic nuclei together.
4. **Weak interaction** — involved in processes such as radioactive beta decay and important reactions inside stars.

Much of physics is the attempt to understand matter and these interactions at increasingly fundamental levels.

## Conservation laws

Several quantities appear again and again because they obey powerful conservation laws.

Depending on the physical system, important conserved quantities include:

- energy
- momentum
- angular momentum
- electric charge

Conservation laws are among the most useful tools in all of physics because they let us constrain what can happen without calculating every microscopic detail.

## Physics is built from models

A **model** is a simplified mathematical representation of some part of reality.

Models are not necessarily intended to include everything.

For example, introductory physics might describe a thrown baseball while ignoring:

- air resistance
- wind
- the rotation of Earth
- microscopic deformation of the ball
- gravitational effects from the Moon

Those effects are real, but they may be too small to matter for the question being asked.

A good model includes enough detail to make useful predictions without including irrelevant complexity.

## Equations are compressed statements about relationships

Physics equations can look intimidating because they compress a lot of meaning into very little space.

Consider:

```latex
F = ma
```

It is not merely a calculation recipe.

It expresses a relationship between force, mass, and acceleration.

Likewise:

```latex
E = hf
```

expresses a relationship between the energy of a photon and the frequency of light.

Learning physics therefore involves more than memorizing formulas. The important skill is learning what each quantity means and what relationship the equation is describing.

## Units can help catch mistakes

Units behave algebraically and can reveal errors.

Suppose velocity is calculated using:

```latex
v = \frac{d}{t}
```

Distance has units of meters and time has units of seconds, so the result must have units:

```latex
\frac{\mathrm{m}}{\mathrm{s}}
```

If your calculation somehow produced kilograms, something has gone wrong.

This process is called **dimensional analysis**.

It is one of the simplest and most useful error-checking tools in physics.

## What physics is ultimately trying to do

At its deepest level, physics is trying to discover a compact set of principles from which the enormous variety of physical phenomena can be understood.

A falling apple, an orbiting planet, an electrical circuit, a laser, a nuclear reaction, and a black hole may look like completely unrelated phenomena.

Physics repeatedly discovers that apparently different things are manifestations of the same underlying rules.

That is one of the central pleasures of the subject.

The goal is not merely to accumulate facts about the universe.

It is to discover the patterns underneath them.

## A compact mental model

If you remember only a handful of ideas from this introduction, remember these:

- **Position** tells you where something is.
- **Velocity** tells you how position is changing.
- **Acceleration** tells you how velocity is changing.
- **Force** changes motion.
- **Mass** measures inertia.
- **Energy** tracks the capacity for physical change and is conserved.
- **Momentum** describes motion in another conserved way.
- **Fields** describe how interactions are distributed through space.
- **Waves** carry disturbances and energy.
- **Relativity** changes our understanding of space, time, energy, and gravity.
- **Quantum mechanics** governs the microscopic world.
- **Conservation laws** place powerful restrictions on what nature can do.

Everything beyond this is, in one sense, elaboration.

The mathematics becomes much richer and the phenomena become much stranger, but these basic ideas form a large part of the conceptual foundation.