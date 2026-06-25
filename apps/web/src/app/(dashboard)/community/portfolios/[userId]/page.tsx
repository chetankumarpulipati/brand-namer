"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Loader2, User, Globe, BookOpen, Calendar } from "lucide-react";

interface Portfolio {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  website: string;
  followerCount: number;
  isPublic: boolean;
  user: { name: string; image?: string };
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export default function PortfolioPage() {
  const { user: currentUser, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentUser) router.push("/login");
  }, [currentUser, authLoading, router]);

  const fetchPortfolio = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPortfolio(userId) as Portfolio;
      setPortfolio(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Portfolio not found");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (token) fetchPortfolio();
  }, [token, fetchPortfolio]);

  if (authLoading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          &larr; Back
        </Button>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
              <div className="space-y-3">
                <div className="h-6 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="h-20 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          </div>
        ) : portfolio ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-4xl font-bold text-muted-foreground">
                {portfolio.avatarUrl ? (
                  <img src={portfolio.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  (portfolio.displayName ?? portfolio.user?.name ?? "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{portfolio.displayName ?? portfolio.user?.name ?? "User"}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {portfolio.website && (
                    <a href={portfolio.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                      <Globe className="h-4 w-4" /> {portfolio.website}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" /> {portfolio.followerCount} followers
                  </span>
                </div>
              </div>
            </div>

            {portfolio.bio && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-2 font-semibold">Bio</h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{portfolio.bio}</p>
                </CardContent>
              </Card>
            )}

            {!portfolio.isPublic && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-300">
                This portfolio is private.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
