"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Smartphone, Key, LogOut, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Session {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
  isActive: boolean;
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

export default function SecurityPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpSuccess, setTotpSuccess] = useState<string | null>(null);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQrCode, setTotpQrCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [verifyingTotp, setVerifyingTotp] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await api.listSessions(token) as { items: Session[] };
      setSessions(data.items ?? []);
    } catch (e) {
      setSessionsError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchSessions();
  }, [token, fetchSessions]);

  const handleSetupTotp = async () => {
    if (!token) return;
    setTotpLoading(true);
    setTotpError(null);
    setTotpSuccess(null);
    try {
      const data = await api.totpSetup(token) as { secret: string; qrCode: string };
      setTotpSecret(data.secret);
      setTotpQrCode(data.qrCode);
      setShowTotpSetup(true);
    } catch (e) {
      setTotpError(e instanceof Error ? e.message : "Failed to setup 2FA");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (!token || !totpCode) return;
    setVerifyingTotp(true);
    setTotpError(null);
    try {
      await api.totpVerify(token, totpCode);
      setTotpEnabled(true);
      setTotpSuccess("Two-factor authentication enabled successfully.");
      setShowTotpSetup(false);
      setTotpCode("");
      setTotpSecret("");
      setTotpQrCode("");
    } catch (e) {
      setTotpError(e instanceof Error ? e.message : "Failed to verify code");
    } finally {
      setVerifyingTotp(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to disable two-factor authentication?")) return;
    setTotpLoading(true);
    setTotpError(null);
    try {
      await api.totpDisable(token);
      setTotpEnabled(false);
      setTotpSuccess("Two-factor authentication disabled.");
    } catch (e) {
      setTotpError(e instanceof Error ? e.message : "Failed to disable 2FA");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    if (!token) return;
    setRevokingSession(id);
    try {
      await api.revokeSession(token, id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setSessionsError(e instanceof Error ? e.message : "Failed to revoke session");
    } finally {
      setRevokingSession(null);
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
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">Manage two-factor authentication and active sessions.</p>
        </div>

        {totpError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {totpError}
          </div>
        )}
        {totpSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            {totpSuccess}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Authenticator App</p>
                <p className="text-sm text-muted-foreground">
                  {totpEnabled
                    ? "Two-factor authentication is enabled."
                    : "Add an extra layer of security to your account."}
                </p>
              </div>
              <Badge variant={totpEnabled ? "success" : "outline"}>
                {totpEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            {!totpEnabled && !showTotpSetup && (
              <Button onClick={handleSetupTotp} disabled={totpLoading}>
                {totpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
                Set Up Two-Factor Authentication
              </Button>
            )}

            {totpEnabled && (
              <Button variant="destructive" onClick={handleDisableTotp} disabled={totpLoading}>
                {totpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Disable Two-Factor Authentication
              </Button>
            )}

            {showTotpSetup && (
              <div className="space-y-4 rounded-md border p-4">
                {totpQrCode && (
                  <div className="space-y-2">
                    <Label>Scan QR Code</Label>
                    <div className="flex justify-center">
                      <img src={totpQrCode} alt="TOTP QR Code" className="h-48 w-48" />
                    </div>
                  </div>
                )}
                {totpSecret && (
                  <div className="space-y-2">
                    <Label>Or enter this key manually</Label>
                    <div className="flex items-center gap-2">
                      <code className="rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">{totpSecret}</code>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="totp-code">Verification Code</Label>
                  <Input
                    id="totp-code"
                    placeholder="Enter 6-digit code from authenticator app"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    maxLength={6}
                    className="max-w-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleVerifyTotp} disabled={totpCode.length !== 6 || verifyingTotp}>
                    {verifyingTotp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Verify & Enable
                  </Button>
                  <Button variant="outline" onClick={() => { setShowTotpSetup(false); setTotpCode(""); setTotpSecret(""); setTotpQrCode(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {sessionsError}
              </div>
            ) : sessionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No active sessions.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {session.userAgent ? session.userAgent.slice(0, 60) : "Unknown device"}
                        </span>
                        <Badge variant={session.isActive ? "success" : "destructive"}>
                          {session.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {session.ipAddress && <span>IP: {session.ipAddress}</span>}
                        <span>Last used: {new Date(session.lastUsedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokingSession === session.id}
                    >
                      {revokingSession === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
