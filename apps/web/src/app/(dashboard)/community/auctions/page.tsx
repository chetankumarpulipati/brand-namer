"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

interface AuctionItem {
  id: string;
  brandName: string;
  currentBid: number;
  startingBid: number;
  minIncrement: number;
  endTime: string;
  bidCount: number;
  creator: { id: string; name: string };
}

function Countdown({ endTime }: { endTime: string }) {
  const [remaining, setRemaining] = useState("");
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Ended");
        setEnded(true);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h ${minutes}m ${seconds}s`);
      setRemaining(parts.join(" "));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <span className={ended ? "font-medium text-destructive" : "text-muted-foreground"}>
      {remaining}
    </span>
  );
}

export default function AuctionsPage() {
  const { token } = useAuth();
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bids, setBids] = useState<Record<string, string>>({});
  const [bidLoading, setBidLoading] = useState<Record<string, boolean>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    brandName: "",
    startingBid: "",
    minIncrement: "",
    endTime: "",
  });
  const [creating, setCreating] = useState(false);
  const limit = 12;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listAuctions(page, limit)
      .then((res) => {
        if (cancelled) return;
        setAuctions(res.items as AuctionItem[]);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load auctions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function handleBid(auctionId: string) {
    if (!token || !bids[auctionId]) return;
    setBidLoading((prev) => ({ ...prev, [auctionId]: true }));
    setError(null);
    try {
      await api.placeBid(token, auctionId, parseFloat(bids[auctionId]));
      setBids((prev) => ({ ...prev, [auctionId]: "" }));
      const res = await api.listAuctions(page, limit);
      setAuctions(res.items as AuctionItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bid");
    } finally {
      setBidLoading((prev) => ({ ...prev, [auctionId]: false }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError(null);
    try {
      await api.createAuction(token, {
        brandName: createForm.brandName,
        startingBid: parseFloat(createForm.startingBid),
        minIncrement: parseFloat(createForm.minIncrement),
        endTime: new Date(createForm.endTime).toISOString(),
      });
      setCreateForm({
        brandName: "",
        startingBid: "",
        minIncrement: "",
        endTime: "",
      });
      setShowCreateForm(false);
      setPage(1);
      const res = await api.listAuctions(1, limit);
      setAuctions(res.items as AuctionItem[]);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create auction");
    } finally {
      setCreating(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Auctions</h1>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
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
        </div>
      </DashboardShell>
    );
  }

  if (error && auctions.length === 0) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Auctions</h1>
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
            <h1 className="text-3xl font-bold">Auctions</h1>
            <p className="text-muted-foreground">
              Bid on premium brand names
            </p>
          </div>
          {token && (
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? "Cancel" : "Create Auction"}
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {showCreateForm && token && (
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-lg border bg-card p-6"
          >
            <h2 className="text-lg font-semibold">New Auction</h2>
            <div>
              <label className="text-sm font-medium">Brand Name</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createForm.brandName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, brandName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Starting Bid ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createForm.startingBid}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    startingBid: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Minimum Increment ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createForm.minIncrement}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    minIncrement: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Time</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={createForm.endTime}
                onChange={(e) =>
                  setCreateForm({ ...createForm, endTime: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Auction"}
            </Button>
          </form>
        )}

        {auctions.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">No auctions yet</p>
            {token && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateForm(true)}
              >
                Start the first auction
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className="rounded-lg border bg-card p-6"
                >
                  <h3 className="text-lg font-semibold">
                    {auction.brandName}
                  </h3>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    ${auction.currentBid ?? auction.startingBid}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p>Min increment: ${auction.minIncrement}</p>
                    <p>Bids: {auction.bidCount}</p>
                    <p>
                      Ends: <Countdown endTime={auction.endTime} />
                    </p>
                  </div>
                  {token && (
                    <div className="mt-4 flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder="Your bid"
                        value={bids[auction.id] ?? ""}
                        onChange={(e) =>
                          setBids((prev) => ({
                            ...prev,
                            [auction.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={
                          bidLoading[auction.id] || !bids[auction.id]
                        }
                        onClick={() => handleBid(auction.id)}
                      >
                        {bidLoading[auction.id] ? "..." : "Bid"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
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
