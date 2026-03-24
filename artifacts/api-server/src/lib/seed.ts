import { readFile } from "fs/promises";
import path from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Seeds the database on first boot.
 * Reads scripts/seed.sql (relative to process.cwd() = workspace root),
 * strips Replit-specific psql meta-commands, and executes all INSERT
 * statements inside a single transaction via the raw pg Pool.
 *
 * Idempotent: exits immediately if the airlines table is already populated.
 */
export async function seedIfEmpty(): Promise<void> {
  const { rows } = await pool.query<{ cnt: string }>(
    "SELECT COUNT(*) AS cnt FROM airlines",
  );
  const existing = parseInt(rows[0].cnt, 10);

  if (existing > 0) {
    logger.info({ airlines: existing }, "Database already seeded — skipping");
    return;
  }

  logger.info("Database is empty — running seed from scripts/seed.sql");

  const seedPath = path.join(process.cwd(), "scripts", "seed.sql");

  let raw: string;
  try {
    raw = await readFile(seedPath, "utf-8");
  } catch {
    logger.warn({ seedPath }, "seed.sql not found — skipping seed");
    return;
  }

  // Strip Replit-specific psql meta-commands (\restrict / \unrestrict)
  const cleanSql = raw
    .split("\n")
    .filter((line) => !/^\s*\\(restrict|unrestrict)\b/.test(line))
    .join("\n");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(cleanSql);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const { rows: counts } = await pool.query<{
    airlines: string;
    airports: string;
    ops: string;
    handlers: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM airlines)            AS airlines,
      (SELECT COUNT(*) FROM airports)            AS airports,
      (SELECT COUNT(*) FROM airline_operations)  AS ops,
      (SELECT COUNT(*) FROM ground_handlers)     AS handlers
  `);

  const c = counts[0];
  logger.info(
    { airlines: c.airlines, airports: c.airports, ops: c.ops, handlers: c.handlers },
    "Seed complete",
  );
}
