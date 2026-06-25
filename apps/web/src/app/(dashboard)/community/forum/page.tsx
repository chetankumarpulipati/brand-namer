"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  threadCount: number;
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string };
  postCount: number;
  voteCount: number;
  lastActivity: string;
}

export default function ForumPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingCategories(true);
    setError(null);
    api
      .listForumCategories()
      .then((res) => {
        if (cancelled) return;
        setCategories(res.items as ForumCategory[]);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load categories");
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    let cancelled = false;
    setLoadingThreads(true);
    setError(null);
    api
      .getForumThreads(selectedCategory)
      .then((res) => {
        if (cancelled) return;
        setThreads(res.items as ForumThread[]);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load threads");
      })
      .finally(() => {
        if (!cancelled) setLoadingThreads(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedCategory) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createForumThread(token, {
        title: form.title,
        content: form.content,
        categoryId: selectedCategory,
      });
      setForm({ title: "", content: "" });
      setShowForm(false);
      const res = await api.getForumThreads(selectedCategory);
      setThreads(res.items as ForumThread[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCat = categories.find((c) => c.id === selectedCategory);

  if (loadingCategories) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Forum</h1>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border bg-card p-6"
              >
                <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
                <div className="mb-4 h-4 w-1/2 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error && categories.length === 0) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Forum</h1>
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
            <h1 className="text-3xl font-bold">Forum</h1>
            <p className="text-muted-foreground">
              Discuss branding topics
            </p>
          </div>
          {selectedCategory && (
            <Button
              variant="outline"
              onClick={() => setSelectedCategory(null)}
            >
              Back to Categories
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!selectedCategory ? (
          categories.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <p className="text-muted-foreground">No forum categories yet</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="cursor-pointer rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <h3 className="text-lg font-semibold">{cat.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {cat.description}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {cat.threadCount} threads
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-xl font-semibold">{selectedCat?.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedCat?.description}
              </p>
            </div>

            {token && (
              <div className="flex justify-end">
                <Button onClick={() => setShowForm(!showForm)}>
                  {showForm ? "Cancel" : "Create Thread"}
                </Button>
              </div>
            )}

            {showForm && token && (
              <form
                onSubmit={handleCreate}
                className="space-y-4 rounded-lg border bg-card p-6"
              >
                <h3 className="text-lg font-semibold">New Thread</h3>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <input
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <textarea
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    rows={4}
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Thread"}
                </Button>
              </form>
            )}

            {loadingThreads ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg border bg-card p-4"
                  >
                    <div className="mb-2 h-5 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-lg border bg-card p-12 text-center">
                <p className="text-muted-foreground">No threads yet</p>
                {token && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowForm(true)}
                  >
                    Start the first thread
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/dashboard/community/forum/threads/${thread.id}`}
                    className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{thread.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {thread.content}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>by {thread.author?.name ?? "Unknown"}</span>
                      <span>{thread.postCount} posts</span>
                      <span>{thread.voteCount} votes</span>
                      <span>
                        {thread.lastActivity
                          ? new Date(thread.lastActivity).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
