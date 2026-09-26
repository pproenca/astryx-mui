# Source version and authority check

Observed 26 September 2026. The project owner approved Compose-first precedence
and refreshing the Compose reference. This is evidence for that policy change;
the family contract and `policy.json` own the rule.

- Previous AndroidX pin: `b97c4470f19d8ae9bb9f96be24376fdf37ad056f` (21 September).
- Refreshed AndroidX pin: [`a095da93f8e98dea8748ceed79ea8427aade245f`](https://github.com/androidx/androidx/commit/a095da93f8e98dea8748ceed79ea8427aade245f)
  (26 September), resolved from `androidx-main` and frozen. This is a source snapshot,
  not a claim that every API is stable or belongs to one released artifact.
- The supplied Figma export was made on 21 September. Its export timestamp does
  not establish when each design value was introduced upstream.
- Google's [Material site](https://m3.material.io/) directs Android developers to
  Compose for current Material implementation. The [release notes](https://developer.android.com/jetpack/androidx/releases/compose-material3)
  list stable 1.4.0 and 1.5.0-alpha29 dated 23 September at observation time.
  This does not establish that every Compose value is newer than the Figma kit.

The index comparison retains 80 reference rows, 120 token files and 2,673 token
expressions. Seventeen reference rows changed, including the main public API
snapshot, AppBar, Carousel, Chip, FAB/FAB menu, FloatingToolbar, IconButton,
ListItem, LoadingIndicator, MaterialTheme, NavigationItem, SearchBar,
ShortNavigationBar, Slider, WavyProgressIndicator and WideNavigationRail.
Unchanged membership is not proof of unchanged variants or behavior: source
preparation must examine relevant changes at the new pin.

A concrete disagreement persists: Compose's `ColorLightTokens.OnPrimaryContainer`
resolves through `PaletteTokens.Primary10` to `#21005D`; the pinned Figma Light
scheme specifies `#4F378A`. The new default selects Compose for that overlap.
Figma remains evidence of the disagreement and retains uncovered variants.
Selecting the Figma value instead requires an approved dimension exception.
Do not infer the winner from a file timestamp or silently switch source versions.

The v4 workbook upgrade retains task/mapping identities and QA history, archives
the original workbook bytes, updates the active source references, and requires
new preparations and approval. Historical Figma-first comparisons remain useful
observations; their selection instructions are superseded.
