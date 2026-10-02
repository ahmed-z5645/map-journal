// Connection settings for local mode (see scripts/local.ts). Not secrets.
export const LOCAL_ENV = {
  DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable",
  R2_ENDPOINT: "http://127.0.0.1:54569",
  R2_ACCOUNT_ID: "local",
  R2_ACCESS_KEY_ID: "S3RVER",
  R2_SECRET_ACCESS_KEY: "S3RVER",
  R2_BUCKET: "postcards",
  SESSION_SECRET: "local-mode-only-not-a-real-secret",
};
