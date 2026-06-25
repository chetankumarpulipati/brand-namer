"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [searchCount, setSearchCount] = useState<number | null>(null);
  const [creditInfo, setCreditInfo] = useState<{ credits: number; lifetimeCredits: number; tier: string } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token || !user) return;
    const t = token;

    async function loadStats() {
      try {
        const [history, credits] = await Promise.all([
          api.searchHistory(t),
          api.getCredits(t),
        ]);
        setSearchCount((history as any).items?.length ?? 0);
        setCreditInfo(credits);
      } catch {
        // silently fail; keep UI usable with fallback values
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  }, [token, user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const displayedCredits = creditInfo?.credits ?? user.credits;
  const displayedLevel = (user as any).level?.toString() ?? creditInfo?.tier ?? "1";
  const displayedTier = user.tier;

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground">Generate brand names, check availability, and manage your projects.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <DashboardCard title="Quick Search" description="Generate brand names with AI" href="/search" />
          <DashboardCard title="Saved Names" description="View your saved brand names" href="/saved" />
          <DashboardCard title="Workspaces" description="Collaborate with your team" href="/workspaces" />
          <DashboardCard title="Marketplace" description="Buy & sell brand names" href="/marketplace" />
          <DashboardCard title="Billing" description="Manage your subscription" href="/billing" />
          <DashboardCard title="Settings" description="Account & API settings" href="/settings" />
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Your Stats</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Credits" value={statsLoading ? "..." : displayedCredits.toString()} />
            <Stat label="Level" value={statsLoading ? "..." : displayedLevel} />
            <Stat label="Tier" value={displayedTier} />
            <Stat label="Searches" value={statsLoading ? "..." : (searchCount ?? 0).toString()} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function DashboardCard({ title, description, href }: { title: string; description: string; href: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="flex h-auto flex-col items-start gap-2 p-6 text-left"
      onClick={() => router.push(href)}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
