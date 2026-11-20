# Worldscope v2.2 — QA and verified limitations

Release scope: development branch plus isolated `/preview/` files. The homepage remains v1.2.

## Changes
- Replaced v2.1's generic castle cylinders and boxes with layered wings, windows, parapet details, several spires and more visible blue roofs.
- Space Mountain: ribbed conical roof with sixteen raised supports and a central spire.
- TRON: separate curved gridded canopy surface rather than a floating oval/sphere.
- Spaceship Earth: dimensional geodesic sphere, support columns, rings.
- Tree of Life: woody branches and smaller, clustered foliage.
- Pandora: angular floating rock mass shapes and vine connections instead of four spherical blobs.
- Tower of Terror: extra vertical facades and small roof spires.
- All model meshes remain original *illustrative* geometry rather than exact replicas.
- New category filter for directions, covering all directory types including rides, shops, food and bars. Unmapped selections receive official Disney navigation links and do not create false walking paths.

## Tests executed before preview publish
- `node --check` passed for the replacement WebGL and directions scripts.
- Chromium real WebGL rendering (isolated map-camera harness) passed at 1280×720 and 390×844: geosphere, castle and pan/center changes; zero page JavaScript errors.
- Chromium 1280×720 landmark gallery: all seven independent models rendered without runtime errors.
- Browser directions tests at 390-pixel and 1280-pixel widths passed using a synthetic 246-entry directory. Mapped ride/shop selections activated the route planner; unmapped food and bars blocked false routes and supplied official navigation links. All four sample categories tested.
- Mesh regression: all seven models have valid finite vertices; all use fewer than 65,535 vertices, fitting Uint16 WebGL index buffers. Example counts: castle 9,120 vertices; Space Mountain 3,548; canopy 7,856; Tree of Life 17,324.
- GitHub scripts are configured to rerun geometry/syntax checks on the development branch.

## Unverified / limitations
- Real Apple Safari/iPhone GPU performance is not verified.
- External map tiles, the live route engine and phone geolocation could not be reached in the isolated test environment; browser tests used a simulated map and routing responses.
- 246 directory records exist, but only 28 have individually mapped coordinates. Categories Food 1 of 68, Shops 3 of 56, Alcohol 0 of 25 mapped; the rest need precise locations before Worldscope can generate valid paths. This version does not guarantee full turn-by-turn navigation to every entry.
- Complete ride-specific photorealistic 3D is not available yet. Seven landmarks are procedural illustrated models, not detailed accurate GLB recreations.
- User must confirm the actual preview on their phone before promoting a version.

## Source references used during visual work
- [Disney Cinderella Castle, 189 ft](https://disneyworld.disney.go.com/attractions/magic-kingdom/cinderella-castle/)
- [Disney Parks castle towers and spires](https://disneyparksblog.com/wdw/walt-disney-world-memories-cinderella-castle-through-the-years/)
- [Disney Spaceship Mountain conical shape](https://disneyparksblog.com/wdw/peak-perfection-space-mountain-at-walt-disney-world-celebrates-50-years/)
- [Disney TRON curved wave canopy](https://disneyexperiences.com/disneyworld-press/release/enter-the-grid-as-tron-lightcycle-run-presented-by-enterprise-opens-april-4-2023-at-walt-disney-world/)
- [Disney Imagineering Pandora floating mountains](https://sites.disney.com/waltdisneyimagineering/pandora-the-world-of-avatar/)
- [Disney app supports dining and shop directions](https://plandisney.disney.go.com/question/interactive-map-632337/)
