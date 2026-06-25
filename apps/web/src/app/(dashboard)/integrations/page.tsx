"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plug, Link, Unlink, ExternalLink } from "lucide-react";

interface Integration {
  id: string;
  platform: string;
  platformUserId: string;
  isActive: boolean;
  createdAt: string;
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
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

const PLATFORMS = [
  { id: "slack", name: "Slack", color: "bg-[#4A154B] text-white" },
  { id: "discord", name: "Discord", color: "bg-[#5865F2] text-white" },
  { id: "whatsapp", name: "WhatsApp", color: "bg-[#25D366] text-white" },
  { id: "telegram", name: "Telegram", color: "bg-[#0088CC] text-white" },
  { id: "zapier", name: "Zapier", color: "bg-[#FF4A00] text-white" },
];

export default function IntegrationsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const [showConnectForm, setShowConnectForm] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [platformUserId, setPlatformUserId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchIntegrations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listIntegrations(token) as { items: Integration[] };
      setIntegrations(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchIntegrations();
  }, [token, fetchIntegrations]);

  const getIntegration = (platformId: string) => {
    return integrations.find((i) => i.platform === platformId);
  };

  const handleConnect = async (platform: string) => {
    if (!token || !accessToken) return;
    setConnecting(platform);
    setError(null);
    try {
      await api.connectIntegration(token, {
        platform,
        accessToken,
        platformUserId: platformUserId || undefined,
      });
      setAccessToken("");
      setPlatformUserId("");
      setShowConnectForm(null);
      await fetchIntegrations();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to connect ${platform}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!token) return;
    setDisconnecting(id);
    try {
      await api.disconnectIntegration(token, id);
      setIntegrations((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect integration");
    } finally {
      setDisconnecting(null);
    }
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
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Connect your account with Slack, Discord, WhatsApp, and more.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-24 mb-3" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((platform) => {
              const integration = getIntegration(platform.id);
              return (
                <Card key={platform.id}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold", platform.color)}>
                          {platform.name[0]}
                        </div>
                        <div>
                          <p className="font-medium">{platform.name}</p>
                          {integration && (
                            <p className="text-xs text-muted-foreground">
                              Connected as {integration.platformUserId ?? "User"}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={integration ? "success" : "outline"}>
                        {integration ? "Connected" : "Not connected"}
                      </Badge>
                    </div>

                    {integration ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDisconnect(integration.id)}
                        disabled={disconnecting === integration.id}
                      >
                        {disconnecting === integration.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="mr-2 h-4 w-4" />
                        )}
                        Disconnect
                      </Button>
                    ) : showConnectForm === platform.id ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor={`token-${platform.id}`}>Access Token</Label>
                          <Input
                            id={`token-${platform.id}`}
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="Paste your access token"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`userid-${platform.id}`}>Platform User ID (optional)</Label>
                          <Input
                            id={`userid-${platform.id}`}
                            value={platformUserId}
                            onChange={(e) => setPlatformUserId(e.target.value)}
                            placeholder="e.g. U12345"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleConnect(platform.id)} disabled={!accessToken || connecting === platform.id}>
                            {connecting === platform.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Link className="mr-2 h-4 w-4" />
                            )}
                            Connect
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setShowConnectForm(null); setAccessToken(""); setPlatformUserId(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowConnectForm(platform.id)}
                      >
                        <Link className="mr-2 h-4 w-4" />
                        Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
