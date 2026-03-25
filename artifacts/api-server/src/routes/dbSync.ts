import { Router, type IRouter } from "express";
import { Pool } from "pg";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { syncLogsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

// ── State ──────────────────────────────────────────────────────────────────
let syncState: {
  status: "idle" | "running" | "success" | "error";
  lastRun: string | null;
  rowsSynced: { airlines: number; airports: number; groundHandlers: number; ops: number };
  error: string | null;
  configured: boolean;
} = {
  status: "idle",
  lastRun: null,
  rowsSynced: { airlines: 0, airports: 0, groundHandlers: 0, ops: 0 },
  error: null,
  configured: !!process.env.PROD_DATABASE_URL,
};

// ── Helper: get last successful sync time ─────────────────────────────────
async function getLastSyncAt(): Promise<Date> {
  try {
    const [last] = await db
      .select({ syncedAt: syncLogsTable.syncedAt })
      .from(syncLogsTable)
      .where(sql`sources::text LIKE '%prod-db%' AND success = true`)
      .orderBy(desc(syncLogsTable.syncedAt))
      .limit(1);
    return last?.syncedAt ?? new Date("2000-01-01");
  } catch {
    return new Date("2000-01-01");
  }
}

// ── Core sync logic ────────────────────────────────────────────────────────
async function runDbSync(log?: (msg: string) => void): Promise<void> {
  const prodUrl = process.env.PROD_DATABASE_URL;
  if (!prodUrl) {
    syncState.status = "error";
    syncState.error = "PROD_DATABASE_URL is not set. Add it in your environment secrets.";
    return;
  }

  syncState.status = "running";
  syncState.error = null;

  const prod = new Pool({ connectionString: prodUrl, ssl: { rejectUnauthorized: false } });
  const counts = { airlines: 0, airports: 0, groundHandlers: 0, ops: 0 };
  const errors: string[] = [];

  try {
    const since = await getLastSyncAt();
    const sinceStr = since.toISOString();
    log?.(`Syncing records updated after ${sinceStr}`);

    // ── 1. Airlines ──────────────────────────────────────────────────────
    try {
      const { rows: airlines } = await prod.query(
        `SELECT id, name, iata_code, cbp_code, icao_code, country, awb_prefix,
                status, source, flagged_for_review, last_updated, created_at
         FROM airlines
         WHERE last_updated > $1
         ORDER BY id`,
        [sinceStr]
      );

      for (const r of airlines) {
        await db.execute(sql`
          INSERT INTO airlines
            (id, name, iata_code, cbp_code, icao_code, country, awb_prefix,
             status, source, flagged_for_review, last_updated, created_at)
          VALUES
            (${r.id}, ${r.name}, ${r.iata_code}, ${r.cbp_code}, ${r.icao_code},
             ${r.country}, ${r.awb_prefix}, ${r.status ?? 'approved'},
             ${r.source}, ${r.flagged_for_review ?? false},
             ${r.last_updated}, ${r.created_at})
          ON CONFLICT (id) DO UPDATE SET
            name              = EXCLUDED.name,
            iata_code         = EXCLUDED.iata_code,
            cbp_code          = EXCLUDED.cbp_code,
            icao_code         = EXCLUDED.icao_code,
            country           = EXCLUDED.country,
            awb_prefix        = EXCLUDED.awb_prefix,
            status            = EXCLUDED.status,
            source            = EXCLUDED.source,
            flagged_for_review= EXCLUDED.flagged_for_review,
            last_updated      = EXCLUDED.last_updated
        `);
        counts.airlines++;
      }
      log?.(`Airlines: ${counts.airlines} upserted`);
    } catch (err: any) {
      errors.push(`airlines: ${err.message}`);
    }

    // ── 2. Airports ──────────────────────────────────────────────────────
    try {
      const { rows: airports } = await prod.query(
        `SELECT id, name, iata_code, cbp_port_code, city, state, country,
                customs_approved, status, source, flagged_for_review, last_updated, created_at
         FROM airports
         WHERE last_updated > $1
         ORDER BY id`,
        [sinceStr]
      );

      for (const r of airports) {
        await db.execute(sql`
          INSERT INTO airports
            (id, name, iata_code, cbp_port_code, city, state, country,
             customs_approved, status, source, flagged_for_review, last_updated, created_at)
          VALUES
            (${r.id}, ${r.name}, ${r.iata_code}, ${r.cbp_port_code}, ${r.city},
             ${r.state}, ${r.country}, ${r.customs_approved ?? false},
             ${r.status ?? 'approved'}, ${r.source}, ${r.flagged_for_review ?? false},
             ${r.last_updated}, ${r.created_at})
          ON CONFLICT (id) DO UPDATE SET
            name              = EXCLUDED.name,
            iata_code         = EXCLUDED.iata_code,
            cbp_port_code     = EXCLUDED.cbp_port_code,
            city              = EXCLUDED.city,
            state             = EXCLUDED.state,
            country           = EXCLUDED.country,
            customs_approved  = EXCLUDED.customs_approved,
            status            = EXCLUDED.status,
            source            = EXCLUDED.source,
            flagged_for_review= EXCLUDED.flagged_for_review,
            last_updated      = EXCLUDED.last_updated
        `);
        counts.airports++;
      }
      log?.(`Airports: ${counts.airports} upserted`);
    } catch (err: any) {
      errors.push(`airports: ${err.message}`);
    }

    // ── 3. Ground Handlers ───────────────────────────────────────────────
    try {
      const { rows: handlers } = await prod.query(
        `SELECT id, name, airport_id, contact_name, contact_phone, contact_email,
                services, last_updated, created_at
         FROM ground_handlers
         WHERE last_updated > $1
         ORDER BY id`,
        [sinceStr]
      );

      for (const r of handlers) {
        await db.execute(sql`
          INSERT INTO ground_handlers
            (id, name, airport_id, contact_name, contact_phone, contact_email,
             services, last_updated, created_at)
          VALUES
            (${r.id}, ${r.name}, ${r.airport_id}, ${r.contact_name},
             ${r.contact_phone}, ${r.contact_email}, ${r.services},
             ${r.last_updated}, ${r.created_at})
          ON CONFLICT (id) DO UPDATE SET
            name          = EXCLUDED.name,
            airport_id    = EXCLUDED.airport_id,
            contact_name  = EXCLUDED.contact_name,
            contact_phone = EXCLUDED.contact_phone,
            contact_email = EXCLUDED.contact_email,
            services      = EXCLUDED.services,
            last_updated  = EXCLUDED.last_updated
        `);
        counts.groundHandlers++;
      }
      log?.(`Ground handlers: ${counts.groundHandlers} upserted`);
    } catch (err: any) {
      errors.push(`ground_handlers: ${err.message}`);
    }

    // ── 4. Airline Operations ────────────────────────────────────────────
    try {
      const { rows: ops } = await prod.query(
        `SELECT id, airline_id, airport_id, firms_code, isc_amount, isc_payable_at,
                isc_payable_to, contact_number, contact_email, notes, last_updated, created_at
         FROM airline_operations
         WHERE last_updated > $1
         ORDER BY id`,
        [sinceStr]
      );

      for (const r of ops) {
        await db.execute(sql`
          INSERT INTO airline_operations
            (id, airline_id, airport_id, firms_code, isc_amount, isc_payable_at,
             isc_payable_to, contact_number, contact_email, notes, last_updated, created_at)
          VALUES
            (${r.id}, ${r.airline_id}, ${r.airport_id}, ${r.firms_code}, ${r.isc_amount},
             ${r.isc_payable_at}, ${r.isc_payable_to}, ${r.contact_number},
             ${r.contact_email}, ${r.notes}, ${r.last_updated}, ${r.created_at})
          ON CONFLICT (id) DO UPDATE SET
            airline_id    = EXCLUDED.airline_id,
            airport_id    = EXCLUDED.airport_id,
            firms_code    = EXCLUDED.firms_code,
            isc_amount    = EXCLUDED.isc_amount,
            isc_payable_at= EXCLUDED.isc_payable_at,
            isc_payable_to= EXCLUDED.isc_payable_to,
            contact_number= EXCLUDED.contact_number,
            contact_email = EXCLUDED.contact_email,
            notes         = EXCLUDED.notes,
            last_updated  = EXCLUDED.last_updated
        `);
        counts.ops++;
      }
      log?.(`Ops: ${counts.ops} upserted`);
    } catch (err: any) {
      errors.push(`airline_operations: ${err.message}`);
    }

    // ── Log the sync ─────────────────────────────────────────────────────
    const total = counts.airlines + counts.airports + counts.groundHandlers + counts.ops;
    await db.insert(syncLogsTable).values({
      sources: ["prod-db"],
      airlinesAdded: counts.airlines,
      airportsAdded: counts.airports,
      success: errors.length === 0,
      errors,
      syncedAt: new Date(),
    });

    syncState = {
      status: errors.length > 0 ? "error" : "success",
      lastRun: new Date().toISOString(),
      rowsSynced: counts,
      error: errors.length > 0 ? errors.join("; ") : null,
      configured: true,
    };

    log?.(`Sync complete — ${total} total rows upserted${errors.length > 0 ? `, ${errors.length} error(s)` : ""}`);

  } finally {
    await prod.end();
  }
}

// ── Auto-sync every 5 minutes ──────────────────────────────────────────────
if (process.env.PROD_DATABASE_URL) {
  // Run immediately on startup
  setTimeout(() => runDbSync(msg => console.log(`[db-sync] ${msg}`)), 5000);
  // Then every 5 minutes
  setInterval(() => runDbSync(msg => console.log(`[db-sync] ${msg}`)), 5 * 60 * 1000);
}

// ── Routes ─────────────────────────────────────────────────────────────────

router.get("/db-sync/status", (_req, res) => {
  res.json({
    ...syncState,
    configured: !!process.env.PROD_DATABASE_URL,
    autoSyncIntervalMinutes: 5,
  });
});

router.post("/db-sync", async (req, res) => {
  if (!process.env.PROD_DATABASE_URL) {
    return res.status(400).json({
      error: "PROD_DATABASE_URL is not configured. Set it as an environment secret.",
    });
  }

  if (syncState.status === "running") {
    return res.status(409).json({ error: "Sync already in progress" });
  }

  const messages: string[] = [];
  try {
    await runDbSync(msg => messages.push(msg));
    res.json({ ...syncState, log: messages });
  } catch (err: any) {
    syncState.status = "error";
    syncState.error = err.message;
    res.status(500).json({ error: err.message, log: messages });
  }
});

export default router;
