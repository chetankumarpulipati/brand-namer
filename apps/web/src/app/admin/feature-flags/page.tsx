"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rules?: Record<string, unknown>;
}

export default function AdminFeatureFlagsPage() {
  const { token } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.listFeatureFlags(token);
      setFlags(data.items as FeatureFlag[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = async (flag: FeatureFlag) => {
    if (!token) return;
    setToggling(flag.id);
    try {
      await api.updateFeatureFlag(token, flag.id, { enabled: !flag.enabled });
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, enabled: !f.enabled } : f))
      );
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setToggling(null);
    }
  };

  if (!token) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Feature Flags</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      flag.enabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {flag.key}
                  </span>
                </div>
                {flag.description && (
                  <p className="mt-1 text-sm text-gray-500">{flag.description}</p>
                )}
                {flag.rules && Object.keys(flag.rules).length > 0 && (
                  <pre className="mt-1 overflow-x-auto text-xs text-gray-400">
                    {JSON.stringify(flag.rules, null, 2)}
                  </pre>
                )}
              </div>
              <Button
                variant={flag.enabled ? "destructive" : "default"}
                size="sm"
                disabled={toggling === flag.id}
                onClick={() => handleToggle(flag)}
              >
                {toggling === flag.id
                  ? "..."
                  : flag.enabled
                    ? "Disable"
                    : "Enable"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
