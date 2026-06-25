"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import Link from "next/link";

interface MoodBoard {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border p-4">
      <div className="mb-2 h-6 w-3/4 rounded bg-muted" />
      <div className="mb-1 h-4 w-full rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
    </div>
  );
}

export default function MoodBoardsPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [moodboards, setMoodBoards] = useState<MoodBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!token || authLoading) return;
    setLoading(true);
    setError(null);
    api
      .listMoodBoards(token)
      .then((data) => setMoodBoards((data as { items: MoodBoard[] }).items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load mood boards"))
      .finally(() => setLoading(false));
  }, [token, user, authLoading, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.createMoodBoard(token, { name: name.trim(), description: description.trim() || undefined });
      setMoodBoards((prev) => [...prev, created as MoodBoard]);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create mood board");
    } finally {
      setCreating(false);
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
          <h1 className="text-3xl font-bold">Mood Boards</h1>
          <p className="text-muted-foreground">Organize your brand name ideas into mood boards.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fashion Brands" disabled={creating} />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A collection of..." disabled={creating} />
          </div>
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? "Creating..." : "Create Mood Board"}
          </Button>
        </form>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : moodboards.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="mb-2 text-lg font-medium">No mood boards yet</p>
            <p className="text-sm text-muted-foreground">Create your first one!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {moodboards.map((mb) => (
              <Link
                key={mb.id}
                href={`/dashboard/moodboards/${mb.id}`}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <p className="mb-1 font-medium">{mb.name}</p>
                {mb.description && (
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{mb.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {new Date(mb.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
