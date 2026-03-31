import type { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";

const SKIP_PATHS = ["/api/health", "/api/audit-logs", "/api/stats"];

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startMs = Date.now();

  res.on("finish", () => {
    const path = req.path;
    if (SKIP_PATHS.some(p => path.startsWith(p))) return;

    const duration = Date.now() - startMs;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || null;

    const level = statusCode >= 500 ? "error"
      : statusCode >= 400 ? "warning"
      : "info";

    const entityType = deriveEntityType(path);
    const action = deriveAction(method, path, statusCode);

    const changes: Record<string, any> = {
      method,
      status: statusCode,
      durationMs: duration,
    };
    if (method !== "GET" && req.body && Object.keys(req.body).length > 0) {
      changes.body = sanitizeBody(req.body);
    }

    pool.query(
      `INSERT INTO audit_logs (level, entity_type, action, method, url, status_code, duration, ip_address, user_agent, changes, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [level, entityType, action, method, url, statusCode, duration, ip, userAgent, JSON.stringify(changes), "api"]
    ).catch(() => {});
  });

  next();
}

export function auditErrorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || null;

  pool.query(
    `INSERT INTO audit_logs (level, entity_type, action, method, url, status_code, ip_address, user_agent, error_message, performed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    ["error", "system", "SERVER_ERROR", req.method, req.originalUrl, 500, ip, userAgent, err.message, "api"]
  ).catch(() => {});

  next(err);
}

function deriveEntityType(path: string): string {
  if (path.includes("/airlines")) return "airline";
  if (path.includes("/airports")) return "airport";
  if (path.includes("/airline-operations")) return "airline_operation";
  if (path.includes("/ground-handlers")) return "ground_handler";
  if (path.includes("/requests")) return "user_request";
  if (path.includes("/sync")) return "sync";
  if (path.includes("/awb")) return "awb";
  if (path.includes("/db-admin")) return "db_admin";
  if (path.includes("/import") || path.includes("/export")) return "import_export";
  return "system";
}

function deriveAction(method: string, path: string, statusCode: number): string {
  const ok = statusCode < 400;
  if (!ok) return `${method}_FAILED`;
  if (method === "GET") return "READ";
  if (method === "POST" && path.includes("/import")) return "IMPORT";
  if (method === "GET" && path.includes("/export")) return "EXPORT";
  if (method === "POST") return "CREATE";
  if (method === "PUT" || method === "PATCH") return "UPDATE";
  if (method === "DELETE") return "DELETE";
  return method;
}

function sanitizeBody(body: Record<string, any>): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k.toLowerCase().includes("password") || k.toLowerCase().includes("secret")) {
      safe[k] = "[REDACTED]";
    } else if (typeof v === "string" && v.length > 200) {
      safe[k] = v.slice(0, 200) + "…";
    } else {
      safe[k] = v;
    }
  }
  return safe;
}
