---
title: 数学公式渲染测试：从欧拉公式到泰勒展开
description: 用一篇文章测试站点的 KaTeX 数学公式渲染能力，覆盖行内公式、块级公式、微积分、矩阵与极限等常见场景。如果每个公式都排版精美、没有乱码，说明渲染一切正常。
pubDate: '2026-08-14T10:00:00+08:00'
tags:
  - 数学
  - 测试
categories:
  - 随笔
---

这篇文章用来测试数学公式渲染。如果你能看到下面所有公式都漂亮地排版出来，说明 KaTeX 接入成功。

## 行内公式

欧拉恒等式被称为「最美的数学公式」：$e^{i\pi} + 1 = 0$，它把 $e$、$i$、$\pi$、$1$、$0$ 五个常数联系在了一起。

勾股定理 $a^2 + b^2 = c^2$ 与质能方程 $E = mc^2$ 也是常见的行内公式。

## 块级公式

欧拉公式的一般形式：

$$
e^{ix} = \cos x + i\sin x
$$

二次方程的求根公式：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

## 微积分

牛顿-莱布尼茨公式（微积分基本定理）：

$$
\int_a^b f(x)\,dx = F(b) - F(a)
$$

泰勒展开：

$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x - a)^n
$$

极限：

$$
\lim_{x \to 0} \frac{\sin x}{x} = 1
$$

## 线性代数

矩阵乘法：

$$
\begin{pmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{pmatrix}
\begin{pmatrix}
b_{11} & b_{12} \\
b_{21} & b_{22}
\end{pmatrix}
=
\begin{pmatrix}
a_{11}b_{11}+a_{12}b_{21} & a_{11}b_{12}+a_{12}b_{22} \\
a_{21}b_{11}+a_{22}b_{21} & a_{21}b_{12}+a_{22}b_{22}
\end{pmatrix}
$$

行列式：

$$
\det(A) = \begin{vmatrix}
a & b \\
c & d
\end{vmatrix} = ad - bc
$$

## 概率与统计

正态分布的概率密度函数：

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}
$$

贝叶斯定理：

$$
P(A|B) = \frac{P(B|A)\,P(A)}{P(B)}
$$

## 物理公式

麦克斯韦方程组之一（高斯定律）：

$$
\oint_{\partial V} \mathbf{E} \cdot d\mathbf{A} = \frac{Q}{\varepsilon_0}
$$

薛定谔方程：

$$
i\hbar\frac{\partial}{\partial t}\Psi(\mathbf{r}, t) = \hat{H}\Psi(\mathbf{r}, t)
$$

## 结语

以上就是各类常见公式的渲染测试。如果公式都能正常显示，就可以放心地在文章里写数学内容了。
