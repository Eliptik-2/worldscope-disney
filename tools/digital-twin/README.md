# Worldscope Digital Twin — Architecture Lab

This is an independent development viewer and data pipeline. It does not modify Worldscope's existing v2.6 preview or the v1.2 family site. The architecture lab is not a guest navigation map.

## Try the viewer locally

Open `viewer/index.html` in a browser and select **Import scene**, then choose `synthetic-scene.json`. The synthetic scene contains five artificial structures to exercise the rendering engine. These are not Disney buildings or a preview of actual Disney coverage. The live GPU path uses WebGL; a depth-sorted software fallback can display smaller scenes if WebGL is disabled. The fallback can have overlap/sorting artifacts.

The renderer supports drag to orbit, shift-drag to pan, pinch or wheel to zoom, flat/3D switching, and inspection of a selected building's source ID and reported height.

## Generate geographically grounded scenes

Use the Worldscope development branch's digital twin acquisition workflow to obtain source data. The prior `tools/digital-twin/prepare-buildings.mjs` normalizes actual Overture Maps building footprints and parts. Given its `architecture.geojson` output:

```sh
python -m pip install 'shapely>=2.1,<3'
python build_scene.py /path/to/architecture.geojson viewer/scenes
python -m http.server 8000 --directory viewer
```

Open `http://localhost:8000` to choose an available park study area. Alternatively, import one generated scene JSON. No API key or paid imagery service is used by the viewer.

The pipeline produces separate study scenes for Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom, Disney Springs, BoardWalk/Crescent Lake, and the wider resort study rectangle. The windows are approximate, not verified Disney property boundaries, and can include adjacent land. They do not establish the location of every ride and shop. Overture data is distributed under the ODbL; retain original source credits, IDs and acquisition metadata. See https://docs.overturemaps.org/guides/buildings/ and https://docs.overturemaps.org/attribution/.

## Fidelity and provenance

- Source geometry is used for plan shapes, including courtyard holes and disjoint polygons. Reported heights are not survey measurements.
- Building parts replace the parent only when their union covers at least 95% of the parent and part heights are present. Otherwise the parent massing remains.
- A simple gabled roof is reconstructed only when the source supplies a gable type, roof height, and ridge direction or orientation and the footprint is approximately rectangular. Other roof forms remain flat, unverified massing.
- Missing or invalid height data stays unknown. Unknown-height geometry appears as a flat footprint, not an invented building height.
- The viewer does not include official Disney architectural drawings, independently measured LiDAR heights, photorealistic textures, terrain, actual detailed ride vehicles/tracks, individually verified store identities or entrances, or pedestrian routing.
- Measured terrain, model-specific references and manual geometry work are still required for the full architectural digital twin. Verify the real-data coverage report before treating the scenes as geographically complete.

## Test evidence

`tests/test_scene.py` passed two automated geometry test cases covering gabled roofs, courtyards, missing/invalid heights, exclusion of an unrelated feature, mesh buffer integrity, and parent/part coverage. `tests/test_browser.py` passed in Chromium at 1280×720, 390×844 and 320×640 using the software fallback, with successful scene import, mode switching, rotation, zoom and drag, and nonblank rendered pixels. The local environment blocked WebGL and external geographic-data downloads. No live Disney source dataset was acquired or rendered in this environment. Real GPU performance, mobile Safari, actual geographic coverage, and architectural fidelity are unverified.
