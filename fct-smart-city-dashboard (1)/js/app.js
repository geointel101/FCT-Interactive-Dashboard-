const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const PMTILES_URL = "pmtiles://./data/basemap.pmtiles";

const COLORS = {
  admin: "#8891a0",
  boundary: "#14181c",
  road: "#6b7683",
  rail: "#3a4048",
  landuse: "#8a9a5b",
  natural: "#4c8c5b",
  settlement: "#c9ae8c",
  schools: "#8b6fd1",
  health: "#e1614f",
  water: "#2e9cb3",
  service: "#d9a441",
};

// Known feature counts (from source dataset)
const COUNTS = {
  fct_boundary: 1,
  wards: 87,
  road_network: 61907,
  railways: 181,
  land_use: 1130,
  natural_features: 176,
  settlements: 356,
  schools: 1227,
  health_facilities: 574,
  water_facilities: 1245,
  service_centers: 1147,
};

const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    sources: {
      basemap: {
        type: "raster",
        tiles: [
          "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors',
      },
      fct: {
        type: "vector",
        url: PMTILES_URL,
      },
    },
    layers: [
      { id: "basemap", type: "raster", source: "basemap" },

      // Land use / natural / settlements (fills, bottom of data stack)
      {
        id: "land_use",
        type: "fill",
        source: "fct",
        "source-layer": "land_use",
        paint: { "fill-color": COLORS.landuse, "fill-opacity": 0.25 },
      },
      {
        id: "natural_features",
        type: "fill",
        source: "fct",
        "source-layer": "natural_features",
        paint: { "fill-color": COLORS.natural, "fill-opacity": 0.3 },
      },
      {
        id: "settlements",
        type: "fill",
        source: "fct",
        "source-layer": "settlements",
        paint: { "fill-color": COLORS.settlement, "fill-opacity": 0.25 },
      },

      // Wards (admin)
      {
        id: "wards",
        type: "line",
        source: "fct",
        "source-layer": "wards",
        paint: { "line-color": COLORS.admin, "line-width": 0.8, "line-dasharray": [2, 2] },
      },

      // Roads, graded by class
      {
        id: "road_network",
        type: "line",
        source: "fct",
        "source-layer": "road_network",
        paint: {
          "line-color": COLORS.road,
          "line-width": [
            "match",
            ["get", "type"],
            "motorway", 2.6,
            "trunk", 2.2,
            "primary", 1.8,
            "secondary", 1.4,
            "tertiary", 1.1,
            0.5,
          ],
          "line-opacity": 0.85,
        },
      },

      // Railways
      {
        id: "railways",
        type: "line",
        source: "fct",
        "source-layer": "railways",
        paint: {
          "line-color": COLORS.rail,
          "line-width": 1.6,
          "line-dasharray": [1, 1.4],
        },
      },

      // FCT boundary
      {
        id: "fct_boundary",
        type: "line",
        source: "fct",
        "source-layer": "fct_boundary",
        paint: { "line-color": COLORS.boundary, "line-width": 2.2 },
      },

      // Facility points
      {
        id: "schools",
        type: "circle",
        source: "fct",
        "source-layer": "schools",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 2, 16, 6],
          "circle-color": COLORS.schools,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 0.6,
        },
      },
      {
        id: "health_facilities",
        type: "circle",
        source: "fct",
        "source-layer": "health_facilities",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 2, 16, 6],
          "circle-color": COLORS.health,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 0.6,
        },
      },
      {
        id: "water_facilities",
        type: "circle",
        source: "fct",
        "source-layer": "water_facilities",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 2, 16, 6],
          "circle-color": COLORS.water,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 0.6,
        },
      },
      {
        id: "service_centers",
        type: "circle",
        source: "fct",
        "source-layer": "service_centers",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 2, 16, 6],
          "circle-color": COLORS.service,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 0.6,
        },
      },
    ],
  },
  center: [7.35, 9.05],
  zoom: 9.3,
  attributionControl: true,
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

// ---------- Coordinate readout ----------
const coordEl = document.getElementById("coord-readout");
map.on("mousemove", (e) => {
  coordEl.textContent = `${e.lngLat.lat.toFixed(4)}°N, ${e.lngLat.lng.toFixed(
    4
  )}°E   ·   z${map.getZoom().toFixed(1)}`;
});
map.on("zoom", () => {
  const c = map.getCenter();
  coordEl.textContent = `${c.lat.toFixed(4)}°N, ${c.lng.toFixed(
    4
  )}°E   ·   z${map.getZoom().toFixed(1)}`;
});

// ---------- Popups on click for facility points ----------
const FACILITY_LAYERS = {
  schools: "School",
  health_facilities: "Health Facility",
  water_facilities: "Water Facility",
  service_centers: "Service Center",
};

Object.keys(FACILITY_LAYERS).forEach((layerId) => {
  map.on("click", layerId, (e) => {
    const f = e.features[0];
    new maplibregl.Popup({ offset: 8 })
      .setLngLat(e.lngLat)
      .setHTML(
        `<div class="popup-title">${FACILITY_LAYERS[layerId]}</div>` +
          `<div class="popup-meta">${f.geometry.coordinates[1].toFixed(
            5
          )}, ${f.geometry.coordinates[0].toFixed(5)}</div>`
      )
      .addTo(map);
  });
  map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));
});

// Ward click popup
map.on("click", "wards", (e) => {
  const p = e.features[0].properties;
  new maplibregl.Popup({ offset: 8 })
    .setLngLat(e.lngLat)
    .setHTML(
      `<div class="popup-title">${p.Ward_Name || "Ward"}</div>` +
        `<div class="popup-meta">LGA: ${p.LGA_name || "—"}<br>Urban status: ${
          p.urban || "—"
        }</div>`
    )
    .addTo(map);
});

// ---------- Layer toggles ----------
document.querySelectorAll(".layer-row input[type=checkbox]").forEach((box) => {
  box.addEventListener("change", () => {
    const layerId = box.dataset.layer;
    map.setLayoutProperty(
      layerId,
      "visibility",
      box.checked ? "visible" : "none"
    );
  });
});

// ---------- Stats fill ----------
document.querySelectorAll("[data-count]").forEach((el) => {
  const key = el.dataset.count;
  if (COUNTS[key] !== undefined) {
    el.textContent = COUNTS[key].toLocaleString();
  }
});

// ---------- Mobile sidebar toggle ----------
const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.querySelector(".sidebar-toggle");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
}
