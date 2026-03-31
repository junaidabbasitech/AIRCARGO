import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// Allowed tables (whitelist for security)
const ALLOWED_TABLES = [
  "airlines",
  "airports",
  "airline_operations",
  "ground_handlers",
];

function isAllowed(table: string) {
  return ALLOWED_TABLES.includes(table);
}

// GET /api/db-admin/tables — list all allowed tables with row counts + column info
router.get("/db-admin/tables", async (req, res) => {
  try {
    const tableInfoQuery = await pool.query(`
      SELECT
        t.table_name,
        (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count,
        obj_description(pgc.oid, 'pg_class') as description
      FROM information_schema.tables t
      JOIN pg_class pgc ON pgc.relname = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name = ANY($1)
      ORDER BY t.table_name
    `, [ALLOWED_TABLES]);

    const rowCounts = await Promise.all(
      ALLOWED_TABLES.map(async (tbl) => {
        const r = await pool.query(`SELECT COUNT(*)::int as cnt FROM ${tbl}`);
        return { table: tbl, count: r.rows[0].cnt };
      })
    );
    const countMap: Record<string, number> = {};
    rowCounts.forEach(r => { countMap[r.table] = r.count; });

    const tables = tableInfoQuery.rows.map(r => ({
      name: r.table_name,
      rowCount: countMap[r.table_name] ?? 0,
      columnCount: parseInt(r.column_count),
    }));

    return res.json({ tables });
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/db-admin/tables/:table/schema — column definitions
router.get("/db-admin/tables/:table/schema", async (req, res) => {
  const { table } = req.params;
  if (!isAllowed(table)) return res.status(403).json({ message: "Table not allowed" });

  try {
    const cols = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    const pks = await pool.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        AND tc.constraint_type = 'PRIMARY KEY'
    `, [table]);

    const pkCols = new Set(pks.rows.map((r: any) => r.column_name));

    const schema = cols.rows.map((c: any) => ({
      name: c.column_name,
      type: c.data_type,
      nullable: c.is_nullable === "YES",
      default: c.column_default,
      isPrimary: pkCols.has(c.column_name),
    }));

    return res.json({ table, schema });
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/db-admin/tables/:table/rows — paginated rows
router.get("/db-admin/tables/:table/rows", async (req, res) => {
  const { table } = req.params;
  if (!isAllowed(table)) return res.status(403).json({ message: "Table not allowed" });

  const page = Math.max(1, parseInt((req.query.page as string) || "1"));
  const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) || "50")));
  const search = (req.query.search as string || "").trim();
  const offset = (page - 1) * limit;

  try {
    let whereClause = "";
    const params: any[] = [];

    // Simple text search across text columns
    if (search) {
      const colsResult = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
          AND data_type IN ('text', 'character varying', 'varchar')
        ORDER BY ordinal_position
      `, [table]);
      const textCols = colsResult.rows.map((r: any) => r.column_name);
      if (textCols.length > 0) {
        params.push(`%${search}%`);
        const conditions = textCols.map((col: string) => `${col}::text ILIKE $1`);
        whereClause = `WHERE (${conditions.join(" OR ")})`;
      }
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM ${table} ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    params.push(limit, offset);
    const rows = await pool.query(
      `SELECT * FROM ${table} ${whereClause} ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ rows: rows.rows, total, page, limit });
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/db-admin/tables/:table/rows/:id — update a single row
router.put("/db-admin/tables/:table/rows/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!isAllowed(table)) return res.status(403).json({ message: "Table not allowed" });

  const updates = req.body as Record<string, any>;
  // Remove protected fields
  delete updates.id;
  delete updates.created_at;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  // Validate column names are real columns
  const colsResult = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
  `, [table]);
  const validCols = new Set(colsResult.rows.map((r: any) => r.column_name));

  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [col, val] of Object.entries(updates)) {
    if (!validCols.has(col)) continue;
    setClauses.push(`${col} = $${paramIdx}`);
    params.push(val === "" ? null : val);
    paramIdx++;
  }

  if (setClauses.length === 0) return res.status(400).json({ message: "No valid fields" });

  // Add last_updated if it exists
  if (validCols.has("last_updated")) {
    setClauses.push(`last_updated = NOW()`);
  }

  params.push(id);
  try {
    const result = await pool.query(
      `UPDATE ${table} SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Row not found" });
    return res.json(result.rows[0]);
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
});

// DELETE /api/db-admin/tables/:table/rows/:id — delete a row
router.delete("/db-admin/tables/:table/rows/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!isAllowed(table)) return res.status(403).json({ message: "Table not allowed" });

  try {
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Row not found" });
    return res.json({ message: "Deleted", id: result.rows[0].id });
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
});

// GET /api/db-admin/tables/:table/export — export table as CSV
router.get("/db-admin/tables/:table/export", async (req, res) => {
  const { table } = req.params;
  if (!isAllowed(table)) return res.status(403).json({ message: "Table not allowed" });

  try {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY id`);
    const rows = result.rows;

    if (rows.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${table}.csv"`);
      return res.send("");
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(",")
      )
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${table}.csv"`);
    return res.send(csv);
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/db-admin/tables/:table/import — import CSV data
router.post("/db-admin/tables/:table/import", async (req, res) => {
  const { table } = req.params;
  if (!isAllowed(table)) return res.status(403).json({ message: "Table not allowed" });

  try {
    const { csv, mode } = req.body as { csv: string; mode: "replace" | "append" };
    if (!csv) return res.status(400).json({ message: "CSV data required" });

    const lines = csv.trim().split("\n");
    if (lines.length < 2) return res.status(400).json({ message: "CSV must have headers and at least one data row" });

    const headers = lines[0].split(",").map((h: string) => h.trim().replace(/^"(.*)"$/, "$1"));
    const rows = lines.slice(1).map(line => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });

    // Validate columns
    const colsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `, [table]);
    const validCols = new Set(colsResult.rows.map((r: any) => r.column_name));
    const invalidCols = headers.filter(h => !validCols.has(h));
    if (invalidCols.length > 0) {
      return res.status(400).json({ message: `Invalid columns: ${invalidCols.join(", ")}` });
    }

    let importedCount = 0;
    const errors: string[] = [];

    if (mode === "replace") {
      await pool.query(`DELETE FROM ${table}`);
    }

    for (let i = 0; i < rows.length; i++) {
      try {
        const values = rows[i];
        const placeholders = headers.map((_, idx) => `$${idx + 1}`).join(",");
        const parsedValues = values.map((v, idx) => {
          if (v === "" || v === "null") return null;
          const col = headers[idx];
          if (col === "id") return parseInt(v) || v;
          return v;
        });
        await pool.query(
          `INSERT INTO ${table} (${headers.join(",")}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${headers.filter(h => h !== "id").map((h, idx) => `${h} = $${headers.indexOf(h) + 1}`).join(", ")}`,
          parsedValues
        );
        importedCount++;
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return res.json({ importedCount, errors: errors.slice(0, 10) });
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
});

export default router;
