# Frozen Material 3 and Expressive source coverage

This is source evidence for `M3-SRC-002`. The migration workbook is the sole task
database and owns the row dispositions, mapping IDs, dependencies, approvals and
implementation status. These source links do not claim native component acceptance.

## Reconciled membership

The pinned workbook retains 171 component sets from the [Material 3 Design Kit]
(CC BY 4.0), 80 pinned Compose source rows from AndroidX commit
`a095da93f8e98dea8748ceed79ea8427aade245f` (Apache 2.0), and 54 Material
Web component rows from commit `cbd34a8921915af94d5ef65c2a69eece41d5b4f3`
(Apache 2.0). Their source identities and variant axes remain in the workbook.
The 171 Figma rows resolve to 93 required component sets, 75 internal helpers,
two shape-foundation sets and one approved platform exclusion. The 80 Compose
rows resolve to 60 required component sources, 11 foundation sources, eight
API helper surfaces and one approved integration exclusion. All 54 retained Web
components keep required native mappings. The frozen membership digest is
`d3d773ee91c65c443b9d19c9b1eeea78da22afec74b26e03fdb99384c100667d`.

The workbook links each retained Figma set to its native mapping in both
directions. It preserves the exact axes, values, properties and variant counts
on the set row. Building blocks belong to their parent family and do not imply
additional public exports. Compose governs overlapping design, defaults,
behavior and motion; Figma supplies gaps and its Figma-only patterns. Material
Web and browser standards govern DOM, input, keyboard and focus semantics.
Every family still needs its shared source decision before implementation.

## Distinct Figma ownership

| Set                                                | Source finding                                                                                                                                                     | Native owner                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Generic avatar `50731:13725`                       | Check, Monogram and Avatar are three Figma styles with no standalone counterpart in the pinned Compose component index or Web component list.                      | `CM-0064` is a required native Avatar extension.                                    |
| Side Sheet `53198:27851` and content `57314:35886` | Standard and modal sheets, with optional back affordance, are general content surfaces. Navigation Drawer does not own this content model.                         | `CM-0292` is a required native SideSheet extension.                                 |
| Shape Set `58548:7248` and `.Shape` `55343:12390`  | Thirty-five named Expressive shapes and nine style variants extend the corner-role baseline. Equal names do not prove equal geometries.                            | Canonical native shape foundation `M3-NAT-002`; compare geometry there.             |
| Examples/Layout grid `56384:120`                   | Five window size classes and navigation-region layouts are responsive examples. Android `dp` thresholds are source observations, not browser pixels.               | Native Scaffold helper `CM-0285`; CSS viewport/container behavior must be tested.   |
| Deprecated Nav item `51593:5254`                   | The kit marks this generic 16-variant building block Deprecated. Its selected, icon, badge and state axes remain evidence; it supplies no current design override. | Navigation-family helper. Current Compose navigation governs the active components. |

XR AppBar, Dialog, NavigationBar/Rail and Toolbar sets remain mapped variants
of their respective native families. Their elevated surfaces and orientations
remain in the Figma rows; XR is not treated as an implicit exclusion. The
Carousel, Date/Time Picker, FAB menu, ButtonGroup, LoadingIndicator,
WavyProgressIndicator and other Figma-only sets likewise remain required
through their parent family mappings.

## Pinned Compose API surfaces

The [API snapshots] are broader than the indexed component implementation
files. Module rows remain in the workbook, with helper ownership for adaptive
layout/navigation, navigation suite, ripple, window size classes and the main
Material 3 API. Android Activity/window and predictive-back types are translated
to browser resize, history, focus and responsive behavior under those owners;
their Kotlin APIs are not copied into the web package.

The main `material3/api/current.txt` publishes 304 distinct Kotlin-only
composable method names at this pin. The implementation index and the mapping
descriptions before this reconciliation accounted for 257; the other 47 are
public family functions and helpers assigned below and now linked in the
workbook. This is a source-surface audit,
not a promise to mirror every Kotlin method as a JavaScript export.

| Owner                                                      | Additional public API names and source context                                                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BottomSheet `CM-0272`                                      | `BottomSheetDefaults.DragHandle`                                                                                                                                                            |
| DatePicker `CM-0274`                                       | `DatePickerDialog`                                                                                                                                                                          |
| Menu `CM-0032`, MenuItem `CM-0033`                         | `DropdownMenu`, `DropdownMenuGroupLabel`, `DropdownMenuItemTrailingLabel`; `MenuDefaults` group shape, item and selectable colors/shapes, vibrant colors and popup position provider        |
| FloatingActionButtonMenu `CM-0281`                         | `FloatingActionButtonMenuItem`, `ToggleFloatingActionButtonDefaults.animateIcon`                                                                                                            |
| NavigationBar `CM-0035`; NavigationRail `CM-0275`          | `NavigationBarItem`, `rememberWideNavigationRailState`                                                                                                                                      |
| TextField/field `CM-0021`, `CM-0022`, `CM-0053`, `CM-0054` | Filled and outlined `Container`, `DecorationBox`, `decorator`, `tonalColors`                                                                                                                |
| SegmentedButton `CM-0043`, `CM-0044`                       | `SegmentedButton` single and multiple selection overloads                                                                                                                                   |
| IconButton `CM-0025`–`CM-0028`                             | `IconButtonDefaults` filled, tonal, standard, outlined, toggle and vibrant color/border/shape helpers                                                                                       |
| ListItem `CM-0029`, `CM-0031`                              | `ListItemDefaults.segmentedColors`, `segmentedShapes`, `verticalAlignment`                                                                                                                  |
| Carousel `CM-0273`                                         | `CarouselDefaults.maskBorder`, `maskClip`, `rememberMaskShape`; `rememberCarouselState`                                                                                                     |
| Scaffold `CM-0285`                                         | `nonInteractiveScrollbar` visual-only modifier. Browser scrollbar interaction and accessibility remain browser-owned; source fade, orientation and thumb defaults need explicit evaluation. |

The adaptive API surfaces assign window posture and pane layout to Scaffold;
rail/bar/drawer changes belong to their corresponding navigation families.
`material3-adaptive-navigation-suite` joins those owners. `material3-ripple`
belongs to native Ripple `CM-0042`. `material3-window-size-class` belongs to
Scaffold's responsive behavior, without exporting an Android `Activity` API.

## Approved platform and integration exclusions

The owner approved these exact exclusions on 26 September 2026; their source
rows, reasons and approval references remain in the workbook.

| Retained source                          | Evidence                                                                                                                                 | Boundary                                                                                                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Utilities/Keyboard `52515:32926`   | Twelve virtual keyboard drawings cover base, alphanumeric, keypad and numeric configurations in portrait, landscape and floating styles. | The browser/OS owns the virtual keyboard. Native Material text inputs still own `type`, `inputmode`, focus and accessibility behavior.                                     |
| Compose `material3-a2ui/api/current.txt` | `A2uiSurface` renders an A2UI protocol model through `MaterialA2uiBasicCatalogV1` and media renderers.                                   | The protocol adapter is outside the visual component package. Its underlying Button, Card, input and other Material components remain required through their own mappings. |

No other source row is excluded. Neither a missing Web component nor a
deprecated Figma helper is evidence for dropping Material coverage.

[Material 3 Design Kit]: https://www.figma.com/community/file/1035203688168086460/material-3-design-kit
[API snapshots]: https://android.googlesource.com/platform/frameworks/support/+/a095da93f8e98dea8748ceed79ea8427aade245f/compose/material3/
