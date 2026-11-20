# Worldscope 3D park-atlas roadmap (v2.0)
Status: experimental / development, not a full Disney 3D recreation.

## Implemented in v2.0
- 28 mapped attraction feature locations drawn with MapLibre GeoJSON circle and symbol layers rather than individual laggy HTML markers.
- Main map still offers Color, HD Aerial and USGS, with 3D landmarks enabled independently.
- Three.js uses one georeferenced WebGL custom layer for seven original illustrative landmark studies.
- Spaceship Earth uses a round, smoothly tessellated geodesic sphere with a triangular grid, six support legs and scale based on a roughly 50-m diameter. D23 describes the geosphere as 165 ft in diameter and about 180 ft tall overall: https://d23.com/a-to-z/spaceship-earth/
- Other original concept silhouettes: Cinderella Castle, Space Mountain, TRON canopy, Tower of Terror, Tree of Life and Pandora rockscape.
- Models are opt-in. If the Three.js library is unavailable, the ordinary map remains usable.
- This version is NOT a photorealistic 3D model of all rides; most content locations are still not individually modeled or verified guest entrances.

## Path to full Walt Disney World 3D
1. Inventory every requested attraction, park, correct building footprint and verified guest entrance. Of the 246 directory records, 28 have individually mapped geographic coordinates.
2. Commission or create original rights-cleared models (Blender -> optimized glTF/GLB), one per attraction; do not extract proprietary geometry from Google Maps/Earth, Disney apps or unlicensed game files.
3. Add a model manifest with coordinates, rotation, scale, dimensions, source, render LOD, and confidence. Keep models in separate downloadable chunks rather than one massive map file.
4. Optimize phones with lower LOD at distance, compression, KTX2 textures, visibility-based loading and separate 3D on/off controls. Test GPU memory and heat.
5. Verify geometry, surfaces, map alignment, mobile frame rate and attraction entrances with a seven-landmark pilot before scaling to dozens of rides.
6. Test licensed photorealistic imagery as a separate provider pilot: Google 3D Maps in Maps JavaScript or Google Photorealistic 3D Tiles. Requires Google Maps Platform account, billing, a referrer-restricted key, attribution and a real Magic Kingdom/EPCOT coverage check: https://developers.google.com/maps/documentation/javascript/3d/coverage
7. Do not use decorative 3D mesh positions as pedestrian walking-route geometry. Route correctness requires a separate guest-walkway network.

## Required QA before family release
- Native MapLibre pins remain geo-anchored without DOM lag through pan, zoom, color, HD Aerial and USGS mode changes.
- 3D remains off on first load and graceful fallback works when Three.js is blocked.
- Safari/iPhone and Chrome/Android WebGL tests, route overlays and responsiveness checked on live devices.
- Keep all changes on preview until the user explicitly approves promotion.
