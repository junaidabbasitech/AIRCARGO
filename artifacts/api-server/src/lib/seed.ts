import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Finds the workspace root by searching candidate paths.
 * - Production:  node runs from workspace root  →  cwd/scripts/seed_*.sql
 * - Development: tsx runs from artifacts/api-server/  →  cwd/../../scripts/seed_*.sql
 */
function findScriptsDir(): string | null {
  const candidates = [
    path.join(process.cwd(), "scripts"),
    path.join(process.cwd(), "..", "..", "scripts"),
  ];
  return candidates.find((p) => existsSync(path.join(p, "seed_airlines.sql"))) ?? null;
}

/**
 * Reads a seed file, strips Replit-specific psql meta-commands, and returns
 * only the lines that contain actual SQL (INSERT, SET, SELECT, setval).
 */
async function loadSql(filePath: string): Promise<string> {
  const raw = await readFile(filePath, "utf-8");
  return raw
    .split("\n")
    .filter((line) => !/^\s*\\(restrict|unrestrict)\b/.test(line))
    .join("\n");
}

/**
 * Runs a SQL string in its own transaction on a dedicated client.
 * Resets search_path to public after the transaction so pooled connections
 * are not left with the empty search_path that pg_dump sets.
 */
async function runTransaction(sql: string, label: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw new Error(`Seed failed for ${label}: ${(err as Error).message}`);
  } finally {
    // Always restore search_path so subsequent pool users are unaffected
    await client.query("SET search_path = public").catch(() => {});
    client.release();
  }
}

/**
 * Seeds the database on every boot using ON CONFLICT DO NOTHING.
 * Each table is committed in its own transaction, in FK dependency order:
 *   airlines → airports → ground_handlers → airline_operations
 *
 * This guarantees FK-referenced rows are fully visible (committed) before
 * dependent rows are inserted, regardless of FK constraint timing.
 *
 * Safe to re-run repeatedly — existing rows are silently skipped.
 */
export async function seedIfEmpty(): Promise<void> {
  const scriptsDir = findScriptsDir();

  if (!scriptsDir) {
    logger.warn("Seed files not found — skipping seed");
    return;
  }

  // FK dependency order — each entry is committed before the next runs
  const tables: Array<{ file: string; label: string }> = [
    { file: "seed_airlines.sql",          label: "airlines" },
    { file: "seed_airports.sql",          label: "airports" },
    { file: "seed_ground_handlers.sql",   label: "ground_handlers" },
    { file: "seed_airline_operations.sql", label: "airline_operations" },
  ];

  logger.info({ scriptsDir }, "Running per-table seed in FK dependency order");

  for (const { file, label } of tables) {
    const filePath = path.join(scriptsDir, file);
    const sql = await loadSql(filePath);
    await runTransaction(sql, label);
    logger.info({ table: label }, "Table seeded");
  }

  // Use schema-qualified names to be safe regardless of session search_path
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
