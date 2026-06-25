"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

interface DailyChallenge {
  id: string;
  prompt: string;
  industry: string;
  date: string;
  submissionCount?: number;
}

export default function ChallengePage() {
  const { token } = useAuth();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submission, setSubmission] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getDailyChallenge()
      .then((res) => {
        if (cancelled) return;
        setChallenge(res as DailyChallenge);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load challenge");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !challenge || !submission) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitChallenge(token, challenge.id, submission);
      setSubmitted(true);
      setShowForm(false);
      setSubmission("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit challenge");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Daily Challenge</h1>
          <div className="animate-pulse space-y-4 rounded-lg border bg-card p-8">
            <div className="h-6 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error && !challenge) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Daily Challenge</h1>
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

  if (!challenge) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Daily Challenge</h1>
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">No challenge today</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Daily Challenge</h1>
          <p className="text-muted-foreground">
            Test your naming skills daily
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-lg border bg-card p-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium">
              {challenge.industry}
            </span>
            <span className="text-sm text-muted-foreground">
              {challenge.date
                ? new Date(challenge.date).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </span>
          </div>
          <p className="text-lg leading-relaxed">{challenge.prompt}</p>
          {challenge.submissionCount != null && (
            <p className="mt-4 text-sm text-muted-foreground">
              {challenge.submissionCount} submission{challenge.submissionCount !== 1 ? "s" : ""} so far
            </p>
          )}
        </div>

        {submitted ? (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-700">
            You submitted your entry for today&apos;s challenge!
          </div>
        ) : token && (
          <div>
            {showForm ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-lg border bg-card p-6"
              >
                <h2 className="text-lg font-semibold">Your Submission</h2>
                <div>
                  <label className="text-sm font-medium">Brand Name Idea</label>
                  <input
                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Enter your brand name idea..."
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || !submission}>
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setSubmission("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setShowForm(true)}>Submit Entry</Button>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
