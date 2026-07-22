---
title: "02 | Vectors and Linear Algebra"
meta_title: "GAMES101 Vectors and Linear Algebra Basics"
description: "Vector definition and operations, dot product and cross product, matrix operations, homogeneous coordinates"
date: 2026-07-21T12:00:00+08:00
categories: ["Graphics", "GAMES101"]
series: ["GAMES101 - 现代计算机图形学"]
author: "Feynman"
tags: ["games101", "graphics", "vectors", "linear-algebra", "matrices"]
draft: false
---

> Instructor: Lingqi Yan | UCSB
> Bilibili: https://www.bilibili.com/video/BV1X7411F744


## 1 Vector Basics

### Definition of Vectors

![Vector Definition](/images/2026-07-21_series_games101/02_vectors/chap2_01.png)

Vectors have **direction** and **length**, but no absolute starting position.

Commonly denoted as $\vec{a}$ or bold **a**, represented by start and end points: $\overrightarrow{AB} = B - A$

### Vector Normalization

Magnitude (length) of a vector: $||\vec{a}|| = \sqrt{x^2 + y^2}$

**Unit vector**: A vector with magnitude 1, used to represent direction. Normalization: $\hat{a} = \frac{\vec{a}}{||\vec{a}||}$

### Vector Addition

**Geometric representation**: Parallelogram law & triangle law

![Vector Addition Geometric Representation](/images/2026-07-21_series_games101/02_vectors/chap2_02.png)

**Algebraic calculation**: Add corresponding coordinates

$$\vec{a} + \vec{b} = (a_x + b_x, a_y + b_y)$$

### Cartesian Coordinate System

![Cartesian Coordinate System](/images/2026-07-21_series_games101/02_vectors/chap2_03.png)

Represent vectors using coordinates:

$$\vec{a} = (x, y) = x\hat{i} + y\hat{j}$$

where $\hat{i}, \hat{j}$ are basis vectors.


## 2 Vector Multiplication

### Dot Product

![Dot Product Definition](/images/2026-07-21_series_games101/02_vectors/chap2_04.png)

The dot product computes a **scalar**, solving how similar two vectors are (projection, angle, intensity).

**Definition**:

$$\vec{a} \cdot \vec{b} = ||\vec{a}|| \cdot ||\vec{b}|| \cdot \cos\theta$$

**Coordinate calculation**:

$$\vec{a} \cdot \vec{b} = a_x b_x + a_y b_y + a_z b_z$$

**Properties**:

| Property | Formula |
|:---|:---|
| Commutative | $\vec{a} \cdot \vec{b} = \vec{b} \cdot \vec{a}$ |
| Distributive | $\vec{a} \cdot (\vec{b} + \vec{c}) = \vec{a} \cdot \vec{b} + \vec{a} \cdot \vec{c}$ |
| Associative | $(k\vec{a}) \cdot \vec{b} = k(\vec{a} \cdot \vec{b})$ |

**Applications in Graphics**:

![Dot Product Applications](/images/2026-07-21_series_games101/02_vectors/chap2_05.png)

1. **Calculate angle between vectors** (e.g., angle between light and normal)
2. **Vector projection**: Projection of $\vec{a}$ onto $\vec{b}$ $= \frac{\vec{a} \cdot \vec{b}}{||\vec{b}||}$
3. **Determine direction**: dot product > 0 same direction, < 0 opposite, = 0 perpendicular

![Dot Product Direction](/images/2026-07-21_series_games101/02_vectors/chap2_07.png)


### Cross Product

![Cross Product Definition](/images/2026-07-21_series_games101/02_vectors/chap2_08.png)

The cross product computes a **vector**, solving what direction is perpendicular to two vectors (normal, rotation axis, direction).

**Definition**: The cross product result is perpendicular to both input vectors, direction determined by the **right-hand rule**, commonly used to construct coordinate systems.

**Properties**:

| Property | Formula |
|:---|:---|
| Anti-commutative | $\vec{a} \times \vec{b} = -(\vec{b} \times \vec{a})$ |
| Self cross product | $\vec{a} \times \vec{a} = \vec{0}$ |
| Distributive | $\vec{a} \times (\vec{b} + \vec{c}) = \vec{a} \times \vec{b} + \vec{a} \times \vec{c}$ |
| Scalar multiplication | $(k\vec{a}) \times \vec{b} = k(\vec{a} \times \vec{b})$ |

**Coordinate calculation** (3D):

$$\vec{a} \times \vec{b} = \begin{pmatrix} a_y b_z - a_z b_y \\ a_z b_x - a_x b_z \\ a_x b_y - a_y b_x \end{pmatrix}$$

**Applications in Graphics**:

![Determine Left/Right and Inside/Outside](/images/2026-07-21_series_games101/02_vectors/chap2_09.png)

1. **Determine left/right**: Cross product direction determines if a point is on the left or right of a vector
2. **Determine inside/outside**: Used in triangle rasterization to determine if a point is inside a triangle
3. **Calculate normal**: Cross product of two triangle edges gives the normal vector


## 3 Matrices

### Basic Matrix Concepts

$m \times n$ matrix: An array of numbers with $m$ rows and $n$ columns.

$$A = \begin{pmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{pmatrix}$$

### Matrix Multiplication

**Dimension requirement**: $(m \times n) \cdot (n \times p) = (m \times p)$

**Definition**: $C_{ij} = \sum_{k} A_{ik} \cdot B_{kj}$

### Matrix Properties

| Property | Description |
|:---|:---|
| **Non-commutative** | $AB \neq BA$ (in general) |
| **Associative** | $(AB)C = A(BC)$ |
| **Distributive** | $A(B + C) = AB + AC$ |

### Matrix Transpose

$$A^T_{ij} = A_{ji}$$

Transpose property: $(AB)^T = B^T A^T$

### Matrix Inverse

![Matrix and Vector Operations](/images/2026-07-21_series_games101/02_vectors/chap2_10.png)

$A^{-1}$ satisfies $A A^{-1} = A^{-1} A = I$

**Important property**: $(AB)^{-1} = B^{-1} A^{-1}$

### Homogeneous Coordinates

To unify **translation** and **rotation/scaling** transformations, homogeneous coordinates are introduced:

- 2D point: $(x, y) \rightarrow (x, y, 1)$
- 2D vector: $(x, y) \rightarrow (x, y, 0)$

Advantage of homogeneous coordinates: **Affine transformations can be uniformly represented as matrix multiplication**, facilitating composition and inversion of transformations.


## 4 Orthogonal Coordinate System

Three conditions for an **orthogonal coordinate system**:

1. All three basis vectors are unit vectors (length 1)
2. They are mutually perpendicular (dot product = 0)
3. Satisfy right-hand rule: $\hat{w} = \hat{u} \times \hat{v}$

**Coordinate system transformation**: Model coordinates → World coordinates → Camera coordinates → Clip coordinates (MVP transformation)


## 5 Review Questions

1. **What are the geometric meanings of dot product and cross product?**

   The dot product measures the similarity between two vectors (projection relationship), resulting in a scalar; the cross product gives a new vector perpendicular to both vectors, with direction determined by the right-hand rule.

2. **Why doesn't matrix multiplication satisfy the commutative law?**

   Because matrix multiplication represents composition of transformations. Rotate then translate ≠ translate then rotate; different order yields different results.

3. **What problem do homogeneous coordinates solve?**

   They unify translation and linear transformations (rotation/scaling/shearing), allowing all affine transformations to be represented as matrix multiplication, facilitating composition and inversion.

4. **How to determine if a point is inside a triangle?**

   For each of the three edges of the triangle, compute the cross product with "edge start point → test point". If all three cross products have the same direction (all positive or all negative), the point is inside the triangle.

5. **What are the three conditions for an orthogonal coordinate system?**

   All three basis vectors are unit vectors (length 1), they are mutually perpendicular (dot product = 0), and they satisfy the right-hand rule (w = u × v).


---

> This article is note #2 in the GAMES101 - Modern Computer Graphics learning series.
