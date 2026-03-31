import { useCallback, useRef } from "react";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type LogLevel = "info" | "warning" | "error";

interface AuditPayload {
  level?: LogLevel;
  entityType?: string;
  entityId?: number;
  action: string;
  changes?: Record<string, any>;
  errorMessage?: string;
}

async function sendLog(payload: AuditPayload) {
  try {
    await fetch(`${BASE}/api/audit-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: payload.level ?? "info",
        entityType: payload.entityType ?? "frontend",
        entityId: payload.entityId,
        action: payload.action,
        changes: payload.changes,
        errorMessage: payload.errorMessage,
        performedBy: "frontend",
        url: window.location.pathname,
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
  }
}

export function useAuditLogger() {
  const log = useCallback(async (payload: AuditPayload) => {
    await sendLog(payload);
  }, []);

  const logError = useCallback(async (action: string, errorMessage: string, extra?: Record<string, any>) => {
    await sendLog({ level: "error", action, errorMessage, changes: extra });
  }, []);

  const logPageView = useCallback(async (page: string) => {
    await sendLog({ level: "info", entityType: "navigation", action: `VIEW_${page.toUpperCase().replace(/\//g, "_").replace(/^_/, "")}` });
  }, []);

  const logUserAction = useCallback(async (action: string, entityType?: string, entityId?: number, changes?: Record<string, any>) => {
    await sendLog({ level: "info", entityType: entityType ?? "frontend", entityId, action, changes });
  }, []);

  return { log, logError, logPageView, logUserAction };
}
