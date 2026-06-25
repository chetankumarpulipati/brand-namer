"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Loader2, Award, Trophy, TrendingUp, User } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl?: string;
}

interface UserBadge {
  id: string;
  badge: Badge;
  earnedAt: string;
}

interface LeaderboardEntry {
  id: string;
  userId: string;
  period: string;
  points: number;
  rank: number;
  metricType: string;
  user: { id: string; name: string; image?: string };
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

const PERIODS = ["weekly", "monthly", "allTime"] as const;
const METRICS = ["xp", "names", "votes", "likes"] as const;

export default function BadgesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);
  const [lbPeriod, setLbPeriod] = useState<string>("weekly");
  const [lbMetric, setLbMetric] = useState<string>("xp");

  const [activeTab, setActiveTab] = useState<"badges" | "leaderboard">("badges");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchBadges = useCallback(async () => {
    setBadgesLoading(true);
    try {
      const [all, mine] = await Promise.all([
        api.listBadges() as Promise<{ items: Badge[] }>,
        token ? api.getUserBadges(token) as Promise<{ items: UserBadge[] }> : { items: [] },
      ]);
      setAllBadges(all.items ?? []);
      setUserBadges(mine.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load badges");
    } finally {
      setBadgesLoading(false);
    }
  }, [token]);

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const data = await api.getLeaderboard(lbPeriod, lbMetric) as { items: LeaderboardEntry[]; period: string; metricType: string };
      setLeaderboard(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
    } finally {
      setLbLoading(false);
    }
  }, [lbPeriod, lbMetric]);

  useEffect(() => { fetchBadges(); }, [fetchBadges]);
  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const ownedBadgeIds = new Set(userBadges.map((ub) => ub.badge.id));

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
        <div>
          <h1 className="text-3xl font-bold">Badges & Leaderboard</h1>
          <p className="text-muted-foreground">Track your achievements and compete with the community.</p>
        </div>

        <div className="flex gap-2 border-b pb-2">
          <Button variant={activeTab === "badges" ? "default" : "ghost"} onClick={() => setActiveTab("badges")}>
            <Award className="mr-2 h-4 w-4" /> Badges
          </Button>
          <Button variant={activeTab === "leaderboard" ? "default" : "ghost"} onClick={() => setActiveTab("leaderboard")}>
            <Trophy className="mr-2 h-4 w-4" /> Leaderboard
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {activeTab === "badges" && (
          <>
            {userBadges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Your Badges ({userBadges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {userBadges.map((ub) => (
                      <div key={ub.id} className="flex flex-col items-center gap-1 rounded-lg border p-4 text-center min-w-[120px]">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl">
                          {ub.badge.iconUrl ? (
                            <img src={ub.badge.iconUrl} alt="" className="h-8 w-8" />
                          ) : (
                            <Award className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <p className="text-sm font-medium">{ub.badge.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(ub.earnedAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  All Badges ({allBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badgesLoading ? (
                  <div className="flex flex-wrap gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex flex-col items-center gap-1 rounded-lg border p-4 min-w-[120px]">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : allBadges.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No badges available yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {allBadges.map((badge) => {
                      const owned = ownedBadgeIds.has(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg border p-4 text-center min-w-[120px] transition-opacity",
                            !owned && "opacity-50",
                          )}
                        >
                          <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", owned ? "bg-primary/10" : "bg-muted")}>
                            {badge.iconUrl ? (
                              <img src={badge.iconUrl} alt="" className="h-8 w-8" />
                            ) : (
                              <Award className={cn("h-6 w-6", owned ? "text-primary" : "text-muted-foreground")} />
                            )}
                          </div>
                          <p className="text-sm font-medium">{badge.name}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{badge.description}</p>
                          {owned && <span className="text-xs text-green-600 font-medium">Earned</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "leaderboard" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Period</p>
                  <div className="flex gap-1">
                    {PERIODS.map((p) => (
                      <Button key={p} variant={lbPeriod === p ? "default" : "outline"} size="sm" onClick={() => setLbPeriod(p)}>
                        {p === "allTime" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Metric</p>
                  <div className="flex gap-1">
                    {METRICS.map((m) => (
                      <Button key={m} variant={lbMetric === m ? "default" : "outline"} size="sm" onClick={() => setLbMetric(m)}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {lbLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No leaderboard entries yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => {
                    const isMe = entry.userId === user?.id;
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg p-3",
                          isMe ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50",
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                          i === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          i === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" :
                          i === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          "bg-muted text-muted-foreground",
                        )}>
                          {entry.rank ?? i + 1}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm">
                            {entry.user?.image ? (
                              <img src={entry.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <span className={cn("text-sm", isMe && "font-semibold")}>
                            {entry.user?.name ?? "Anonymous"}
                            {isMe && " (You)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          {entry.points} pts
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
