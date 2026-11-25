# Worldscope — architectural digital twin lab

Status: data acquisition and validation foundation, not a finished 3D render. The current v2.6 preview and v1.2 family site remain unchanged.

## Target
All four theme parks, Disney Springs, the BoardWalk and resort hotel/transportation areas: geographically placed building footprints and parts; accurate roof profiles, measured or source-reported heights, original or properly licensed detailed façades and ride structures; guest-accessible navigation kept separate from decorative geometry.

## Sources and licensing
- Overture Maps Foundation Buildings (building and building_part): https://docs.overturemaps.org/guides/buildings/ — ODbL 1.0. Retain feature IDs, source metadata, source versions, and attribution; review per-source credits at https://docs.overturemaps.org/attribution/ before distribution. Geometry may be a roofprint rather than the actual foundation.
- USGS 3DEP lidar point clouds and elevation: https://www.usgs.gov/3d-elevation-program/ — public domain. Next acquisition step: verify collection date, resolution, coverage, and vertical datum in the resort before estimating heights from ground and surface returns.
- Google Photorealistic 3D Tiles: https://developers.google.com/maps/documentation/tile/3d-tiles-overview — optional separate licensed viewer only after coverage, pricing, API key restrictions and attribution review. No scraping, reconstruction or unauthorized caching of Google imagery. Not used by this lab.
- Architectural details: original models from permitted reference photographs and documented public dimensions; do not copy proprietary models or claim official survey accuracy.

## Current implementation
tools/digital-twin/prepare-buildings.mjs validates source polygons and building parts, retains roof/material/height metadata, and reports directory-to-footprint candidates. Unknown heights stay unknown. A point within a footprint is only a candidate requiring human or independent source verification; it does not establish the building identity or guest entrance. No invented ride placement.

The study rectangle (-81.66, 28.30, -81.50, 28.45) is a preliminary acquisition window, not a verified Disney boundary. It includes neighboring land and must be clipped to the actual resort boundary before any park-only render.

The GitHub Actions lab downloads the open source geometry and creates a private-to-repository-access artifact subject to the repository's access settings, not an automatic deployment. It has a 20-minute timeout and no paid mapping API. The acquisition has not been verified in the current chat environment, which cannot resolve external data hosts. Synthetic importer fixtures passed 11 assertions. No live building counts or render quality are claimed.

## Release gates
1. Acquire actual footprint and building-part data; verify coverage, geometry validity, correct attribution and acquisition date; clip to verified resort boundary.
2. Establish source-reported vs estimated vs unknown height classes. Compare with available LiDAR and documented dimensions, with explicit uncertainty. Associate ride and shop identities and entrances only with evidence.
3. Build park-by-park roof and façade meshes and maintain a per-model reference/provenance register. Prioritize Main Street, Cinderella Castle, Spaceship Earth, Space Mountain, TRON, Pandora and the World Showcase. Extend to every ride, shop, resort, stand and outdoor area as data permits.
4. Export optimized GLB/3D Tiles assets, geographically anchored with level-of-detail streaming, culling, memory budgets and mobile fallback. Preserve routes and small labels, no duplicate gray geometry.
5. Test actual WebGL rendering, layer toggles, touch/rotate/zoom, route persistence, destination selection, fullscreen controls, and camera permission cleanup on desktop and mobile. Clearly report live service and physical device limitations. Never promote a model concept as a verified replica.

## Data handling
Run the workflow in the development branch. Inspect the artifact coverage report before integrating any source geometry into a preview. No modifications to the family-facing homepage without explicit approval.
