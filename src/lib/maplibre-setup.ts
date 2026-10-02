// Import before rendering any map. See scripts/copy-maplibre-worker.mjs.
import { setWorkerUrl } from "maplibre-gl";

if (typeof window !== "undefined") setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
