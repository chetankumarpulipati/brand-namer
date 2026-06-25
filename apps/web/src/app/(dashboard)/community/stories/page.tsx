"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

interface StoryItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: { id: string; name: string };
  likeCount: number;
  commentCount: number;
  createdAt: string;
  tags: string[];
  liked: boolean;
}

export default function StoriesPage() {
  const { token } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [liking, setLiking] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);
  const limit = 12;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listStories(page, limit)
      .then((res) => {
        if (cancelled) return;
        setStories(res.items as StoryItem[]);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load stories");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function handleLike(storyId: string) {
    if (!token) return;
    setLiking((prev) => ({ ...prev, [storyId]: true }));
    setError(null);
    try {
      await api.likeStory(token, storyId);
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, liked: !s.liked, likeCount: s.liked ? s.likeCount - 1 : s.likeCount + 1 }
            : s,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to like story");
    } finally {
      setLiking((prev) => ({ ...prev, [storyId]: false }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createStory(token, {
        title: form.title,
        content: form.content,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setForm({ title: "", content: "", tags: "" });
      setShowForm(false);
      setPage(1);
      const res = await api.listStories(1, limit);
      setStories(res.items as StoryItem[]);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Stories</h1>
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

  if (error && stories.length === 0) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Stories</h1>
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
            <h1 className="text-3xl font-bold">Stories</h1>
            <p className="text-muted-foreground">
              Success stories and case studies
            </p>
          </div>
          {token && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Create Story"}
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
            <h2 className="text-lg font-semibold">New Story</h2>
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
              <label className="text-sm font-medium">Content</label>
              <textarea
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={5}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
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
                placeholder="branding, startup, success"
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Story"}
            </Button>
          </form>
        )}

        {stories.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">No stories yet</p>
            {token && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                Share the first story
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => {
                const isExpanded = expandedId === story.id;
                return (
                  <div
                    key={story.id}
                    className="rounded-lg border bg-card p-6"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : story.id)
                      }
                    >
                      <h3 className="text-lg font-semibold">{story.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        by {story.author?.name ?? "Unknown"}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {isExpanded ? story.content : story.excerpt}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(story.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {story.tags && story.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {story.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{story.likeCount} likes</span>
                        <span>{story.commentCount} comments</span>
                      </div>
                      {token && (
                        <Button
                          variant={story.liked ? "default" : "outline"}
                          size="sm"
                          disabled={liking[story.id]}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(story.id);
                          }}
                        >
                          {story.liked ? "Liked" : "Like"}
                        </Button>
                      )}
                    </div>
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
