# Motion reference clips

The rendered [Material motion physics page](https://m3.material.io/styles/motion/overview/how-it-works)
was inspected on 2026-09-26. It distinguishes expressive and standard motion
schemes and spatial and effects springs. The page's four clips below were
downloaded into a local QA cache from the media linked by that page. Their
binary media are not included in this source inventory.

| Page example             | Local file name         | SHA256                                                             |
| ------------------------ | ----------------------- | ------------------------------------------------------------------ |
| Expressive motion scheme | `expressive-spring.mp4` | `50a01e5ed7c252879b246b5decea38a3523cd19146731e8164aff18e260426f1` |
| Standard motion scheme   | `standard-spring.mp4`   | `fcf15bae16b587343d105b39e4a1de82ef6a130261bab567d7b722e8f8b01741` |
| Spatial position spring  | `spatial-position.mp4`  | `8150a00738ddaea786e276a52b7f08b78a4f5ba8d0a0bada909de3d1eb09b3fa` |
| Effects opacity spring   | `effects-opacity.mp4`   | `e176b766ce7816e30dd6b695177d0bb8fe6112fa440023d6c9a21c05bd9d93bc` |

These are media pins, not a motion review. Before selecting a source baseline,
watch the original clips at normal speed, inspect actual decoded timestamps,
and record the path, overshoot or lack of it, opacity change, settling, and
interruption behavior. The [motion specs](https://m3.material.io/styles/motion/overview/specs)
describe spring composites and a Web curve conversion for animations without
interruptions or gestures. The pinned Material Web motion Sass uses older easing
and duration values; do not equate those with the current spring system.
