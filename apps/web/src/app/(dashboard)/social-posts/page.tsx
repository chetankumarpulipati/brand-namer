"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Share2, Trash2, MessageSquare, Twitter, Send } from "lucide-react";

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  mediaUrl: string;
  status: string;
  postUrl?: string;
  postedAt: string;
  createdAt: string;
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}>{children}</div>;
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h3>;
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "outline" }) {
  const variants: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    outline: "border text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant] ?? variants.default)}>
      {children}
    </span>
  );
}

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X", icon: Twitter },
  { id: "linkedin", label: "LinkedIn", icon: Share2 },
  { id: "instagram", label: "Instagram", icon: MessageSquare },
  { id: "facebook", label: "Facebook", icon: MessageSquare },
  { id: "threads", label: "Threads", icon: MessageSquare },
];

export default function SocialPostsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [platform, setPlatform] = useState("twitter");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listSocialPosts(token) as { items: SocialPost[] };
      setPosts(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load social posts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchPosts();
  }, [token, fetchPosts]);

  const handleCreate = async () => {
    if (!token || !content.trim()) return;
    setCreating(true);
    try {
      await api.createSocialPost(token, {
        platform,
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
      });
      setContent("");
      setMediaUrl("");
      setShowCreate(false);
      await fetchPosts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this post?")) return;
    setDeleting(id);
    try {
      await api.deleteSocialPost(token, id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete post");
    } finally {
      setDeleting(null);
    }
  };

  const getPlatformIcon = (p: string) => {
    const found = PLATFORMS.find((pl) => pl.id === p);
    if (found) return <found.icon className="h-4 w-4" />;
    return <Share2 className="h-4 w-4" />;
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Social Posts</h1>
            <p className="text-muted-foreground">Create and manage social media content for your brand names.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Create Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Platform</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <Button
                      key={p.id}
                      variant={platform === p.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlatform(p.id)}
                    >
                      <p.icon className="mr-2 h-4 w-4" /> {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">{content.length} characters</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="media">Media URL (optional)</Label>
                <Input id="media" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!content.trim() || creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Create Post
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-6"><div className="h-20 animate-pulse rounded bg-muted" /></CardContent></Card>)}</div>
        ) : posts.length === 0 && !showCreate ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Share2 className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No social posts yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(post.platform)}
                      <span className="text-sm font-medium capitalize">{post.platform}</span>
                      <Badge variant={post.status === "posted" ? "success" : post.status === "draft" ? "warning" : "default"}>
                        {post.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.postUrl && (
                        <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          View
                        </a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} disabled={deleting === post.id}>
                        {deleting === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  {post.mediaUrl && (
                    <img src={post.mediaUrl} alt="" className="max-h-48 rounded-md object-cover" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
