"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

interface WishlistItem {
  id: string;
  name: string;
  createdAt: string;
  items?: { id: string; name: string }[];
  _count?: { items: number };
}

function SkeletonWishlist() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="mb-2 h-6 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function WishlistsPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!token || authLoading) return;
    setLoading(true);
    setError(null);
    api
      .listWishlists(token)
      .then((data) => setWishlists((data as { items: WishlistItem[] }).items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load wishlists"))
      .finally(() => setLoading(false));
  }, [token, user, authLoading, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.createWishlist(token, { name: newName.trim() });
      setWishlists((prev) => [...prev, created as WishlistItem]);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wishlist");
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
          <h1 className="text-3xl font-bold">Wishlists</h1>
          <p className="text-muted-foreground">Manage your brand name wishlists.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleCreate} className="flex items-end gap-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="name">Wishlist Name</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Tech Startup Names"
              disabled={creating}
            />
          </div>
          <Button type="submit" disabled={creating || !newName.trim()}>
            {creating ? "Creating..." : "Create Wishlist"}
          </Button>
        </form>

        {loading ? (
          <SkeletonWishlist />
        ) : wishlists.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="mb-2 text-lg font-medium">No wishlists yet</p>
            <p className="text-sm text-muted-foreground">Create your first wishlist!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wishlists.map((wl) => (
              <div key={wl.id} className="rounded-lg border">
                <button
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
                  onClick={() => setExpandedId(expandedId === wl.id ? null : wl.id)}
                >
                  <div>
                    <p className="font-medium">{wl.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(wl.createdAt).toLocaleDateString()} &middot;{" "}
                      {wl._count?.items ?? wl.items?.length ?? 0} items
                    </p>
                  </div>
                  <span className="text-muted-foreground">
                    {expandedId === wl.id ? "▲" : "▼"}
                  </span>
                </button>
                {expandedId === wl.id && (
                  <div className="border-t p-4">
                    {wl.items && wl.items.length > 0 ? (
                      <ul className="space-y-2">
                        {wl.items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm">
                            <span>{item.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No items in this wishlist.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
