"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Switch from "@radix-ui/react-switch";
import { format } from "date-fns";
import {
  CreditCard,
  Receipt,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

interface Subscription {
  id: string;
  tier: string;
  status: string;
  creditsPerDay: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  invoicePdf?: string;
}

interface UsageAlert {
  id: string;
  threshold: number;
  email: boolean;
  createdAt: string;
}

const FREE_TIER_INFO = {
  tier: "Free",
  creditsPerDay: 10,
  status: "active",
};

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      {children}
    </div>
  );
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant] ?? variants.default,
      )}
    >
      {children}
    </span>
  );
}

function statusBadgeVariant(status: string): "success" | "warning" | "destructive" | "default" {
  switch (status) {
    case "active":
    case "paid":
      return "success";
    case "past_due":
    case "open":
      return "warning";
    case "canceled":
    case "unpaid":
    case "void":
      return "destructive";
    default:
      return "default";
  }
}

export default function BillingPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [subError, setSubError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invError, setInvError] = useState<string | null>(null);
  const [credits, setCredits] = useState<{ credits: number; lifetimeCredits: number; tier: string } | null>(null);
  const [creditsError, setCreditsError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<UsageAlert[]>([]);
  const [alertError, setAlertError] = useState<string | null>(null);

  const [newThreshold, setNewThreshold] = useState("");
  const [newEmail, setNewEmail] = useState(true);
  const [addingAlert, setAddingAlert] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const sub = await api.getSubscription(token);
      setSubscription(sub as Subscription | null);
    } catch (e) {
      setSubError(e instanceof Error ? e.message : "Failed to load subscription");
    }
    try {
      const inv = await api.getInvoices(token);
      setInvoices((inv as { items: Invoice[] }).items ?? []);
    } catch (e) {
      setInvError(e instanceof Error ? e.message : "Failed to load invoices");
    }
    try {
      const cr = await api.getCredits(token);
      setCredits(cr);
    } catch (e) {
      setCreditsError(e instanceof Error ? e.message : "Failed to load credits");
    }
    try {
      const al = await api.getUsageAlerts(token);
      setAlerts((al as { items: UsageAlert[] }).items ?? []);
    } catch (e) {
      setAlertError(e instanceof Error ? e.message : "Failed to load usage alerts");
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const handleUpgrade = async () => {
    if (!token) return;
    setActionLoading("upgrade");
    try {
      const result = await api.createCheckoutSession(
        "price_monthly",
        window.location.origin + "/billing?success=1",
        window.location.origin + "/billing?canceled=1",
        token,
      );
      window.location.href = result.url;
    } catch (e) {
      console.error("Upgrade failed", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!token) return;
    setActionLoading("portal");
    try {
      const result = await api.createPortalSession(window.location.origin + "/billing", token);
      window.location.href = result.url;
    } catch (e) {
      console.error("Portal session failed", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAlert = async () => {
    if (!token || !newThreshold) return;
    const threshold = parseInt(newThreshold, 10);
    if (isNaN(threshold) || threshold < 1) return;
    setAddingAlert(true);
    try {
      await api.upsertUsageAlert(token, { threshold, email: newEmail });
      setNewThreshold("");
      setNewEmail(true);
      const al = await api.getUsageAlerts(token);
      setAlerts((al as { items: UsageAlert[] }).items ?? []);
    } catch (e) {
      console.error("Add alert failed", e);
    } finally {
      setAddingAlert(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteUsageAlert(token, id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Delete alert failed", e);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tierLimit = subscription?.creditsPerDay ?? FREE_TIER_INFO.creditsPerDay;
  const currentCredits = credits?.credits ?? user.credits ?? 0;
  const creditsPercent = Math.min((currentCredits / tierLimit) * 100, 100);

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your plan, invoices, and usage alerts.</p>
        </div>

        {subError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {subError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription === undefined ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{subscription?.tier ?? FREE_TIER_INFO.tier}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        Status:{" "}
                        <Badge variant={statusBadgeVariant(subscription?.status ?? "active")}>
                          {subscription?.status ?? "active"}
                        </Badge>
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-primary/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Credits per day</span>
                      <p className="font-medium">{tierLimit}</p>
                    </div>
                    {subscription?.currentPeriodEnd && (
                      <div>
                        <span className="text-muted-foreground">Current period ends</span>
                        <p className="font-medium">{format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}</p>
                      </div>
                    )}
                  </div>
                  {subscription?.cancelAtPeriodEnd && (
                    <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                      Your subscription will cancel at the end of the current period.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Credit Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!credits && !creditsError ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ) : creditsError ? (
                <p className="text-sm text-red-500">{creditsError}</p>
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold">{currentCredits}</span>
                    <span className="text-sm text-muted-foreground">/ {tierLimit} daily credits</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        creditsPercent > 80
                          ? "bg-red-500"
                          : creditsPercent > 50
                            ? "bg-yellow-500"
                            : "bg-green-500",
                      )}
                      style={{ width: `${creditsPercent}%` }}
                    />
                  </div>
                  {credits && credits.lifetimeCredits > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Lifetime credits: {credits.lifetimeCredits}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          {subscription ? (
            <Button onClick={handleManageBilling} disabled={actionLoading === "portal"}>
              {actionLoading === "portal" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Manage Billing
            </Button>
          ) : (
            <Button onClick={handleUpgrade} disabled={actionLoading === "upgrade"}>
              {actionLoading === "upgrade" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Upgrade Plan
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invError ? (
              <p className="text-sm text-red-500">{invError}</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Invoice</th>
                      <th className="pb-3 pr-4 font-medium">Amount</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 font-medium">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-mono text-xs">{inv.id.slice(0, 12)}...</td>
                        <td className="py-3 pr-4">
                          {((inv.amount ?? 0) / 100).toFixed(2)}{" "}
                          {(inv.currency ?? "usd").toUpperCase()}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusBadgeVariant(inv.status)}>
                            {inv.status === "open"
                              ? "Pending"
                              : inv.status === "paid"
                                ? "Paid"
                                : inv.status === "unpaid"
                                  ? "Unpaid"
                                  : inv.status === "void"
                                    ? "Void"
                                    : inv.status === "past_due"
                                      ? "Past Due"
                                      : inv.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {inv.created ? format(new Date(inv.created), "MMM d, yyyy") : "-"}
                        </td>
                        <td className="py-3">
                          {inv.invoicePdf ? (
                            <a
                              href={inv.invoicePdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              PDF <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Usage Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertError ? (
              <p className="text-sm text-red-500">{alertError}</p>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No usage alerts configured.</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{alert.threshold}%</span>
                      <span className="text-muted-foreground">of daily limit</span>
                      {alert.email && (
                        <Badge variant="outline">
                          <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                          Email
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-end gap-3 rounded-md border p-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="threshold">Threshold (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g. 80"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Label htmlFor="email-toggle">Email notification</Label>
                <Switch.Root
                  id="email-toggle"
                  checked={newEmail}
                  onCheckedChange={setNewEmail}
                  className="relative h-5 w-9 rounded-full border border-input bg-muted data-[state=checked]:bg-primary"
                >
                  <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-background shadow transition-transform data-[state=checked]:translate-x-[18px]" />
                </Switch.Root>
              </div>
              <Button onClick={handleAddAlert} disabled={!newThreshold || addingAlert}>
                {addingAlert ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                Add Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
