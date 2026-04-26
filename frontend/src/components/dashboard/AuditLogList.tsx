"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface AuditLog {
  id: string;
  userEmail: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: unknown;
  createdAt: string;
}

export default function AuditLogList() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await apiClient.get("/audit");
        setLogs(response.data);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse text-gray-500">Loading audit trails...</div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-gray-500 font-light italic">
        No administrative actions recorded in the current session.
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="group min-w-0 rounded-lg border border-white/5 bg-black p-4 transition-colors hover:border-red-500/20"
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <span className="min-w-0 break-words text-xs font-black uppercase tracking-widest text-red-500">
              {log.action.replace(/_/g, " ")}
            </span>
            <span className="font-mono text-[10px] text-gray-600">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="min-w-0 break-words text-sm text-gray-300">
              <span className="mr-2 text-[10px] font-bold uppercase text-gray-500">
                Operator:
              </span>
              {log.userEmail || "System"}
            </p>
            {log.entity && (
              <p className="min-w-0 break-words text-sm text-gray-300">
                <span className="mr-2 text-[10px] font-bold uppercase text-gray-500">
                  Entity:
                </span>
                {log.entity}{" "}
                {log.entityId && (
                  <span className="font-mono text-xs text-gray-600">
                    ({log.entityId})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
