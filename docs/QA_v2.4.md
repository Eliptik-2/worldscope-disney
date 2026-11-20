# Worldscope v2.4 — test and release notes

Status: preview-only. Production main/index.html remains v1.2.

## User feedback addressed
- Gray OpenStreetMap extrusion buildings appeared on top of colorful Main Street concept models after switching Atlas ↔ Color 3D.
- Full-screen map entry became hard to find or invisible behind the Atlas controls.
- The large landmark fly-to dropdown and bottom-left Storybook Atlas overlay obscured the map.
- Directions drawer needed a reliable hide control on smaller phones.
- Guardians of the Galaxy: Cosmic Rewind → Chefs de France at EPCOT could use an unnecessarily long walking route.
- Routes should persist when switching Atlas ↔ Color 3D.
- Camera prototype remains in beta; no misleading claim of working AR ground guidance.

## Implementation
- v24.js scans map style for fill-extrusion layers and keeps them hidden on map load, style load, idle and map-mode changes. Colored custom WebGL landmarks are separate.
- The existing full-screen map button is moved clear of the new Atlas/3D toggles, with a clear Exit control in immersive mode.
- The landmark fly-to select is collapsed into a small user-opened menu. The distracting lower-left branding overlay is hidden.
- The fullscreen Directions drawer layers above map controls and retains its Hide directions control.
- For mapped points within the same park, the planner now requests standard pedestrian routing AND Valhalla's shortest-distance pedestrian option, selects the shorter valid geometry, and retains maneuver text.
- Validation checks resort boundaries, endpoint snapping, path geometry, and excessive circuitous distances. Long or missing paths do not get replaced by straight lines through buildings.
- Between-park and BoardWalk transport keep their existing separate planner.
- No guest entrance coordinates, park closures, or live route availability are invented.

## Tests actually run
- Node.js 22 syntax check for v24 JS — PASS.
- Node vm regression for gray building visibility, route shape checking, and excessive detour rejection — PASS.
- Chromium Playwright isolated DOM + mocked-map fixture at viewport widths 320, 390, 768 and 1280 (height 844) — PASS each:
  1. Full-screen entry visible and clickable.
  2. Directions panel opened, hidden and exited.
  3. Generic gray buildings remain hidden when 3D turns on/off and an idle event re-adds them.
  4. Fly-to menu collapsed by default; bottom-left scene banner hidden.
  5. Standard and shortest-distance *simulated* pedestrian routing responses compared; shorter geometry selected.
  6. Route remains after Color 3D ↔ Atlas.
  7. Bad route geometry removed; no invalid line drawn.
  8. No unhandled browser JS errors.
- The existing v2.3 destination-category test was re-run (rides, food, shops, bars; width 390 and 1280) — PASS.

## Not verified / outside test scope
- Live GitHub Pages deployment accessibility and real aerial/vector tile loading on an iPhone.
- EPCOT's shortest physically walkable path, real venue entrance access, temporary closures, exact estimated walking time.
- The live public Valhalla service on a Disney network / actual shortest-distance server response. The route comparison was tested with deterministic mocked responses, not an online route.
- Actual phone Safari, Android Chrome or real camera permission. Camera remains an explicit-permission visual concept, NOT AR navigation.
- The existing seven landmark + Main Street custom 3D assets were not modified in this patch; live-device GPU rendering needs user confirmation.

## Route interpretation
Shortest-distance pedestrian mode and route data are provided by Valhalla/OpenStreetMap, not Disney. Inaccurate or missing internal park footways can produce detours; rejected detours display a clear warning. Consult My Disney Experience for verified guest paths.

References:
- https://valhalla.github.io/valhalla/api/route/api-reference/
- https://www.disneyfoodblog.com/2025/04/16/4-shortcuts-that-will-save-you-15-minutes-in-epcot/
- https://disneyworld.disney.go.com/guest-services/my-disney-experience/mobile-apps/

## Release discipline
Only development and main/preview/ were updated. Do not promote to the family-facing root until visual and routing acceptance tests pass on the user's own device.
