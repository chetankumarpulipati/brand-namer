"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

interface ContestItem {
  id: string;
  title: string;
  brief: string;
  prize: number;
  entryFee: number;
  deadline: string;
  status: string;
  entryCount: number;
  entries: { id: string; name: string; user: { id: string; name: string } }[];
  creator: { id: string; name: string };
}

function Countdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState("");
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(deadline).getTime() - Date.now();
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
  }, [deadline]);

  return (
    <span className={ended ? "font-medium text-destructive" : "text-muted-foreground"}>
      {remaining}
    </span>
  );
}

export default function ContestsPage() {
  const { token } = useAuth();
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    brief: "",
    prize: "",
    entryFee: "",
    deadline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const limit = 12;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listContests(page, limit)
      .then((res) => {
        if (cancelled) return;
        setContests(res.items as ContestItem[]);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load contests");
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
      await api.createContest(token, {
        title: form.title,
        brief: form.brief,
        prize: parseFloat(form.prize),
        entryFee: parseFloat(form.entryFee),
        deadline: new Date(form.deadline).toISOString(),
      });
      setForm({ title: "", brief: "", prize: "", entryFee: "", deadline: "" });
      setShowForm(false);
      setPage(1);
      const res = await api.listContests(1, limit);
      setContests(res.items as ContestItem[]);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create contest");
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Contests</h1>
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

  if (error && contests.length === 0) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Contests</h1>
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
            <h1 className="text-3xl font-bold">Contests</h1>
            <p className="text-muted-foreground">
              Compete in naming contests
            </p>
          </div>
          {token && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Create Contest"}
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
            <h2 className="text-lg font-semibold">New Contest</h2>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Brief</label>
              <textarea
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={3}
                value={form.brief}
                onChange={(e) => setForm({ ...form, brief: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prize ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.prize}
                onChange={(e) => setForm({ ...form, prize: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Entry Fee ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.entryFee}
                onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Deadline</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Contest"}
            </Button>
          </form>
        )}

        {contests.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">No contests yet</p>
            {token && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                Create the first contest
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {contests.map((contest) => {
                const isExpanded = expandedId === contest.id;
                return (
                  <div
                    key={contest.id}
                    className="cursor-pointer rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : contest.id)
                    }
                  >
                    <h3 className="text-lg font-semibold">{contest.title}</h3>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      ${contest.prize}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>Entry fee: ${contest.entryFee}</p>
                      <p>Entries: {contest.entryCount}</p>
                      <p>
                        Status:{" "}
                        <span
                          className={
                            contest.status === "active"
                              ? "font-medium text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          {contest.status}
                        </span>
                      </p>
                      <p>
                        Deadline: <Countdown deadline={contest.deadline} />
                      </p>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        {contest.brief && (
                          <p className="mb-3 text-sm">{contest.brief}</p>
                        )}
                        <p className="mb-2 text-sm font-medium">
                          Entries ({contest.entryCount}):
                        </p>
                        {contest.entries && contest.entries.length > 0 ? (
                          <ul className="space-y-1">
                            {contest.entries.map((entry) => (
                              <li
                                key={entry.id}
                                className="text-sm text-muted-foreground"
                              >
                                {entry.name} by {entry.user?.name ?? "Unknown"}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No entries yet
                          </p>
                        )}
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
