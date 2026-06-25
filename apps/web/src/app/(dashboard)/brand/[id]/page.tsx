"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ScoreBars } from "@/components/brand/score-bars";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import Link from "next/link";

interface BrandDetail {
  id: string;
  name: string;
  strategy: string;
  meaning?: string;
  scores?: {
    memorability: number;
    pronounceability: number;
    meaning: number;
    uniqueness: number;
    seo: number;
    overall: number;
  };
}

interface DomainResult {
  tld: string;
  available: boolean;
}

interface TrademarkResult {
  status: string;
  message?: string;
  details?: string;
}

interface SocialResult {
  platform: string;
  available: boolean;
  url?: string;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="mb-1 h-3 w-1/4 rounded bg-muted" />
            <div className="h-2.5 w-full rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-32 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function BrandDetailPage() {
  const params = useParams<{ id: string }>();
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [domainResults, setDomainResults] = useState<DomainResult[] | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);

  const [trademarkResult, setTrademarkResult] = useState<TrademarkResult | null>(null);
  const [trademarkLoading, setTrademarkLoading] = useState(false);

  const [socialResults, setSocialResults] = useState<SocialResult[] | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  const [ttsLoading, setTtsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!token || authLoading || !params.id) return;
    setLoading(true);
    setError(null);
    api
      .getNameDetail(token, params.id)
      .then((data) => setBrand(data as BrandDetail))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load brand details"))
      .finally(() => setLoading(false));
  }, [token, user, authLoading, router, params.id]);

  async function handleDomainCheck() {
    if (!token || !params.id) return;
    setDomainLoading(true);
    setDomainResults(null);
    try {
      const data = await api.getNameDomain(token, params.id);
      setDomainResults((data as { results: DomainResult[] }).results ?? []);
    } catch (err) {
      setDomainResults([{ tld: "Error checking domains", available: false }]);
    } finally {
      setDomainLoading(false);
    }
  }

  async function handleTrademarkCheck() {
    if (!token || !params.id) return;
    setTrademarkLoading(true);
    setTrademarkResult(null);
    try {
      const data = await api.getNameTrademark(token, params.id);
      setTrademarkResult(data as TrademarkResult);
    } catch (err) {
      setTrademarkResult({ status: "error", message: err instanceof Error ? err.message : "Check failed" });
    } finally {
      setTrademarkLoading(false);
    }
  }

  async function handleSocialCheck() {
    if (!token || !params.id) return;
    setSocialLoading(true);
    setSocialResults(null);
    try {
      const data = await api.getNameSocial(token, params.id);
      setSocialResults((data as { results: SocialResult[] }).results ?? []);
    } catch (err) {
      setSocialResults([{ platform: "Error checking social", available: false }]);
    } finally {
      setSocialLoading(false);
    }
  }

  async function handleTts() {
    if (!token || !params.id) return;
    setTtsLoading(true);
    try {
      const data = await api.getNameTts(token, params.id);
      const audio = new Audio(data.url);
      audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate TTS");
    } finally {
      setTtsLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/saved">&larr; Back to Saved Names</Link>
        </Button>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : !brand ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-lg font-medium">Brand name not found</p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-4xl font-bold">{brand.name}</h1>
              <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                {brand.strategy}
              </span>
            </div>

            {brand.meaning && (
              <p className="text-muted-foreground">{brand.meaning}</p>
            )}

            {brand.scores && <ScoreBars scores={brand.scores} />}

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDomainCheck} disabled={domainLoading}>
                {domainLoading ? "Checking..." : "Domain Check"}
              </Button>
              <Button onClick={handleTrademarkCheck} disabled={trademarkLoading}>
                {trademarkLoading ? "Checking..." : "Trademark Check"}
              </Button>
              <Button onClick={handleSocialCheck} disabled={socialLoading}>
                {socialLoading ? "Checking..." : "Social Check"}
              </Button>
              <Button onClick={handleTts} disabled={ttsLoading}>
                {ttsLoading ? "Generating..." : "Generate TTS"}
              </Button>
            </div>

            {domainResults && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Domain Availability</h3>
                <div className="space-y-1">
                  {domainResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">No domain results available.</p>
                  )}
                  {domainResults.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${d.available ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <span>{d.tld}</span>
                      <span className="text-muted-foreground">
                        {d.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trademarkResult && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-1 font-semibold">Trademark Status</h3>
                <p className="text-sm">
                  <span className="font-medium">Status:</span> {trademarkResult.status}
                </p>
                {trademarkResult.message && (
                  <p className="text-sm text-muted-foreground">{trademarkResult.message}</p>
                )}
                {trademarkResult.details && (
                  <p className="text-sm text-muted-foreground">{trademarkResult.details}</p>
                )}
              </div>
            )}

            {socialResults && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Social Media Availability</h3>
                <div className="space-y-1">
                  {socialResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">No social results available.</p>
                  )}
                  {socialResults.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${s.available ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <span>{s.platform}</span>
                      <span className="text-muted-foreground">
                        {s.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
