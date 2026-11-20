# Worldscope v2.1 QA — 2026-11-20

## Tested directly
- Direct WebGL geodesic Spaceship Earth and castle geometry.
- **Chromium 144 with software WebGL via Xvfb, not a mock renderer**, at 1280 × 720 and 390 × 844 viewports.
- Sphere appeared after enabling 3D; castle appeared after switching camera center.
- Geometry buffers separated per landmark. During initial testing, a shared mesh builder accumulated previous landmarks, causing a sphere to overlay the castle. **This was fixed by resetting vertex/index buffers for every shape** and the browser screenshots were retested.
- No page-level JavaScript errors in the isolated hardware/software WebGL test.
- Pan/camera updates caused subsequent WebGL frames (measured frame counter); 3D transformations were recalculated with the new camera matrix.
- WebGL shaders compiled and linked, and actual drawElements ran for 7 separate models.
- Independent smoke test against deployed development JavaScript: seven model draw calls, independent geometry sizes, native GeoJSON circle and symbol layers, 3D toggle off removes the model layer.
- Old v2.0 Three.js module is no longer loaded in development or preview.
- Preview updated to v2.1; root production homepage verified still v1.2.

## Not yet validated on a real guest phone
- Actual GitHub Pages deployment response and render in Chrome Mobile/Safari.
- Real external OpenFreeMap / Esri / USGS tile downloads or provider outages.
- Geographical alignment against high-resolution in-park imagery for every ride.
- Mobile GPU overheating or slow network performance, particularly on older phones.
- Correct queue entrance positions and exact Disney walking routes (separate from artistic 3D).

## Honest scope
- **Seven original stylized concept meshes**, including a round Spaceship Earth. These are NOT a full photorealistic model of all attractions.
- **28 of 246 directory features** currently have geographic coordinates; remaining attractions are searchable in the directory, not represented as precise map pins.
- Map-native small circles/labels deliberately avoid giant obstructive floating markers.
- More landmarks and precise ride footprints must be acquired/verified before 'all rides modeled' can be considered complete.

## Acceptance tests for user (only those requiring real device/network)
1. On preview, choose Map > 3D ON > EPCOT / Spaceship Earth. Confirm sphere actually appears, is round, and stays anchored when dragging.
2. Choose Cinderella Castle. Drag/rotate/zoom and check for flickering or geometry mixing.
3. Toggle 3D off; the satellite map and bus + walk overlays should remain.
4. At zoom 17+, attraction labels should be small and follow the map smoothly.
