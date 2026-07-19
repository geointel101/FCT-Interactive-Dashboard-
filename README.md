# FCT Abuja Urban Infrastructure Dashboard

An interactive, vector-tiled web map of the Federal Capital Territory (FCT), Abuja, built on authoritative ArcGIS Pro data and rendered with MapLibre GL JS. The dashboard brings together administrative boundaries, transport infrastructure, land use, social facilities, and building footprints in a single, fast-loading interface designed for planning and infrastructure monitoring use cases.

**[View Live Map](#)** · https://geointel101.github.io/FCT-Interactive-Dashboard-/fct-smart-city-dashboard(3)/

---

## Overview

This project maps core urban infrastructure across the FCT at territory scale, giving planners, researchers, or the public a single interface to explore administrative boundaries, roads and rail, land use, and social infrastructure — down to individual building footprints. The dashboard is built on a vector-tile pipeline rather than a flat web map, so it stays fast and lightweight even with nearly 570,000 mapped features.

## Objective

To design an interactive web map that allows users to:
- Visualize administrative boundaries at FCT and ward level
- Assess transport infrastructure — road network and rail lines
- Locate and audit social infrastructure: schools, health facilities, water points, and service centers
- Explore land use, natural features, settlements, and building footprints across the territory

## Data & Layers

| Layer | Description | Features |
|---|---|---|
| FCT Boundary | Outer administrative boundary of the Federal Capital Territory | 1 |
| Wards | Ward-level administrative subdivisions | 87 |
| Road Network | Primary, secondary, and local road infrastructure, classified by functional type | 61,907 |
| Railways | Rail transit lines, including ARMT (Abuja Rail Mass Transit) routes | 181 |
| Schools | Point locations with category, management type, and ward attribution | 1,227 |
| Health Facilities | Point locations with type, category, and functional status | 574 |
| Water Facilities | Point locations with type, community, and functional/breakdown status | 1,245 |
| Service Centers | General service point locations | 1,147 |
| Land Use | Zoning and land use classification polygons (23 use types) | 1,130 |
| Natural Features | Rivers, forest, and parkland | 176 |
| Settlements | Named settlement points across the territory | 356 |
| Building Footprints | Individual building polygons | 506,851 |

Source data was prepared in ArcGIS Pro from authoritative shapefiles, each carrying its own attribute schema — ward names and urban status, facility category and functional condition, land use classification, and building type.

**Data sources by layer:**
- **FCT Boundary** — digitized directly from basemap imagery in ArcGIS Pro
- **Schools, Health Facilities, Water Facilities, Wards, Settlements** — sourced from [Dateno](https://dateno.io/), a dataset search engine
- **Road Network, Railways, Land Use, Natural Features, Service Centers, Building Footprints** — sourced from OpenStreetMap

## Tools & Technologies

- **ArcGIS Pro** — source data preparation and attribute management
- **GDAL / ogr2ogr** — format conversion and coordinate system handling
- **Shapely** — targeted geometry simplification
- **Tippecanoe** — vector tile generation from GeoJSON
- **PMTiles** — single-file vector tile archive, served over HTTP Range requests with no tile server required
- **MapLibre GL JS** — GPU-accelerated vector rendering
- **CARTO Positron** — basemap tile layer

## Key Features

- **Vector-tiled delivery** — nearly 570,000 features served as a single PMTiles archive; only the tiles for the current view are ever fetched, keeping load times fast regardless of total dataset size
- **Categorized symbology** — each layer group (administrative, transport, facilities, land & natural, buildings) uses a deliberate, distinct color; roads are styled by functional class from motorway down to residential
- **Live stats panel** — feature counts per layer shown directly in the UI
- **Grouped, toggleable legend** — layer control organized by category with color-coded swatches and counts
- **Interactive popups** — feature-level attribute detail on click, using cleaned labels from the source schema
- **Coordinate and zoom readout** — live lat/lon and zoom level under the cursor
- **Tile-loading indicator** — a subtle in-map cue when new tiles are being fetched during pan/zoom

## Engineering Notes: Handling Scale

Building footprints (506,851) and the road network (61,907 segments) sit at a very different scale from the facility and administrative layers (a few thousand features total). Tiling all layers together let the densest layers dominate tippecanoe's automatic feature-dropping, which meant sparse but important point data — schools, health facilities — could disappear at low zoom in dense urban tiles.

The fix was architectural: each layer group is built as its own isolated tileset — points with zero feature-dropping ever permitted, roads with zoom-adaptive simplification, and buildings across an explicit zoom 13–16 range — then merged into a single archive with `tile-join`. This was verified directly by decoding tile bytes at multiple zoom levels and locations rather than relying on visual inspection alone, confirming every layer renders at every zoom, including in the densest part of the city center.

## Repository Structure

```
fct-urban-infrastructure-dashboard/
├── index.html            # Dashboard shell
├── css/style.css         # Design system
├── js/app.js             # MapLibre GL logic, layers, legend, popups
├── data/basemap.pmtiles  # All layers as vector tiles
├── vendor/                # MapLibre GL + PMTiles libraries
├── serve.py               # Local dev server with HTTP Range support
└── README.md
```

## How to View

**Locally:** run `python3 serve.py` from inside the folder and open `http://localhost:8000`. PMTiles requires a server that supports HTTP Range requests — Python's built-in `python3 -m http.server` does not support these, so `serve.py` is included as a drop-in replacement for local testing.

**Live:** deploy the folder as-is to GitHub Pages for a public link — GitHub Pages supports Range requests natively, so the dashboard works out of the box with no additional configuration.

## Author

**Kenneth** — GIS Analyst, Abuja, Nigeria
B.Sc. Geography and Natural Resources Management, University of Uyo (2022)
