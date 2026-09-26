# Rendered Material motion guidance

- Sources: [motion physics](https://m3.material.io/styles/motion/overview/how-it-works)
  and [specs](https://m3.material.io/styles/motion/overview/specs)
- Observed: 2026-09-26, rendered pages in a browser
- Scope: scheme choice, spring categories, and the explicitly limited Web
  conversion. The [watched source clips](../motion/README.md) hold visual
  observations and hashes.

Material's physics system replaces the earlier duration/easing system for
Expressive motion. It has expressive and standard schemes, selected at the
product level; a specific element can override the scheme. Each scheme has
fast, default, and slow spatial and effects springs. Spatial springs cover
position, rotation, size, and corners and may overshoot. Effects springs
cover color and opacity and should settle without overshoot. The page assigns
default speed to most motion, fast to smaller elements, and slow to larger or
full-screen changes. Springs can respond to interruption, gesture velocity,
and new targets; a fixed curve cannot establish that behavior.

The specs page says Web should use springs when possible. It permits the
following curve conversions only for animations without interruption or
gesture input. Each curve lists cubic-bezier control points and duration in
milliseconds:

| Scheme     | Speed   | Style   | Curve                    | Duration |
| ---------- | ------- | ------- | ------------------------ | -------- |
| Expressive | Fast    | Spatial | `0.42, 1.67, 0.21, 0.90` | 350      |
| Expressive | Default | Spatial | `0.38, 1.21, 0.22, 1.00` | 500      |
| Expressive | Slow    | Spatial | `0.39, 1.29, 0.35, 0.98` | 650      |
| Expressive | Fast    | Effects | `0.31, 0.94, 0.34, 1.00` | 150      |
| Expressive | Default | Effects | `0.34, 0.80, 0.34, 1.00` | 200      |
| Expressive | Slow    | Effects | `0.34, 0.88, 0.34, 1.00` | 300      |
| Standard   | Fast    | Spatial | `0.27, 1.06, 0.18, 1.00` | 350      |
| Standard   | Default | Spatial | `0.27, 1.06, 0.18, 1.00` | 500      |
| Standard   | Slow    | Spatial | `0.27, 1.06, 0.18, 1.00` | 750      |
| Standard   | Fast    | Effects | `0.31, 0.94, 0.34, 1.00` | 150      |
| Standard   | Default | Effects | `0.34, 0.80, 0.34, 1.00` | 200      |
| Standard   | Slow    | Effects | `0.34, 0.88, 0.34, 1.00` | 300      |

These curves are fallback recipes, not a measured spring trace and not a
replacement for the pinned Compose implementation. Native motion verification
still needs enter, exit, interruption, reversal, reduced motion, and matched
timed frames for the chosen component behavior.
