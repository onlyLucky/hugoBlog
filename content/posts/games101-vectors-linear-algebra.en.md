---
title: "02 | Vectors and Linear Algebra"
meta_title: "GAMES101 Vectors and Linear Algebra Basics"
description: "Vector definition and operations, dot product and cross product geometric meaning, matrix operations, homogeneous coordinates"
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

- Vectors have **direction** and **length**, but no absolute starting position
- Commonly denoted as $\vec{a}$ or bold **a**
- Represented by start and end points: $\overrightarrow{AB} = B - A$

### Vector Normalization

- Magnitude (length) of a vector: $||\vec{a}||$
- **Unit vector**: A vector with magnitude 1, used to represent direction
- Normalization: $\hat{a} = \frac{\vec{a}}{||\vec{a}||}$

### Vector Addition

- **Geometric representation**: Parallelogram law & triangle law
- **Algebraic calculation**: Add corresponding coordinates

$$
\vec{a} + \vec{b} = \begin{pmatrix} x_a + x_b \\ y_a + y_b \end{pmatrix}
$$

**Geometric representation of vector addition**:

![Geometric Representation](/images/2026-07-21_series_games101/02_vectors/chap2_02.png)

> **Parallelogram law**: $\vec{a} + \vec{b} = \vec{b} + \vec{a}$ (commutative)
> **Triangle law**: $\vec{a}$ first, then $\vec{b}$, connected end to end

### Cartesian Coordinate System


![Cartesian Coordinate System](/images/2026-07-21_series_games101/02_vectors/chap2_03.png)

$$
\vec{A} = \begin{pmatrix} x \\ y \end{pmatrix}, \quad \vec{A}^T = (x, y), \quad ||\vec{A}|| = \sqrt{x^2 + y^2}
$$

---

## 2 Vector Multiplication

### Dot Product (Scalar Product)

![Dot Product](/images/2026-07-21_series_games101/02_vectors/chap2_04.png)

The dot product computes a **scalar**, solving how similar two vectors are (projection, angle, intensity).

**Definition**:

$$
\vec{a} \cdot \vec{b} = ||\vec{a}|| \cdot ||\vec{b}|| \cdot \cos\theta
$$

$$
\cos\theta = \frac{\vec{a} \cdot \vec{b}}{||\vec{a}|| \cdot ||\vec{b}||}
$$

For unit vectors: $\cos\theta = \hat{a} \cdot \hat{b}$

**Coordinate calculation**:

- 2D: $\vec{a} \cdot \vec{b} = x_a x_b + y_a y_b$
- 3D: $\vec{a} \cdot \vec{b} = x_a x_b + y_a y_b + z_a z_b$

**Properties**:

| Property | Formula |
|:---|:---|
| Commutative | $\vec{a} \cdot \vec{b} = \vec{b} \cdot \vec{a}$ |
| Distributive | $\vec{a} \cdot (\vec{b} + \vec{c}) = \vec{a} \cdot \vec{b} + \vec{a} \cdot \vec{c}$ |
| Associative | $(k\vec{a}) \cdot \vec{b} = \vec{a} \cdot (k\vec{b}) = k(\vec{a} \cdot \vec{b})$ |

**Applications in Graphics**:

1. **Calculate angle between vectors** (e.g., angle between light and normal)
2. **Vector projection**: Projection of $\vec{b}$ onto $\vec{a}$ is $\vec{b}_\perp = (\vec{b} \cdot \hat{a})\hat{a}$
3. **Determine direction**: dot product > 0 same direction, < 0 opposite, = 0 perpendicular

**Geometric meaning of dot product**:

![Dot Product Geometry](/images/2026-07-21_series_games101/02_vectors/chap2_05.png)
![Dot Product Projection](/images/2026-07-21_series_games101/02_vectors/chap2_06.png)

> **Calculate angle**: $\cos\theta = \frac{\vec{a} \cdot \vec{b}}{||\vec{a}|| \cdot ||\vec{b}||}$
> **Vector projection**: $\vec{b}_\perp = (\vec{b} \cdot \hat{a})\hat{a}$

**Dot product for direction detection**:

![Dot Product Direction](/images/2026-07-21_series_games101/02_vectors/chap2_07.png)

> - $\vec{a} \cdot \vec{b} > 0$: same direction ($\theta < 90°$)
> - $\vec{a} \cdot \vec{b} = 0$: perpendicular ($\theta = 90°$)
> - $\vec{a} \cdot \vec{b} < 0$: opposite direction ($\theta > 90°$)

### Cross Product (Vector Product)

![Cross Product](/images/2026-07-21_series_games101/02_vectors/chap2_08.png)

The cross product computes a **vector**, solving what direction is perpendicular to two vectors (normal, rotation axis, direction).

**Definition**:

- Cross product result is perpendicular to both input vectors
- Direction determined by the **right-hand rule**
- Commonly used to construct coordinate systems

**Properties**:

| Property | Formula |
|:---|:---|
| Anti-commutative | $\vec{a} \times \vec{b} = -\vec{b} \times \vec{a}$ |
| Self cross product | $\vec{a} \times \vec{a} = \vec{0}$ |
| Distributive | $\vec{a} \times (\vec{b} + \vec{c}) = \vec{a} \times \vec{b} + \vec{a} \times \vec{c}$ |
| Scalar multiplication | $\vec{a} \times (k\vec{b}) = k(\vec{a} \times \vec{b})$ |

**Standard orthonormal basis relations**:

$$
\vec{x} \times \vec{y} = +\vec{z}, \quad \vec{y} \times \vec{z} = +\vec{x}, \quad \vec{z} \times \vec{x} = +\vec{y}
$$

**Coordinate calculation**:

$$
\vec{a} \times \vec{b} = \begin{pmatrix} y_a z_b - y_b z_a \\ z_a x_b - x_a z_b \\ x_a y_b - y_a x_b \end{pmatrix}
$$

**Matrix form** (dual matrix):

$$
\vec{a} \times \vec{b} = A^* \vec{b} = \begin{pmatrix} 0 & -z_a & y_a \\ z_a & 0 & -x_a \\ -y_a & x_a & 0 \end{pmatrix} \begin{pmatrix} x_b \\ y_b \\ z_b \end{pmatrix}
$$

**Applications in Graphics**:

![Determine Left/Right and Inside/Outside](/images/2026-07-21_series_games101/02_vectors/chap2_09.png)

1. **Determine left/right**: Cross product direction determines if a point is on the left or right of a vector. For example, $\vec{a} \times \vec{b}$ corresponds to the positive z-axis direction, meaning $\vec{b}$ is to the left of $\vec{a}$
2. **Determine inside/outside**: Used in triangle rasterization to determine if a point is inside a triangle. For example, $\overrightarrow{AB} \times \overrightarrow{AP}$ means P is to the left of $\overrightarrow{AB}$, $\overrightarrow{BC} \times \overrightarrow{BP}$ means P is to the left of $\overrightarrow{BC}$, $\overrightarrow{CA} \times \overrightarrow{CP}$ means P is to the left of $\overrightarrow{CA}$
3. **Calculate normal**: Cross product of two triangle edges gives the normal vector

**Right-hand rule for cross product**:

Right-hand screw rule: right hand in thumbs-up position, $\vec{a} \times \vec{b}$, four fingers curl from $\vec{a}$ to $\vec{b}$, thumb direction is the z-axis direction

> - $\vec{a} \times \vec{b}$ is perpendicular to the plane formed by $\vec{a}$ and $\vec{b}$
> - Direction determined by **right-hand rule**: fingers curl from $\vec{a}$ toward $\vec{b}$, thumb points to cross product direction

**Cross product for left/right and inside/outside detection**:

> **Left/right detection**: $\vec{a} \times \vec{b}$ result is positive → $\vec{b}$ is to the left of $\vec{a}$

> **Inside/outside detection**: If $P$ is on the same side (left side) of $\overrightarrow{AB}$, $\overrightarrow{BC}$, $\overrightarrow{CA}$, then $P$ is inside the triangle
> Used in **triangle rasterization** to determine if a pixel is inside a triangle

**Orthogonal coordinate system conditions**:

$$
||\vec{u}|| = ||\vec{v}|| = ||\vec{w}|| = 1 \quad \text{(unit vectors)}
$$

$$
\vec{u} \cdot \vec{v} = \vec{v} \cdot \vec{w} = \vec{u} \cdot \vec{w} = 0 \quad \text{(mutually perpendicular)}
$$

$$
\vec{w} = \vec{u} \times \vec{v} \quad \text{(right-handed system)}
$$

3D Cartesian coordinate system

**Decomposition of arbitrary vectors**:

$$
\vec{p} = (\vec{p} \cdot \vec{u})\vec{u} + (\vec{p} \cdot \vec{v})\vec{v} + (\vec{p} \cdot \vec{w})\vec{w}
$$

**Application scenarios**:

- Coordinate system transformation: world coordinates, model coordinates, camera coordinates, local coordinates
- Foundation for MVP transformation in subsequent lessons

**Orthogonal coordinate system and vector decomposition**:

> **Orthogonal coordinate system conditions**: $||\vec{u}|| = ||\vec{v}|| = ||\vec{w}|| = 1$, mutually perpendicular, $\vec{w} = \vec{u} \times \vec{v}$

> **Vector decomposition**: $\vec{p} = (\vec{p} \cdot \vec{u})\vec{u} + (\vec{p} \cdot \vec{v})\vec{v} + (\vec{p} \cdot \vec{w})\vec{w}$

**Relationships between different coordinate systems**:

> **Coordinate system transformation**: Model coordinates → World coordinates → Camera coordinates → Clip coordinates (MVP transformation)

---

## 3 Matrices

### Basic Matrix Concepts

- $m \times n$ matrix: an array with $m$ rows and $n$ columns
- Addition and scalar multiplication: element-wise operations

### Matrix Multiplication

**Dimension requirement**: $(M \times N) \times (N \times P) = (M \times P)$

$$
C_{ij} = \sum_{k=1}^{N} A_{ik} \cdot B_{kj}
$$

- $c_{ij}$ denotes element at row $i$, column $j$ of **C**
- $a_{ik}$ denotes element at row $i$, column $k$ of **A**
- $b_{kj}$ denotes element at row $k$, column $j$ of **B**

Given:
$$\mathbf{A} = \begin{bmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{bmatrix}, \quad \mathbf{B} = \begin{bmatrix} b_{11} & b_{12} \\ b_{21} & b_{22} \end{bmatrix}$$

Then:
$$\mathbf{AB} = \begin{bmatrix} 
a_{11}b_{11} + a_{12}b_{21} & a_{11}b_{12} + a_{12}b_{22} \\
a_{21}b_{11} + a_{22}b_{21} & a_{21}b_{12} + a_{22}b_{22}
\end{bmatrix}$$

$$
\begin{pmatrix} 1 & 3 \\ 5 & 2 \\ 0 & 4 \end{pmatrix}
\begin{pmatrix} 3 & 6 & 9 & 4 \\ 2 & 7 & 8 & 3 \end{pmatrix}
= \begin{pmatrix} 9 & 27 & 33 & 13 \\ 19 & 44 & 61 & 26 \\ 8 & 28 & 32 & 12 \end{pmatrix}
$$

How to compute: take row 2, column 4 (value 26) as example. Row 2 values are 5 and 2, column 4 values are 4 and 3. Dot product: $5*4 + 2*3 = 26$

**Properties**:

| Property | Description |
|:---|:---|
| Non-commutative | $AB \neq BA$ (in general) |
| Associative | $(AB)C = A(BC)$ |
| Distributive | $A(B+C) = AB + AC$ |

### Matrix-Vector Multiplication

- Vectors treated as column matrices ($m \times 1$)
- Foundation for transformations (reflection, rotation, scaling)

**Matrix transformation example**:

> **Reflection about y-axis**: $\begin{pmatrix} -1 & 0 \\ 0 & 1 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} -x \\ y \end{pmatrix}$

### Matrix Transpose

A 2×3 matrix transposed becomes a 3×2 matrix — rows and columns are swapped.

$\begin{pmatrix} 1 & 2 \\ 3 & 4 \\ 5 & 6 \end{pmatrix}^T = \begin{pmatrix} 1 & 3 & 5 \\ 2 & 4 & 6 \end{pmatrix}$

$$
(A^T)_{ij} = A_{ji}, \quad (AB)^T = B^T A^T
$$

### Identity Matrix and Inverse Matrix

$I_{3 \times 3} = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}$

Matrix inverse: two matrices multiply to give the identity matrix.

> - **Identity matrix** $I$: diagonal elements are 1, others are 0, $AI = IA = A$
> - **Inverse matrix** $A^{-1}$: $AA^{-1} = A^{-1}A = I$, $(AB)^{-1} = B^{-1}A^{-1}$

$A^{-1}$ is called the **inverse matrix** of $A$, where $I$ is the identity matrix.

> **Note**: Only **square matrices** (rows = columns) with **non-zero determinant** (full rank) have inverse matrices.

Methods for computing inverse matrices

![Matrix and Vector Operations](/images/2026-07-21_series_games101/02_vectors/chap2_10.png)

Camera rotation and translation.

---

> This article is note #2 in the GAMES101 - Modern Computer Graphics learning series.
