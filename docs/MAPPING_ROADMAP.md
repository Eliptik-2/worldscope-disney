# Worldscope Mapping and Navigation Roadmap
Updated: 2026-11-17. Branch: development. Preview: /worldscope-disney/preview/

## Current v1.5 behavior
- Full-viewport interactive map with left Explore and right Directions drawers, each collapsible.
- All 246 directory entries searchable in Explore.
- Seven original low-detail miniatures are **off by default** because they do not resemble realistic park architecture. Vector buildings may still be tilted.
- ONLY draw pedestrian paths returned by the experimental OpenStreetMap/Valhalla service when their length and geometry pass sanity checks. No direct-line/dashed-line shortcuts are displayed as walking directions.
- If route data is missing or looks implausible, show **no route** and direct the user to My Disney Experience → desired attraction → Get Directions.
- Queue entrances are *not* verified. Most mapped feature coordinates are centroids or landmark locations, not guest-facing entrance pins.
- Published homepage remains v1.2; preview updates do not change it.

## Provider comparison
1. **Disney My Disney Experience** — authoritative visitor app for Disney in-park navigation, walking/transit guidance and park-specific changes. Disney doesn't publicly document an embeddable route API for third-party websites. Use a clearly labeled handoff, not scraped/copy-pasted proprietary map tiles. Docs:
https://disneyworld.disney.go.com/guest-services/my-disney-experience/mobile-apps/
https://plandisney.disney.go.com/question/interactive-map-632337/

2. **OpenStreetMap + Valhalla** — no paid account for demonstration, supports pedestrian routing, MapLibre renders the result. Walking graph may omit park paths and rides are not mapped to guest entrances. Public demonstration endpoint cannot be relied upon for a vacation navigation service. A park walkway/queue entrance dataset is needed to improve accuracy.

3. **Mapbox GL JS + Directions API** — styled terrain, smoother 3D building renderings and a dedicated pedestrian routing profile; API token, billing/account, terms, quota and coverage evaluation required. More attractive buildings do NOT guarantee named Disney ride models. https://docs.mapbox.com/api/navigation/directions/ ; https://www.mapbox.com/pricing

4. **Google Maps JavaScript 3D Maps or Google Photorealistic 3D Tiles + CesiumJS** — strongest candidate for realistic real-world scenery if local coverage is adequate. Requires Google Maps Platform project, billing, an appropriately restricted API key and usage quotas, plus compliant map attribution. Confirm actual Disney coverage with a tiny prototype before migrating; check mobile GPU and loading cost.
https://developers.google.com/maps/documentation/javascript/3d/overview
https://developers.google.com/maps/documentation/javascript/3d/coverage
https://developers.google.com/maps/documentation/tile/3d-tiles
https://developers.google.com/maps/billing-and-pricing/pricing

5. **Original Blender/glTF landmark assets** — can be precise and styled but need separately produced and optimized 3D models, vetted references, lightweight meshes and material/texture LODs; never copy proprietary artwork or 3D data without a license.

## Next engineering tasks
- Verify guest entrances for TRON, Space Mountain, Peter Pan's Flight and the top ~30 attractions, with source and confidence metadata.
- Prototype a real park-internal walking graph using permissibly sourced OSM footways (pedestrian-only), validate against route photos and in-person user reports, and flag closures as unknown.
- Add a small routing provider diagnostic screen: origin, destination, direct meters, route meters, why a route was rejected (do not expose private GPS history).
- Prototype Google 3D around Magic Kingdom, evaluate actual coverage, load time and visible ride facades, then compare to Mapbox streets in a mobile A/B test.
- Preserve a reliable, fast 2D fallback for poor reception.
- Do not put unrestricted API keys in this public GitHub repository.

## QA performed (isolated browser)
2026-11-17: Chromium static-browser at 390×844 and 1440×900.
- 246 directory records loaded via local fixture
- full-screen map container occupied the viewport
- Explore drawer opened; TRON query returned result
- Directions drawer opened and closed Explore
- exiting restored normal map layout
- no JavaScript page errors with mocked data; JavaScript syntax checks passed.
**Not yet live-verified:** real map tiles, Cesium/Three WebGL graphics, route provider response, live geolocation and Safari/iOS behavior. Do not interpret passing isolated tests as confirmed real-world walking safety.
