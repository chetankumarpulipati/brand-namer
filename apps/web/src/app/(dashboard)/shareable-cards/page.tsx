"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Image, Trash2, Copy, Check, Share2, ExternalLink } from "lucide-react";

interface ShareableCard {
  id: string;
  brandNameId: string;
  title: string;
  shortCode: string;
  clicks: number;
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

function getCardColor(id: string): string {
  const colors = [
    "from-blue-500 to-purple-600",
    "from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
    "from-red-500 to-orange-500",
    "from-green-400 to-emerald-600",
    "from-indigo-600 to-pink-500",
  ];
  const hash = id.slice(0, 8).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length] as string;
}

export default function ShareableCardsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [cards, setCards] = useState<ShareableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [brandNameId, setBrandNameId] = useState("");
  const [cardTitle, setCardTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchCards = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listShareableCards(token) as { items: ShareableCard[] };
      setCards(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchCards();
  }, [token, fetchCards]);

  const handleCreate = async () => {
    if (!token || !brandNameId.trim()) return;
    setCreating(true);
    try {
      await api.createShareableCard(token, {
        brandNameId: brandNameId.trim(),
        title: cardTitle.trim() || undefined,
      });
      setBrandNameId("");
      setCardTitle("");
      setShowCreate(false);
      await fetchCards();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create card");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this card?")) return;
    setDeleting(id);
    try {
      await api.deleteShareableCard(token, id);
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete card");
    } finally {
      setDeleting(null);
    }
  };

  const generateCardUrl = (cardId: string) => {
    return `${window.location.origin}/share/card/${cardId}`;
  };

  const copyCardUrl = async (id: string) => {
    try {
      await navigator.clipboard.writeText(generateCardUrl(id));
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
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
            <h1 className="text-3xl font-bold">Shareable Cards</h1>
            <p className="text-muted-foreground">Create beautiful social cards for your brand names.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Card
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
              <CardTitle>Create Shareable Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="card-name-id">Brand Name ID</Label>
                <Input id="card-name-id" value={brandNameId} onChange={(e) => setBrandNameId(e.target.value)} placeholder="Enter brand name ID" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="card-title">Title (optional)</Label>
                <Input id="card-title" value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} placeholder="Amazing Brand Name" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!brandNameId.trim() || creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Image className="mr-2 h-4 w-4" />}
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-3">
                  <div className="h-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cards.length === 0 && !showCreate ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Share2 className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No shareable cards yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const color = getCardColor(card.id);
              return (
                <Card key={card.id} className="overflow-hidden">
                  <div className={cn("h-32 bg-gradient-to-r flex items-center justify-center", color)}>
                    <div className="text-center text-white">
                      <p className="text-lg font-bold">{card.title || "Brand Name"}</p>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Code: {card.shortCode} · {card.clicks} clicks
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => copyCardUrl(card.id)}>
                        {copied === card.id ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copied === card.id ? "Copied!" : "Copy Link"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(card.id)} disabled={deleting === card.id}>
                        {deleting === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
