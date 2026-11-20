# Worldscope v2.3 development QA — 2026-11-20

Branch: development. Preview path: /worldscope-disney/preview/. Production main homepage remains v1.2.

## What changed
- Neutral/mostly grayscale vector Atlas as default; no satellite imagery in normal UI.
- Optional full-color 3D MapLibre direct-WebGL scene.
- Nine 3D scene models: seven existing landmark studies (Spaceship Earth, Cinderella Castle, Space Mountain, TRON canopy, Tower of Terror, Tree of Life, Pandora) plus an East and West Main Street storefront study.
- Main Street concept includes 16 unique modular façades, windows, awnings, street lamps, trees and vendor carts. It is **illustrative geometry**, not an architectural survey or a model of every actual shop/stand.
- Venue coordinates: Chefs de France (EPCOT), Uptown Jewelers (Magic Kingdom), plus new Main Street Bakery and Crystal Arts directory locations. All are venue/map reference coordinates, **NOT verified guest entrances**.
- A **Place destination marker on map** workflow for any still-unmapped restaurant, bar, shop, or other directory entry. User-provided markers are local to this browser and labeled unverified.
- Fixed the destination dropdown stale-selection bug: choosing a different place no longer silently reuses a previous entry.
- Fullscreen Directions now has a prominent sticky **Hide directions** button; reopen through Directions button.
- Optional camera-guide proof of concept requests camera permission only when activated; camera tracks stop on closing or page hide.
- Camera guide is *screen-fixed concept artwork*, NOT georeferenced wayfinding. It cannot detect obstacles or follow actual Disney guest paths.

## Tests actually executed (isolated Chromium virtual display)
1. Actual software WebGL rendering, 1280 × 720 and 390 × 844: 9 scenes initialized; both existing landmarks and Main Street scenes generated geometry; screenshots captured; zero JavaScript errors.
2. Panning/projection update: model screen position updated and WebGL frame count increased when simulated camera moved; zero JavaScript errors.
3. Nine mesh geometry tests: each mesh indexed within 16-bit GPU limit; no NaN vertices.
4. Directions selection category test, desktop and mobile fixture: shop and ride mapped paths invoked planner; unmapped food and bar returned explicit refusal rather than fake turn-by-turn; switching to a new selection did not reuse prior one.
5. Responsive UI fixture, 390px and 1280px: Atlas vs Color 3D state, menu close in full-screen mode, user-placed marker selection + local persistence, camera mock permission and camera track cleanup all passed.
6. Test scripts: /mnt/data/worldscope_v23/browser_test.py, /mnt/data/worldscope_v23/test_ui.py, /mnt/data/worldscope_v23/test_directions.py. GitHub Actions contains a v2.3 geometry test as well.

## Not yet verified
- Live GitHub Pages deployment timing and real MapLibre third-party tiles.
- Real GPS accuracy, iOS Safari camera access and sensor support.
- Actual Disney pedestrian graph coverage, closures, bus times, and precise queue entrances.
- Correct architectural positioning/texture fidelity for all Main Street buildings and rides.
- Production user accounts and real-time family shared notes.

## Location evidence
- Chefs de France: https://aroundus.com/p/5480993-les-chefs-de-france
- Uptown Jewelers: https://mapcarta.com/N1307107795
- Main Street Bakery: https://www.waymarking.com/waymarks/WM11CNE_Main_Street_Bakery_Lake_Buena_Vista_FL
- Crystal Arts: https://mapcarta.com/N3015878585
- Main Street venues and directional layout: https://cdn1.parksmedia.wdprapps.disney.com/vision-dam/digital/parks-platform/parks-standard-assets/disney-world/guide-maps/magic-kingdom/MK_0526_EN-KM.pdf

## Follow-up tests requested from user
- Verify Main Street and castle in 3D on the real phone. Models remain stylized.
- Chefs de France (EPCOT) selection from Guardians (EPCOT); do not mistake route-service failure for an absent destination.
- Open Directions in fullscreen, then use Hide directions and reopen it.
- Open camera prototype, deny/allow access, then close. Do NOT use it as navigation.
- Confirm route layers survive switching Atlas/3D.
