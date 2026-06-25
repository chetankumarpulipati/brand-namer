"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  seller: { id: string; name: string };
  tags: string[];
  createdAt: string;
}

export default function MarketplacePage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    tags: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const limit = 12;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listMarketplace(page, limit)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items as MarketplaceItem[]);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load listings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createMarketplaceListing(token, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setForm({ name: "", description: "", price: "", tags: "" });
      setShowForm(false);
      setPage(1);
      const res = await api.listMarketplace(1, limit);
      setItems(res.items as MarketplaceItem[]);
      setTotal(res.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create listing",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  function Skeleton() {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border bg-card p-6"
          >
            <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
            <div className="mb-4 h-4 w-1/2 rounded bg-muted" />
            <div className="mb-2 h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <Skeleton />
        </div>
      </DashboardShell>
    );
  }

  if (error && items.length === 0) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Marketplace</h1>
          </div>
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">
              Browse brand names for sale
            </p>
          </div>
          {token && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Create Listing"}
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {showForm && token && (
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-lg border bg-card p-6"
          >
            <h2 className="text-lg font-semibold">New Listing</h2>
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Tags (comma separated)
              </label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="creative, tech, short"
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Listing"}
            </Button>
          </form>
        )}

        {items.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">No listings yet</p>
            {token && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                Be the first to list
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="cursor-pointer rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item.id)
                    }
                  >
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      ${item.price}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      by {item.seller?.name ?? "Unknown"}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags
                          .slice(0, isExpanded ? undefined : 3)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        <p className="text-sm">{item.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
