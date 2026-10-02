// `npm run local`: runs the whole app with no accounts — an embedded Postgres (PGlite)
// and an S3-compatible stand-in for R2, both storing data in .local/.
// Log in with the password "postcards" (or set LOCAL_PASSWORD).
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import S3rver from "s3rver";
import { hashPassword } from "../src/lib/password";
import { LOCAL_ENV } from "./local-env";

const PORTS = { app: 3000, postgres: 55432, storage: 54569 };

function portInUse(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = createServer()
      .once("error", () => resolve(true))
      .once("listening", () => server.close(() => resolve(false)))
      .listen(port, "127.0.0.1");
  });
}

// A second copy would crash opening the locked database, so stop early with a clear message.
const busy = [];
for (const [name, port] of Object.entries(PORTS)) if (await portInUse(port)) busy.push(`${port} (${name})`);
if (busy.length > 0) {
  console.error(`\nCan't start: port ${busy.join(", ")} already in use.`);
  console.error(`Local mode is probably already running — open http://localhost:${PORTS.app}, or stop the other copy.`);
  console.error(`To find it: lsof -iTCP:${PORTS.postgres} -sTCP:LISTEN\n`);
  process.exit(1);
}

mkdirSync(".local/s3", { recursive: true });

let pg: PGlite;
try {
  pg = await PGlite.create(".local/pg");
} catch {
  // Usually a previous run was killed without shutting down; PGlite can't recover that.
  console.error(`\nCouldn't open the local database in .local/pg (it probably wasn't shut down cleanly).`);
  console.error(`Run \`npm run local:reset\` to start fresh, then \`npm run local\` and \`npm run seed:local\`.\n`);
  process.exit(1);
}
const pgServer = new PGLiteSocketServer({ db: pg, port: PORTS.postgres, host: "127.0.0.1", maxConnections: 20 });
await pgServer.start();

const storage = new S3rver({
  port: PORTS.storage,
  address: "127.0.0.1",
  silent: true,
  directory: ".local/s3",
  configureBuckets: [{ name: LOCAL_ENV.R2_BUCKET, configs: [] }],
});
await storage.run();

const pool = new Pool({ connectionString: LOCAL_ENV.DATABASE_URL, max: 1 });
await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
await pool.end();

const password = process.env.LOCAL_PASSWORD ?? "postcards";
console.log(`\nLocal database and photo storage are up (data in .local/).`);
console.log(`Open http://localhost:${PORTS.app} and log in with: ${password}`);
console.log(`Stop with Ctrl+C — that closes the database cleanly.\n`);

const next = spawn("npx", ["next", "dev", "-p", String(PORTS.app)], {
  stdio: "inherit",
  env: { ...process.env, ...LOCAL_ENV, APP_PASSWORD_HASH: hashPassword(password) },
});

// PGlite's data dir can't survive being killed mid-write, so every way out closes it first.
let shuttingDown = false;
async function shutdown(code: number) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (next.exitCode === null) next.kill("SIGTERM");
  await pgServer.stop().catch(() => {});
  await storage.close().catch(() => {});
  await pg.close().catch(() => {});
  process.exit(code);
}

next.on("exit", (code) => void shutdown(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.on(sig, () => void shutdown(0));
