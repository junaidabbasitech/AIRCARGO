import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Seeds the database on every boot using ON CONFLICT DO NOTHING.
 * Safe to run repeatedly — existing rows are silently skipped.
 *
 * Resolves scripts/seed.sql relative to the workspace root, which differs
 * between dev (cwd = artifacts/api-server) and production (cwd = workspace root).
 */
function findSeedFile(): string | null {
  const candidates = [
    // production: node runs from workspace root
    path.join(process.cwd(), "scripts", "seed.sql"),
    // development: tsx runs from artifacts/api-server/
    path.join(process.cwd(), "..", "..", "scripts", "seed.sql"),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

export async function seedIfEmpty(): Promise<void> {
  const seedPath = findSeedFile();

  if (!seedPath) {
    logger.warn("seed.sql not found in any expected location — skipping seed");
    return;
  }

  const raw = await readFile(seedPath, "utf-8");

  // Strip Replit-specific psql meta-commands (\restrict / \unrestrict)
  const cleanSql = raw
    .split("\n")
    .filter((line) => !/^\s*\\(restrict|unrestrict)\b/.test(line))
    .join("\n");

  logger.info({ seedPath }, "Running seed (ON CONFLICT DO NOTHING — safe to re-run)");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(cleanSql);
    await client.query("COMMIT");
    // Reset search_path: pg_dump sets it to '' which would break subsequent
    // unqualified queries on this pooled connection.
    await client.query("SET search_path = public");
  } catch (err) {
    await client.query("ROLLBACK");
    await client.query("SET search_path = public");
    throw err;
  } finally {
    client.release();
  }

  // Use schema-qualified names in case search_path is still '' on a reused connection
  const { rows } = await pool.query<{
    airlines: string;
    airports: string;
    ops: string;
    handlers: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM public.airlines)            AS airlines,
      (SELECT COUNT(*) FROM public.airports)            AS airports,
      (SELECT COUNT(*) FROM public.airline_operations)  AS ops,
      (SELECT COUNT(*) FROM public.ground_handlers)     AS handlers
  `);

  const c = rows[0];
  logger.info(
    { airlines: c.airlines, airports: c.airports, ops: c.ops, handlers: c.handlers },
    "Seed complete",
  );
}
