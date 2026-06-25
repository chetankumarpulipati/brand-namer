"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Webhook, Trash2, Activity, ExternalLink, Copy, Check } from "lucide-react";

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  retryCount: number;
  createdAt: string;
}

interface WebhookLog {
  id: string;
  event: string;
  responseStatus: number;
  status: string;
  duration: number;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  "name.created",
  "name.saved",
  "name.updated",
  "search.completed",
  "domain.checked",
  "trademark.checked",
  "social.checked",
];

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}>{children}</div>;
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h3>;
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "destructive" | "outline" }) {
  const variants: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    outline: "border text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant] ?? variants.default)}>
      {children}
    </span>
  );
}

export default function WebhooksPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [configs, setConfigs] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, WebhookLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchConfigs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listWebhookConfigs(token) as { items: WebhookConfig[] };
      setConfigs(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load webhook configs");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchConfigs();
  }, [token, fetchConfigs]);

  const toggleEvent = (event: string) => {
    setNewEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]);
  };

  const handleCreate = async () => {
    if (!token || !newUrl.trim()) return;
    setCreating(true);
    try {
      await api.createWebhookConfig(token, { url: newUrl.trim(), events: newEvents });
      setNewUrl("");
      setNewEvents([]);
      setShowCreate(false);
      await fetchConfigs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this webhook config?")) return;
    setDeleting(id);
    try {
      await api.deleteWebhookConfig(token, id);
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete webhook");
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedConfig === id) {
      setExpandedConfig(null);
      return;
    }
    setExpandedConfig(id);
    if (!logs[id] && token) {
      setLogsLoading(id);
      try {
        const data = await api.getUserWebhookLogs(token, id) as { items: WebhookLog[] };
        setLogs((prev) => ({ ...prev, [id]: data.items ?? [] }));
      } catch {
        // silently fail
      } finally {
        setLogsLoading(null);
      }
    }
  };

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
    } catch {}
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">Send real-time events to your own endpoints.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Webhook
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle>New Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="flex flex-wrap gap-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <Button
                      key={event}
                      variant={newEvents.includes(event) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleEvent(event)}
                    >
                      {event}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!newUrl.trim() || creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Webhook className="mr-2 h-4 w-4" />}
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted mb-3" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : configs.length === 0 && !showCreate ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Webhook className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No webhooks configured.</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <Card key={config.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggleExpand(config.id)}>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-sm">{config.url}</code>
                        <Badge variant={config.isActive ? "success" : "destructive"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {config.events.map((event) => (
                          <Badge key={event} variant="outline">{event}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(config.id); }}
                      disabled={deleting === config.id}
                    >
                      {deleting === config.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                    </Button>
                  </div>

                  {expandedConfig === config.id && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Secret:</span>
                        <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                          {config.secret.slice(0, 16)}...
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => copySecret(config.secret)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Recent Logs
                        </h4>
                        {logsLoading === config.id ? (
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : (logs[config.id]?.length ?? 0) > 0 ? (
                          <div className="space-y-2">
                            {logs[config.id]!.slice(0, 10).map((log) => (
                              <div key={log.id} className="flex items-center justify-between rounded border p-2 text-xs">
                                <span>{log.event}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    log.status === "success" ? "success" :
                                    log.status === "failed" ? "destructive" : "warning"
                                  }>
                                    {log.status}
                                  </Badge>
                                  {log.responseStatus && <span>{log.responseStatus}</span>}
                                  {log.duration && <span>{log.duration}ms</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No logs yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
