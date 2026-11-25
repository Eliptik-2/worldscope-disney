# Worldscope v2.6 — 3D Park Architecture / QA (November 24, 2026)

## Scope
The existing 3D park scene now has three levels of representation:
1. **Contributed real-world OpenStreetMap building footprints** drawn as colorized extrusions in Color 3D mode. Building shapes, elevations, heights, and completeness are limited by contributed map data; no claim of survey-grade geometry.
2. **Nine original landmark / Main Street study scenes**, including Spaceship Earth, Castle, Space Mountain, TRON, Pandora, Tree of Life, and two Main Street streetscape studies.
3. **101 original procedural attraction-and-shop concept meshes**: 44 rides + 57 shops in the directory. Five specific new building styles: Victorian storefront, pagoda roof, bazaar, modern retail, and traditional storefront. All 101 are browsable in the studio; 28 entries are geographically mapped. Other models remain gallery-only rather than appearing at invented coordinates.

## Repairs
- v2.4 gray building cleanup ignores the specifically registered color building layer `worldscope-v26-architecture`.
- v2.5 late styledata and idle cleanup also ignores that specific layer, while deleting the obsolete gray extrusion layers.
- Architecture layer uses one vector source from the active basemap where available; when absent it requests an OpenFreeMap vector source. Layer is hidden in Atlas and visible in Color 3D without destroying it on every switch.
- Scene is inserted below custom landmark/ride models or symbol layers to keep landmarks and UI readable.

## Tests actually run
- In JavaScript model-generation harness: **101/101** 3D meshes generated with finite numbers, valid triangle indices, and no 16-bit vertex overflow. 14 distinct model categories. Largest mesh has 5,492 vertices; 63,780 triangles in aggregate.
- In mocked MapLibre layer harness: creation of architecture layer, switching Atlas → Color 3D → Atlas → Color 3D, correct visibility and retention of existing route layer, no layer error.
- Existing GitHub Actions suite extended with `tests/worldscope-v26.test.cjs`; v2.5 coverage now includes all shop meshes and preservation of the colored architecture layer.
- Live preview page content was inspected through an already-open browser tab at v2.5. Fully interactive live navigation and actual satellite/vector tile integrity **have not** been verified from the isolated browser environment, and physical iPhone Safari is not tested.

## Known limitations and next work
- Map coverage is not 100%: unmodeled vector tile geometry and buildings without accurate heights may be missing or simplified.
- Shop/ride architecture is **concept art**, not exact Disney building replicas. Source data does not include official building plans or detailed architectural GLB files.
- Existing Main Street façades are stylized. Main Street single-building alignment and shop assignments still require reference survey and per-building verified footprint/entrance data.
- Footprints should not be used to infer walking access. Guest navigation remains independent of visual 3D and needs independent verification.
- Precise, photorealistic resort-wide 3D would require licensed detailed assets or an appropriately licensed photoreal 3D tiles service, performance budget, and coverage inspection. Do not substitute approximate concept models as though they were exact.
- Keep production `main/index.html` at v1.2 until the user approves promotion.

## User confirmation tests
1. Repeatedly toggle Atlas ↔ Color 3D; colored architecture should appear only in 3D, gray overlay should not reappear.
2. Enter 3D building studio: inspect an EPCOT shop, Magic Kingdom Main Street shop, and a Galaxy's Edge shop.
3. Route Guardians → Chefs de France, switch modes, check path persists.
4. Inspect City/park building footprint coverage at various zooms; check custom castle, space mountain and Main Street remain readable.
