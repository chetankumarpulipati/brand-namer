"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

const STYLE_OPTIONS = [
  "Modern",
  "Classic",
  "Playful",
  "Luxurious",
  "Minimal",
  "Bold",
  "Techy",
  "Natural",
];

const GOAL_OPTIONS = [
  "Memorable",
  "Unique",
  "Descriptive",
  "Emotional",
];

interface QuizResult {
  recommendations: string[];
}

export default function QuizPage() {
  const { token } = useAuth();
  const [industry, setIndustry] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  function toggleStyle(style: string) {
    setStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style],
    );
  }

  function toggleGoal(goal: string) {
    setGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !industry || styles.length === 0 || goals.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.submitQuiz(token, { industry, styles, goals });
      setResult(res as QuizResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setIndustry("");
    setStyles([]);
    setGoals([]);
    setResult(null);
    setError(null);
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Brand Style Quiz</h1>
          <p className="text-muted-foreground">
            Discover your brand style
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {result ? (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-8 text-center">
              <h2 className="text-2xl font-bold">Your Brand Style</h2>
              <p className="mt-2 text-muted-foreground">
                Based on your preferences, here are some recommendations
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-card p-6"
                >
                  <p className="text-lg font-semibold">{rec}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={handleReset}>
              Retake Quiz
            </Button>
          </div>
        ) : !token ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              Sign in to take the brand style quiz
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-lg border bg-card p-6"
          >
            <div>
              <label className="text-sm font-medium">Industry</label>
              <input
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Tech, Fashion, Food"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Styles</label>
              <p className="text-xs text-muted-foreground">
                Select all that apply
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      styles.includes(style)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Goals</label>
              <p className="text-xs text-muted-foreground">
                Select all that apply
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      goals.includes(goal)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                loading ||
                !industry ||
                styles.length === 0 ||
                goals.length === 0
              }
            >
              {loading ? "Analyzing..." : "Discover My Style"}
            </Button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
