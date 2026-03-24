import app from "./app";
import { logger } from "./lib/logger";
import { seedIfEmpty } from "./lib/seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Open the port immediately so deployment health checks pass,
// then seed the database in the background (non-blocking).
app.listen(port, () => {
  logger.info({ port }, "Server listening");

  seedIfEmpty().catch((err) => {
    logger.error({ err }, "Background seed failed (non-fatal)");
  });
});
