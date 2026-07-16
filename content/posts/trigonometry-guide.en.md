---
title: "Math Basics: A Complete Guide to Trigonometry"
meta_title: "Trigonometry Guide - From Definition to Application"
description: "Systematically review the basic definitions, formulas, graphs, and inverse trigonometric functions. Mathematical foundation for Three.js 3D development."
date: 2026-07-05T10:00:00+08:00
image: "/images/2026-07-05_trigonometry/all_functions_graph.png"
categories: ["Math", "3D Basics"]
author: "Feynman"
tags: ["math", "trigonometry", "3d-basics", "threejs"]
draft: false
---

> Trigonometric functions are the core tool for describing periodic phenomena and the mathematical foundation for 3D graphics. This article starts from right triangles and systematically reviews the definitions, formulas, graphs, and inverse trigonometric functions.

## 01 Basic Definitions

### Right Triangle Definition

In a right triangle, let angle $\theta$ be an acute angle:

- **Sine** (sin): $\sin\theta = \frac{\text{opposite}}{\text{hypotenuse}}$
- **Cosine** (cos): $\cos\theta = \frac{\text{adjacent}}{\text{hypotenuse}}$
- **Tangent** (tan): $\tan\theta = \frac{\text{opposite}}{\text{adjacent}} = \frac{\sin\theta}{\cos\theta}$

### Opposite, Adjacent, Hypotenuse Computation Formulas

Given a trigonometric function value and one side, the other sides can be found:

| Given | Opposite | Adjacent | Hypotenuse |
|---------|------|------|------|
| Hypotenuse $c$ | $a = c \cdot \sin\theta$ | $b = c \cdot \cos\theta$ | — |
| Adjacent $b$ | $a = b \cdot \tan\theta$ | — | $c = \frac{b}{\cos\theta}$ |
| Opposite $a$ | — | $b = \frac{a}{\tan\theta}$ | $c = \frac{a}{\sin\theta}$ |

**Pythagorean Theorem**: $a^2 + b^2 = c^2$ (opposite² + adjacent² = hypotenuse²)

### Unit Circle Definition

In the Cartesian coordinate system, a circle centered at the origin with radius 1 is called the unit circle. The terminal side of angle $\theta$ intersects the unit circle at point $(x, y)$, then:

- $\sin\theta = y$
- $\cos\theta = x$
- $\tan\theta = \frac{y}{x}$ (when $x \neq 0$)

---

## 02 Fundamental Identities

### Reciprocal Identities

- $\csc\theta = \frac{1}{\sin\theta}$
- $\sec\theta = \frac{1}{\cos\theta}$
- $\cot\theta = \frac{1}{\tan\theta} = \frac{\cos\theta}{\sin\theta}$

### Pythagorean Identities

- $\sin^2\theta + \cos^2\theta = 1$
- $1 + \tan^2\theta = \sec^2\theta$
- $1 + \cot^2\theta = \csc^2\theta$

### Sum and Difference Formulas

- $\sin(\alpha \pm \beta) = \sin\alpha\cos\beta \pm \cos\alpha\sin\beta$
- $\cos(\alpha \pm \beta) = \cos\alpha\cos\beta \mp \sin\alpha\sin\beta$
- $\tan(\alpha \pm \beta) = \frac{\tan\alpha \pm \tan\beta}{1 \mp \tan\alpha\tan\beta}$

### Double Angle Formulas

- $\sin 2\theta = 2\sin\theta\cos\theta$
- $\cos 2\theta = \cos^2\theta - \sin^2\theta = 2\cos^2\theta - 1 = 1 - 2\sin^2\theta$
- $\tan 2\theta = \frac{2\tan\theta}{1 - \tan^2\theta}$

### Half Angle Formulas

- $\sin\frac{\theta}{2} = \pm\sqrt{\frac{1 - \cos\theta}{2}}$
- $\cos\frac{\theta}{2} = \pm\sqrt{\frac{1 + \cos\theta}{2}}$
- $\tan\frac{\theta}{2} = \frac{\sin\theta}{1 + \cos\theta} = \frac{1 - \cos\theta}{\sin\theta}$

---

## 03 Trigonometric Values for Common Angles

| Angle $\theta$ | Radians | $\sin\theta$ | $\cos\theta$ | $\tan\theta$ |
|:---:|:---:|:---:|:---:|:---:|
| 0° | 0 | 0 | 1 | 0 |
| 30° | $\frac{\pi}{6}$ | $\frac{1}{2}$ | $\frac{\sqrt{3}}{2}$ | $\frac{\sqrt{3}}{3}$ |
| 45° | $\frac{\pi}{4}$ | $\frac{\sqrt{2}}{2}$ | $\frac{\sqrt{2}}{2}$ | 1 |
| 60° | $\frac{\pi}{3}$ | $\frac{\sqrt{3}}{2}$ | $\frac{1}{2}$ | $\sqrt{3}$ |
| 90° | $\frac{\pi}{2}$ | 1 | 0 | undefined |
| 120° | $\frac{2\pi}{3}$ | $\frac{\sqrt{3}}{2}$ | $-\frac{1}{2}$ | $-\sqrt{3}$ |
| 135° | $\frac{3\pi}{4}$ | $\frac{\sqrt{2}}{2}$ | $-\frac{\sqrt{2}}{2}$ | $-1$ |
| 150° | $\frac{5\pi}{6}$ | $\frac{1}{2}$ | $-\frac{\sqrt{3}}{2}$ | $-\frac{\sqrt{3}}{3}$ |
| 180° | $\pi$ | 0 | $-1$ | 0 |
| 270° | $\frac{3\pi}{2}$ | $-1$ | 0 | undefined |
| 360° | $2\pi$ | 0 | 1 | 0 |

> **Memory tip**: For 30°, 45°, 60°, the sin values are $\frac{\sqrt{1}}{2}$, $\frac{\sqrt{2}}{2}$, $\frac{\sqrt{3}}{2}$ (increasing numerator); cos values are the reverse (decreasing numerator).

---

## 04 Trigonometric Function Graphs

### Comparison of All Three Functions

![Trigonometric function comparison](/images/2026-07-05_trigonometry/all_functions_graph.png)

### Sine Function $y = \sin x$

![Sine function graph](/images/2026-07-05_trigonometry/sin_graph.png)

- Period: $2\pi$
- Range: $[-1, 1]$
- Odd function: $\sin(-x) = -\sin x$

### Cosine Function $y = \cos x$

![Cosine function graph](/images/2026-07-05_trigonometry/cos_graph.png)

- Period: $2\pi$
- Range: $[-1, 1]$
- Even function: $\cos(-x) = \cos x$

### Tangent Function $y = \tan x$

![Tangent function graph](/images/2026-07-05_trigonometry/tan_graph.png)

- Period: $\pi$
- Range: $(-\infty, +\infty)$
- Odd function: $\tan(-x) = -\tan x$
- Asymptotes: $x = \frac{\pi}{2} + k\pi$ ($k$ is an integer)

---

## 05 Inverse Trigonometric Functions

### What Are Inverse Trigonometric Functions

**In simple terms**: Inverse trigonometric functions are the "reverse operation" of trigonometric functions.

- **Trigonometric functions**: Given an angle → find the function value
  - Example: $\sin 30° = 0.5$ (input angle, output value)
- **Inverse trigonometric functions**: Given a function value → find the angle
  - Example: $\arcsin(0.5) = 30°$ (input value, output angle)

### The Three Inverse Trigonometric Functions

| Inverse Function | Symbol | Meaning | Domain | Range |
|:---:|:---:|:---:|:---:|:---:|
| Arcsine | $\arcsin x$ | Find angle from $\sin$ value | $[-1, 1]$ | $[-\frac{\pi}{2}, \frac{\pi}{2}]$ |
| Arccosine | $\arccos x$ | Find angle from $\cos$ value | $[-1, 1]$ | $[0, \pi]$ |
| Arctangent | $\arctan x$ | Find angle from $\tan$ value | $(-\infty, +\infty)$ | $(-\frac{\pi}{2}, \frac{\pi}{2})$ |

> **Why is the range restricted?** Because trigonometric functions are periodic — a single function value corresponds to infinitely many angles. To make the inverse function uniquely determined, we restrict it to the "principal value interval."

### Calculation Examples

**Example 1**: Find the value of $\arcsin(0.5)$
- Thought process: Which angle has a $\sin$ value equal to 0.5?
- Answer: $\arcsin(0.5) = 30° = \frac{\pi}{6}$

**Example 2**: Find the value of $\arccos(0)$
- Thought process: Which angle has a $\cos$ value equal to 0?
- Answer: $\arccos(0) = 90° = \frac{\pi}{2}$

**Example 3**: Find the value of $\arctan(1)$
- Thought process: Which angle has a $\tan$ value equal to 1?
- Answer: $\arctan(1) = 45° = \frac{\pi}{4}$

### Common Inverse Trigonometric Values

| $x$ | $\arcsin x$ | $\arccos x$ | $\arctan x$ |
|:---:|:---:|:---:|:---:|
| $0$ | $0$ | $\frac{\pi}{2}$ | $0$ |
| $\frac{1}{2}$ | $\frac{\pi}{6}$ (30°) | $\frac{\pi}{3}$ (60°) | — |
| $\frac{\sqrt{2}}{2}$ | $\frac{\pi}{4}$ (45°) | $\frac{\pi}{4}$ (45°) | — |
| $\frac{\sqrt{3}}{2}$ | $\frac{\pi}{3}$ (60°) | $\frac{\pi}{6}$ (30°) | — |
| $1$ | $\frac{\pi}{2}$ (90°) | $0$ | $\frac{\pi}{4}$ (45°) |
| $\sqrt{3}$ | — | — | $\frac{\pi}{3}$ (60°) |
| $-1$ | $-\frac{\pi}{2}$ (-90°) | $\pi$ (180°) | $-\frac{\pi}{4}$ (-45°) |

### Inverse Trigonometric Function Graphs

#### Arcsine Function $y = \arcsin(x)$

![Arcsine function graph](/images/2026-07-05_trigonometry/arcsin_graph.png)

- Domain: $[-1, 1]$
- Range: $[-\frac{\pi}{2}, \frac{\pi}{2}]$
- Strictly increasing
- Odd function: $\arcsin(-x) = -\arcsin(x)$

#### Arccosine Function $y = \arccos(x)$

![Arccosine function graph](/images/2026-07-05_trigonometry/arccos_graph.png)

- Domain: $[-1, 1]$
- Range: $[0, \pi]$
- Strictly decreasing
- Neither odd nor even

#### Arctangent Function $y = \arctan(x)$

![Arctangent function graph](/images/2026-07-05_trigonometry/arctan_graph.png)

- Domain: $(-\infty, +\infty)$
- Range: $(-\frac{\pi}{2}, \frac{\pi}{2})$
- Strictly increasing
- Odd function: $\arctan(-x) = -\arctan(x)$
- Asymptotes: $y = \pm\frac{\pi}{2}$

### Fundamental Relations

#### Complementary Relations

- $\arcsin x + \arccos x = \frac{\pi}{2}$
- $\arctan x + \text{arccot} x = \frac{\pi}{2}$

#### Conversion Relations

- $\arctan x = \arcsin\left(\frac{x}{\sqrt{1+x^2}}\right)$
- $\arctan x = \arccos\left(\frac{1}{\sqrt{1+x^2}}\right)$

### Applications of Inverse Trigonometric Functions

**Core purpose**: Find the corresponding angle given a trigonometric function value.

**Typical application scenarios**:

1. **Solving triangles**: Finding angles from side lengths
   - In a right triangle, given the opposite side is 3 and the hypotenuse is 5, find the angle:
   - $\theta = \arcsin\left(\frac{3}{5}\right) \approx 36.87°$

2. **Physics**: Angle calculations
   - Light refraction: $\theta_r = \arcsin\left(\frac{n_1 \sin\theta_i}{n_2}\right)$
   - Inclined plane motion: maximum angle of inclination $\theta = \arctan(\mu)$ ($\mu$ is the coefficient of friction)

3. **Engineering surveying**: Calculating azimuth angles
   - Finding angles from coordinate differences: $\theta = \arctan\left(\frac{\Delta y}{\Delta x}\right)$

4. **Computer Science**: Calculating rotation angles
   - Computing character orientation in game development
   - Computing vector angles in computer graphics

---

## 06 Applications

### Solving Triangles

- **Law of Sines**: $\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} = 2R$
- **Law of Cosines**: $c^2 = a^2 + b^2 - 2ab\cos C$

### Practical Application Domains

Right triangles are only the starting point for understanding trigonometric functions — their true definition is much broader. Trigonometric functions are the core tool for describing **periodic phenomena**:

- **Mathematics**: Geometry and trigonometry, calculus, complex analysis (Euler's formula, Fourier transform)
- **Physics**: Mechanics (force decomposition, circular motion), waves and vibrations, optics, circuit analysis
- **Engineering**: Signal processing, electrical engineering, mechanical engineering, civil engineering
- **Computer Science**: 2D/3D rotation, animation, camera perspectives, physics engines, collision detection
- **Astronomy and Geography**: Celestial body positions, GPS positioning, map projections

---

> This article is a mathematical foundations supplement for the Three.js + GLSL + WebGPU learning series. Trigonometric functions are the core mathematical tool for 3D graphics — rotations, transformations, and shaders in subsequent lessons will use them extensively.
