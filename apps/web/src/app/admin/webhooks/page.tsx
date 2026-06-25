"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

interface WebhookEntry {
  id: string;
  event: string;
  url: string;
  status: string;
  responseCode?: number;
  createdAt: string;
}

export default function AdminWebhooksPage() {
  const { token } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    api
      .listWebhookLogs(token)
      .then((data) => setWebhooks((data as { items: WebhookEntry[] }).items ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Webhooks</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          No webhook logs found
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      wh.status === "success" ? "bg-green-500" : wh.status === "failed" ? "bg-red-500" : "bg-yellow-500"
                    }`}
                  />
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {wh.event}
                  </span>
                </div>
                {wh.responseCode && (
                  <span className="text-xs text-gray-500">{wh.responseCode}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{wh.url}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {new Date(wh.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
