import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

export const TORONTO = { latitude: 43.6532, longitude: -79.3832 };
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

/** Scrapbook palette: a faint pencil-and-watercolour sketch on off-white paper. */
const PAPER = "#fcfbf8";
const WATER = "#c2e0ea";
const PARK = "#d6ebc8";
const PENCIL = "#b9bcc0";
const INK = "#6b7078";

// Only these survive; everything else (buildings, paths, rail, highway shields, POIs…) is dropped.
const KEEP = new Set([
  "background", "park", "water", "landcover_wood",
  "highway_minor", "highway_major_inner", "highway_motorway_inner",
  "water_name_point_label", "highway-name-minor", "highway-name-major",
  "label_other", "label_city", "label_city_capital",
]);

function scrapbookLayer(layer: LayerSpecification): LayerSpecification {
  const l = structuredClone(layer) as LayerSpecification & { paint?: Record<string, unknown>; layout?: Record<string, unknown> };
  switch (l.id) {
    case "background":
      l.paint = { "background-color": PAPER };
      break;
    case "water":
      l.paint = { "fill-color": WATER, "fill-outline-color": "#a8c0c8" };
      break;
    case "park":
    case "landcover_wood":
      l.paint = { "fill-color": PARK, "fill-opacity": 0.7 };
      break;
    case "highway_minor":
      l.paint = {
        "line-color": PENCIL,
        "line-opacity": 0.35,
        "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.4, 17, 1.2],
      };
      break;
    case "highway_major_inner":
    case "highway_motorway_inner":
      // A light pencil line for the main roads, so the city still has a shape.
      l.paint = {
        "line-color": PENCIL,
        "line-opacity": 0.7,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 16, 1.6],
      };
      break;
    default:
      if (l.type === "symbol") {
        const street = l.id.startsWith("highway");
        l.layout = { ...l.layout, "icon-image": "", "text-font": ["Noto Sans Italic"], "text-letter-spacing": street ? 0.05 : 0.15 };
        const color = l.id.startsWith("water") ? "#5f8592" : street ? "#868b92" : INK;
        l.paint = { "text-color": color, "text-halo-color": PAPER, "text-halo-width": 1.5 };
      }
  }
  return l;
}

// The base style only greens big protected areas ("park" source layer). City parks like Christie Pits
// are grass in "landcover", and fields/playgrounds are in "landuse", so they get their own wash.
const GREEN_SPACES: LayerSpecification[] = [
  {
    id: "green_grass",
    type: "fill",
    source: "openmaptiles",
    "source-layer": "landcover",
    filter: ["==", ["get", "class"], "grass"],
    paint: { "fill-color": PARK, "fill-opacity": 0.7 },
  },
  {
    id: "green_landuse",
    type: "fill",
    source: "openmaptiles",
    "source-layer": "landuse",
    filter: ["match", ["get", "class"], ["pitch", "playground", "cemetery", "park"], true, false],
    paint: { "fill-color": PARK, "fill-opacity": 0.7 },
  },
];

let cached: Promise<StyleSpecification> | undefined;

/** The base style, stripped and recoloured to look like a watercolour sketch. Fetched once per page load. */
export function loadScrapbookStyle(): Promise<StyleSpecification> {
  cached ??= fetch(MAP_STYLE)
    .then((r) => r.json() as Promise<StyleSpecification>)
    .then((style) => {
      const [background, ...rest] = style.layers.filter((l) => KEEP.has(l.id)).map(scrapbookLayer);
      return { ...style, layers: [background, ...GREEN_SPACES, ...rest] };
    })
    .catch((err) => {
      cached = undefined;
      throw err;
    });
  return cached;
}
