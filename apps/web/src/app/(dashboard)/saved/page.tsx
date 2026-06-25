"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BrandNameCard } from "@/components/brand/brand-name-card";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import Link from "next/link";

interface SavedItem {
  id: string;
  name: string;
  strategy: string;
  meaning?: string;
  scores?: {
    memorability: number;
    pronounceability: number;
    meaning: number;
    uniqueness: number;
    seo: number;
    overall: number;
  };
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border p-4">
      <div className="mb-2 h-7 w-3/4 rounded bg-muted" />
      <div className="mb-1 h-4 w-1/3 rounded bg-muted" />
      <div className="mb-3 h-4 w-full rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="mb-1 h-3 w-1/4 rounded bg-muted" />
            <div className="h-2.5 w-full rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SavedNamesPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!token || authLoading) return;
    setLoading(true);
    setError(null);
    api
      .savedNames(token)
      .then((data) => setItems((data as { items: SavedItem[] }).items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load saved names"))
      .finally(() => setLoading(false));
  }, [token, user, authLoading, router]);

  async function handleUnsave(nameId: string) {
    if (!token) return;
    try {
      await api.unsaveName(token, nameId);
      setItems((prev) => prev.filter((item) => item.id !== nameId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsave");
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Saved Names</h1>
          <p className="text-muted-foreground">Your collection of saved brand name ideas.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="mb-2 text-lg font-medium">No saved names yet</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Try searching for brand names!
            </p>
            <Button asChild>
              <Link href="/search">Search Names</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <BrandNameCard
                key={item.id}
                id={item.id}
                name={item.name}
                strategy={item.strategy}
                meaning={item.meaning}
                scores={item.scores}
                actions={
                  <Button size="sm" variant="outline" onClick={() => handleUnsave(item.id)}>
                    Unsave
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
