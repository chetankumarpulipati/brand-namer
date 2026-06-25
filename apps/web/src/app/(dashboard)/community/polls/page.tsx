"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, BarChart3, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface Poll {
  id: string;
  question: string;
  options: string[];
  totalVotes: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  _count: { votes: number };
}

interface PollDetail extends Poll {
  votes: { optionIndex: number; userId: string }[];
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

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "destructive" | "outline" }) {
  const variants: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    outline: "border text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant] ?? variants.default)}>
      {children}
    </span>
  );
}

export default function PollsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [optionInputs, setOptionInputs] = useState(["", ""]);
  const [creating, setCreating] = useState(false);
  const [votingPoll, setVotingPoll] = useState<string | null>(null);
  const [expandedPoll, setExpandedPoll] = useState<string | null>(null);
  const [pollDetails, setPollDetails] = useState<Record<string, PollDetail>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listPolls(page, limit) as { items: Poll[]; total: number };
      setPolls(data.items ?? []);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const addOptionInput = () => {
    if (optionInputs.length < 10) setOptionInputs([...optionInputs, ""]);
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...optionInputs];
    updated[index] = value;
    setOptionInputs(updated);
  };

  const removeOption = (index: number) => {
    if (optionInputs.length > 2) {
      setOptionInputs(optionInputs.filter((_, i) => i !== index));
    }
  };

  const handleCreatePoll = async () => {
    if (!token || !question.trim()) return;
    const options = optionInputs.filter((o) => o.trim());
    if (options.length < 2) return;
    setCreating(true);
    try {
      await api.createPoll(token, { question: question.trim(), options });
      setQuestion("");
      setOptionInputs(["", ""]);
      setShowCreate(false);
      await fetchPolls();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create poll");
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!token) return;
    setVotingPoll(pollId);
    try {
      await api.votePoll(token, pollId, optionIndex);
      const data = await api.getPoll(pollId) as PollDetail;
      setPollDetails((prev) => ({ ...prev, [pollId]: data }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to vote");
    } finally {
      setVotingPoll(null);
    }
  };

  const loadPollDetail = async (pollId: string) => {
    if (expandedPoll === pollId) {
      setExpandedPoll(null);
      return;
    }
    try {
      const data = await api.getPoll(pollId) as PollDetail;
      setPollDetails((prev) => ({ ...prev, [pollId]: data }));
      setExpandedPoll(pollId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load poll details");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getOptionVotes = (pollId: string, optionIndex: number) => {
    const detail = pollDetails[pollId];
    if (!detail?.votes) return 0;
    return detail.votes.filter((v) => v.optionIndex === optionIndex).length;
  };

  const getTotalVotes = (pollId: string) => {
    const detail = pollDetails[pollId];
    return detail?.votes?.length ?? 0;
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
            <h1 className="text-3xl font-bold">Polls</h1>
            <p className="text-muted-foreground">Create and vote in community polls.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
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
              <CardTitle>Create a Poll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What's your favorite naming style?"
                />
              </div>
              <div className="space-y-3">
                <Label>Options</Label>
                {optionInputs.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                    />
                    {optionInputs.length > 2 && (
                      <Button variant="ghost" size="sm" onClick={() => removeOption(i)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                {optionInputs.length < 10 && (
                  <Button variant="outline" size="sm" onClick={addOptionInput}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreatePoll} disabled={!question.trim() || optionInputs.filter((o) => o.trim()).length < 2 || creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                  Create Poll
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted mb-3" />
                  <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : polls.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No polls yet. Create the first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const detail = pollDetails[poll.id];
              const totalVotes = getTotalVotes(poll.id);
              return (
                <Card key={poll.id}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between cursor-pointer" onClick={() => loadPollDetail(poll.id)}>
                      <div className="space-y-1">
                        <p className="font-medium">{poll.question}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{totalVotes || poll._count?.votes || 0} votes</span>
                          <Badge variant={poll.isActive ? "success" : "default"}>
                            {poll.isActive ? "Active" : "Closed"}
                          </Badge>
                        </div>
                      </div>
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {expandedPoll === poll.id && detail && (
                      <div className="space-y-3 border-t pt-4">
                        {Array.isArray(poll.options) && poll.options.map((option, i) => {
                          const votes = getOptionVotes(poll.id, i);
                          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{option}</span>
                                <span className="text-muted-foreground">{votes} ({pct}%)</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start relative overflow-hidden"
                                onClick={() => handleVote(poll.id, i)}
                                disabled={votingPoll === poll.id}
                              >
                                <div
                                  className="absolute inset-0 bg-primary/10 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="relative z-10">
                                  {votingPoll === poll.id ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin inline" />
                                  ) : null}
                                  Vote {option}
                                </span>
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
