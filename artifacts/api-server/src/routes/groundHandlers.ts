import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { groundHandlersTable, airportsTable, auditLogsTable } from "@workspace/db/schema";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/ground-handlers", async (req, res) => {
  try {
    const { search, airportId, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(groundHandlersTable.name, `%${search}%`),
          ilike(groundHandlersTable.contactName, `%${search}%`)
        )
      );
    }
    if (airportId) {
      conditions.push(eq(groundHandlersTable.airportId, parseInt(airportId)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: groundHandlersTable.id,
        name: groundHandlersTable.name,
        airportId: groundHandlersTable.airportId,
        airportName: airportsTable.name,
        contactName: groundHandlersTable.contactName,
        contactPhone: groundHandlersTable.contactPhone,
        contactEmail: groundHandlersTable.contactEmail,
        services: groundHandlersTable.services,
        lastUpdated: groundHandlersTable.lastUpdated,
        createdAt: groundHandlersTable.createdAt,
      })
        .from(groundHandlersTable)
        .leftJoin(airportsTable, eq(groundHandlersTable.airportId, airportsTable.id))
        .where(where)
        .orderBy(groundHandlersTable.name)
        .limit(limitNum)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(groundHandlersTable).where(where),
    ]);

    res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ground-handlers", async (req, res) => {
  try {
    const { name, airportId, contactName, contactPhone, contactEmail, services } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const [handler] = await db.insert(groundHandlersTable).values({
      name,
      airportId: airportId || null,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      services: services || null,
      lastUpdated: new Date(),
    }).returning();

    await db.insert(auditLogsTable).values({
      entityType: "ground_handler",
      entityId: handler.id,
      action: "create",
      changes: req.body,
      performedBy: "admin",
    });

    res.status(201).json(handler);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/ground-handlers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, airportId, contactName, contactPhone, contactEmail, services } = req.body;

    const [handler] = await db.update(groundHandlersTable)
      .set({ name, airportId, contactName, contactPhone, contactEmail, services, lastUpdated: new Date() })
      .where(eq(groundHandlersTable.id, id))
      .returning();

    if (!handler) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "ground_handler",
      entityId: id,
      action: "update",
      changes: req.body,
      performedBy: "admin",
    });

    res.json(handler);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/ground-handlers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(groundHandlersTable).where(eq(groundHandlersTable.id, id));

    await db.insert(auditLogsTable).values({
      entityType: "ground_handler",
      entityId: id,
      action: "delete",
      performedBy: "admin",
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ground-handlers/bulk-upload", async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData) return res.status(400).json({ message: "csvData is required" });

    const lines = csvData.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const errors: string[] = [];
    let inserted = 0;
    let skipped = 0;

    if (lines.length < 2) {
      return res.status(400).json({ message: "CSV must have header row and at least one data row", inserted: 0, skipped: 0, errors: [] });
    }

    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"));

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v: string) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => { row[h] = values[idx] || ""; });

      const name = row["name"] || row["handler_name"] || row["company"];
      if (!name) {
        errors.push(`Row ${i + 1}: Missing name`);
        skipped++;
        continue;
      }

      try {
        await db.insert(groundHandlersTable).values({
          name,
          contactName: row["contact_name"] || row["contact"] || null,
          contactPhone: row["phone"] || row["contact_phone"] || null,
          contactEmail: row["email"] || row["contact_email"] || null,
          services: row["services"] || null,
          lastUpdated: new Date(),
        });
        inserted++;
      } catch {
        errors.push(`Row ${i + 1}: Insert failed`);
        skipped++;
      }
    }

    await db.insert(auditLogsTable).values({
      entityType: "ground_handler",
      action: "bulk_upload",
      changes: { inserted, skipped, errors },
      performedBy: "admin",
    });

    res.json({ inserted, skipped, errors, message: `Uploaded ${inserted} records, skipped ${skipped}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
