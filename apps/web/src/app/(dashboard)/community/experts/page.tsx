"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

interface Expert {
  id: string;
  displayName: string;
  bio: string;
  specialtyTags: string[];
  rating: number;
  consultationPrice: number;
}

export default function ExpertsPage() {
  const { token } = useAuth();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listExperts()
      .then((res) => {
        if (cancelled) return;
        setExperts(res.items as Expert[]);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load experts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleBook(expertId: string) {
    if (!token || !message) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createConsultation(token, { expertId, message });
      setBookingId(null);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book consultation");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Experts</h1>
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

  if (error && experts.length === 0) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Experts</h1>
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
        <div>
          <h1 className="text-3xl font-bold">Experts</h1>
          <p className="text-muted-foreground">
            Connect with branding experts
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {experts.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground">No experts available yet</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map((expert) => (
              <div
                key={expert.id}
                className="rounded-lg border bg-card p-6"
              >
                <h3 className="text-lg font-semibold">{expert.displayName}</h3>
                {expert.bio && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {expert.bio}
                  </p>
                )}
                {expert.specialtyTags && expert.specialtyTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {expert.specialtyTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Rating: {expert.rating ? `${expert.rating.toFixed(1)} / 5` : "N/A"}
                  </span>
                  {expert.consultationPrice != null && (
                    <span className="font-medium text-primary">
                      ${expert.consultationPrice}
                    </span>
                  )}
                </div>
                {token && (
                  <div className="mt-4">
                    {bookingId === expert.id ? (
                      <div className="space-y-3">
                        <textarea
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          rows={3}
                          placeholder="Describe what you need help with..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={submitting || !message}
                            onClick={() => handleBook(expert.id)}
                          >
                            {submitting ? "Booking..." : "Confirm"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBookingId(null);
                              setMessage("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setBookingId(expert.id)}
                      >
                        Book Consultation
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
