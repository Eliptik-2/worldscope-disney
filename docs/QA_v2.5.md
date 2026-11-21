# Worldscope v2.5 development test report

Status: **preview candidate**, still requires validation on the live site and physical iPhone.

## User-reported issue
- User says v2.4 gray generic buildings reappear after repeated Atlas / Color 3D switching.
- Root cause: v1.7 `ensure3dBuildings()` contained a delayed callback that recreated gray `fill-extrusion` layers after newer controls hid them. v2.4's hide-after-the-fact approach was vulnerable to this race.

## Fix
- In v1.7 *development/preview copy only*, `ensure3dBuildings()` now removes existing generic extrusion layers and never adds them.
- The v2.5 ride atlas separately removes any newly introduced generic extrusions on style/load/idle events, including stale-code or cached-script situations. Both modes preserve the custom artwork.

## Ride model program
- 44 currently listed rides receive an original procedural 3D **concept mesh** in the optional Ride Model Studio gallery. These are not faithful Disney attraction replicas.
- 23 ride directory records currently have latitude/longitude. Those can be positioned on the map (not necessarily verified queue entrances). The other 21 get viewer-only models, **no invented map coordinates**.
- Four established attraction landmarks are not duplicated. This yields 19 new map-placed ride concept models alongside the existing 3D landmarks and Main Street scenes.
- Nine reusable architectural/ride archetypes, with deterministic color and dimensional variation; approximate geometry is clearly identified as illustrative.
- Optional GPU display; a browser without WebGL uses a Canvas 2D software projection for the Ride Model Studio.

## Checks performed locally
- Node.js: 44 ride model geometries, 23 mapped, 19 new map additions, 9 visual categories; 48,176 combined triangles; finite positions and safe 16-bit indices.
- Simulated MapLibre: switching modes removes/doesn't restore gray extrusions; existing route line remains; map ride layer can be toggled on and off.
- Chromium browser fixture: desktop 1280 px, tablet 768 px, phone 390 px, compact phone 320 px. Model gallery opens and closes, supports selection and preview, and has no horizontal overflow.
- Software projection fallback visible under Chromium in this environment, where WebGL is blocked. Gallery shows a coherent 3D-oriented model under Canvas 2D.
- Five repeated Color 3D → Atlas cycles per viewport: simulated late extrusion injection on every cycle; no gray layer remains, route line remains, no JavaScript page exceptions.
- Unmapped attraction option: Fly button disabled and exact-location warning shown.

## Remaining limitations
- Browser fixture does not load actual remote OpenFreeMap tiles or on-device MapLibre WebGL. End-to-end rendering over real Disney parks remains unverified.
- User's accepted Guardians → Chefs de France route is not changed in this update.
- New model shapes are schematic architectural concepts, not photogrammetric replicas. Actual per-ride fidelity needs original glTF model authoring and source-checked map footprints/entrances.
- Camera-guided navigation is still a beta visual prototype, not walking directions.
- Production v1.2 must remain untouched until explicit user approval.