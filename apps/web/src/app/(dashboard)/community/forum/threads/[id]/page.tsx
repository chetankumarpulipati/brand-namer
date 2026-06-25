"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

interface ThreadDetail {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string };
  posts: {
    id: string;
    content: string;
    author: { id: string; name: string };
    createdAt: string;
  }[];
}

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getForumThread(id)
      .then((res) => {
        if (cancelled) return;
        setThread(res as ThreadDetail);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load thread");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.createForumPost(token, id, reply);
      setReply("");
      const res = await api.getForumThread(id);
      setThread(res as ThreadDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setSending(false);
    }
  }

  async function handleVote(vote: number) {
    if (!token || voteLoading) return;
    setVoteLoading(true);
    setError(null);
    try {
      await api.voteForumThread(token, id, vote);
      const res = await api.getForumThread(id);
      setThread(res as ThreadDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setVoteLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-20 w-full rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-20 w-full rounded bg-muted" />
            <div className="h-20 w-full rounded bg-muted" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !thread) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-destructive">{error ?? "Thread not found"}</p>
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
        <div>
          <h1 className="text-3xl font-bold">{thread.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            by {thread.author?.name ?? "Unknown"}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-lg border bg-card p-6">
          <p className="whitespace-pre-wrap text-sm">{thread.content}</p>
        </div>

        {token && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={voteLoading}
              onClick={() => handleVote(1)}
            >
              ▲ Upvote
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={voteLoading}
              onClick={() => handleVote(-1)}
            >
              ▼ Downvote
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Posts ({thread.posts?.length ?? 0})
          </h2>

          {thread.posts && thread.posts.length > 0 ? (
            <div className="space-y-3">
              {thread.posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {post.author?.name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">No replies yet</p>
            </div>
          )}
        </div>

        {token && (
          <form
            onSubmit={handleReply}
            className="space-y-4 rounded-lg border bg-card p-6"
          >
            <h3 className="text-lg font-semibold">Reply</h3>
            <div>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Write your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={sending || !reply.trim()}>
              {sending ? "Posting..." : "Post Reply"}
            </Button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
