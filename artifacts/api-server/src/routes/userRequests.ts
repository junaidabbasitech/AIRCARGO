import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userRequestsTable, auditLogsTable } from "@workspace/db/schema";
import { eq, sql, desc, and, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

// POST /api/requests — public: submit a data request
router.post("/requests", async (req, res) => {
  try {
    const {
      type, subject, details, airlineName, airlineIata, airportIata,
      firmsCode, contactName, contactEmail, additionalData
    } = req.body;

    if (!type || !subject || !details) {
      return res.status(400).json({ message: "type, subject and details are required" });
    }

    const validTypes = ["new_airline","new_ground_handler","firms_code","isc_charges","payable_to","payable_by","contact_info","other"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
    }

    const [row] = await db.insert(userRequestsTable).values({
      type, subject, details,
      airlineName: airlineName || null,
      airlineIata: airlineIata ? airlineIata.trim().toUpperCase() : null,
      airportIata: airportIata ? airportIata.trim().toUpperCase() : null,
      firmsCode: firmsCode ? firmsCode.trim().toUpperCase() : null,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      additionalData: additionalData || null,
      status: "pending",
    }).returning();

    res.status(201).json({ id: row.id, message: "Request submitted successfully. Our team will review it shortly." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/requests — admin: list all requests with filters
router.get("/requests", async (req, res) => {
  try {
    const { status, type, search, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (status) conditions.push(eq(userRequestsTable.status, status as any));
    if (type) conditions.push(eq(userRequestsTable.type, type as any));
    if (search) {
      conditions.push(or(
        ilike(userRequestsTable.subject, `%${search}%`),
        ilike(userRequestsTable.details, `%${search}%`),
        ilike(userRequestsTable.airlineName, `%${search}%`),
        ilike(userRequestsTable.airlineIata, `%${search}%`),
        ilike(userRequestsTable.airportIata, `%${search}%`),
        ilike(userRequestsTable.firmsCode, `%${search}%`),
        ilike(userRequestsTable.contactName, `%${search}%`),
        ilike(userRequestsTable.contactEmail, `%${search}%`),
      ));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult, statsResult] = await Promise.all([
      db.select().from(userRequestsTable).where(where).orderBy(desc(userRequestsTable.submittedAt)).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(userRequestsTable).where(where),
      db.select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        reviewed: sql<number>`count(*) filter (where status = 'reviewed')::int`,
        approved: sql<number>`count(*) filter (where status = 'approved')::int`,
        rejected: sql<number>`count(*) filter (where status = 'rejected')::int`,
      }).from(userRequestsTable),
    ]);

    res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum, stats: statsResult[0] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/requests/:id — admin: get single request
router.get("/requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db.select().from(userRequestsTable).where(eq(userRequestsTable.id, id));
    if (!row) return res.status(404).json({ message: "Request not found" });
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/requests/:id — admin: update status or add notes
router.patch("/requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };

    const validStatuses = ["pending", "reviewed", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData: Record<string, any> = {};
    if (status) { updateData.status = status; updateData.reviewedAt = new Date(); }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const [row] = await db.update(userRequestsTable)
      .set(updateData)
      .where(eq(userRequestsTable.id, id))
      .returning();

    if (!row) return res.status(404).json({ message: "Request not found" });

    await db.insert(auditLogsTable).values({
      entityType: "user_request",
      entityId: id,
      action: status ? `status_changed_to_${status}` : "notes_updated",
      changes: { status, adminNotes },
      performedBy: "admin",
    });

    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/requests/:id — admin: delete
router.delete("/requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(userRequestsTable).where(eq(userRequestsTable.id, id));
    res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
