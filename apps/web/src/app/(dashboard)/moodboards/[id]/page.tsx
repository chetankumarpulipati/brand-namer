"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import Link from "next/link";

interface MoodBoardItem {
  id: string;
  name: string;
  createdAt: string;
}

interface MoodBoardDetail {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  items?: MoodBoardItem[];
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function MoodBoardDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [moodboard, setMoodBoard] = useState<MoodBoardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!token || authLoading || !params.id) return;
    setLoading(true);
    setError(null);
    api
      .getMoodBoard(token, params.id)
      .then((data) => setMoodBoard(data as MoodBoardDetail))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load mood board"))
      .finally(() => setLoading(false));
  }, [token, user, authLoading, router, params.id]);

  async function handleRemoveItem(itemId: string) {
    if (!token || !params.id) return;
    setError(null);
    try {
      await api.updateName(token, itemId, { moodBoardId: null });
      setMoodBoard((prev) =>
        prev ? { ...prev, items: prev.items?.filter((i) => i.id !== itemId) } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
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
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/dashboard/moodboards">&larr; Back to Mood Boards</Link>
        </Button>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : !moodboard ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-lg font-medium">Mood board not found</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold">{moodboard.name}</h1>
              {moodboard.description && (
                <p className="mt-1 text-muted-foreground">{moodboard.description}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Created {new Date(moodboard.createdAt).toLocaleDateString()}
              </p>
            </div>

            {moodboard.items && moodboard.items.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {moodboard.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRemoveItem(item.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <p className="mb-2 text-lg font-medium">No items yet</p>
                <p className="text-sm text-muted-foreground">
                  Add brand names to this mood board from the search results.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
