// MapLibre v6 loads its web worker from a URL next to its own module, which doesn't
// exist once Next bundles it. Serve the worker (and the chunk it imports) from public/.
import { copyFileSync, mkdirSync } from "node:fs";

const src = "node_modules/maplibre-gl/dist";
const dest = "public/maplibre";
mkdirSync(dest, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(`${src}/${file}`, `${dest}/${file}`);
