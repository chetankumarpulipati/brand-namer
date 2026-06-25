"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useEffect } from "react";

interface SearchResult {
  id?: string;
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

interface DomainEntry {
  tld: string;
  available: boolean;
  price?: number;
}

interface SocialEntry {
  platform: string;
  available: boolean;
  url?: string;
}

interface TrademarkEntry {
  status: string;
  jurisdiction?: string;
  description?: string;
}

const STRATEGIES = ["Acronym", "Compound", "Thesaurus", "Emotional", "Metaphor", "Portmanteau"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [brief, setBrief] = useState("");
  const [strategies, setStrategies] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [domainData, setDomainData] = useState<Record<number, DomainEntry[]>>({});
  const [socialData, setSocialData] = useState<Record<number, SocialEntry[]>>({});
  const [trademarkData, setTrademarkData] = useState<Record<number, TrademarkEntry[]>>({});
  const [loadingDomain, setLoadingDomain] = useState<Record<number, boolean>>({});
  const [loadingSocial, setLoadingSocial] = useState<Record<number, boolean>>({});
  const [loadingTrademark, setLoadingTrademark] = useState<Record<number, boolean>>({});

  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  function toggleStrategy(s: string) {
    setStrategies((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    if (!token) { router.push("/login"); return; }

    setIsSearching(true);
    setSearched(false);
    setResults([]);
    setDomainData({});
    setSocialData({});
    setTrademarkData({});
    try {
      const data = await api.search(
        {
          query: query.trim(),
          industry: industry || undefined,
          count: 10,
          brief: brief.trim() || undefined,
          strategies: strategies.length > 0 ? strategies : undefined,
        },
        token,
      );
      setResults((data as any).results ?? []);
      setSearched(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSave(i: number, resultId?: string) {
    if (!token || !resultId) return;
    setSaving((prev) => ({ ...prev, [i]: true }));
    try {
      await api.saveName(token, resultId);
      toast.success("Name saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving((prev) => ({ ...prev, [i]: false }));
    }
  }

  async function handleDomain(i: number, name: string) {
    if (!token) return;
    setLoadingDomain((prev) => ({ ...prev, [i]: true }));
    try {
      const data = await api.checkDomain(token, { name });
      const entries = Array.isArray(data) ? (data as DomainEntry[]) : (data as any).results ?? (data as any).domains ?? [];
      setDomainData((prev) => ({ ...prev, [i]: entries }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Domain check failed");
      setDomainData((prev) => ({ ...prev, [i]: [] }));
    } finally {
      setLoadingDomain((prev) => ({ ...prev, [i]: false }));
    }
  }

  async function handleSocial(i: number, name: string) {
    if (!token) return;
    setLoadingSocial((prev) => ({ ...prev, [i]: true }));
    try {
      const data = await api.checkSocial(token, name);
      const entries = Array.isArray(data) ? (data as SocialEntry[]) : (data as any).results ?? (data as any).platforms ?? [];
      setSocialData((prev) => ({ ...prev, [i]: entries }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Social check failed");
      setSocialData((prev) => ({ ...prev, [i]: [] }));
    } finally {
      setLoadingSocial((prev) => ({ ...prev, [i]: false }));
    }
  }

  async function handleTrademark(i: number, name: string) {
    if (!token) return;
    setLoadingTrademark((prev) => ({ ...prev, [i]: true }));
    try {
      const data = await api.checkTrademark(token, name);
      const entries = Array.isArray(data) ? (data as TrademarkEntry[]) : (data as any).results ?? (data as any).trademarks ?? [];
      setTrademarkData((prev) => ({ ...prev, [i]: entries }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Trademark check failed");
      setTrademarkData((prev) => ({ ...prev, [i]: [] }));
    } finally {
      setLoadingTrademark((prev) => ({ ...prev, [i]: false }));
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Brand Name Generator</h1>
        <p className="mt-2 text-muted-foreground">
          Enter keywords related to your brand, and our AI will generate unique name suggestions.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4 rounded-lg border p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Keywords / Description</label>
          <Input
            placeholder="e.g., eco-friendly tech startup for sustainable energy"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Industry (optional)</label>
          <Input
            placeholder="e.g., Technology, Healthcare, Fashion"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Brief / Extra Context (optional)</label>
          <textarea
            placeholder="Describe your brand voice, target audience, or any specific preferences..."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Strategies (optional)</label>
          <div className="flex flex-wrap gap-3">
            {STRATEGIES.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={strategies.includes(s)}
                  onChange={() => toggleStrategy(s)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {s}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={isSearching || !query.trim()} className="w-full">
          {isSearching ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </span>
          ) : (
            "Generate Names"
          )}
        </Button>
      </form>

      {searched && results.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center text-yellow-800">
          No names generated. Try different keywords or check your credit balance.
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Generated Names</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((result, i) => (
              <div key={i} className="rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-xl font-bold">{result.name}</h3>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {result.strategy}
                  </span>
                </div>
                {result.meaning && (
                  <p className="mb-3 text-sm text-muted-foreground">{result.meaning}</p>
                )}
                {result.scores && (
                  <div className="grid grid-cols-5 gap-1 text-center text-xs">
                    <ScoreBar label="Memory" value={result.scores.memorability} />
                    <ScoreBar label="Pronounce" value={result.scores.pronounceability} />
                    <ScoreBar label="Meaning" value={result.scores.meaning} />
                    <ScoreBar label="Unique" value={result.scores.uniqueness} />
                    <ScoreBar label="SEO" value={result.scores.seo} />
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving[i]}
                    onClick={() => handleSave(i, result.id)}
                  >
                    {saving[i] ? "Saving..." : "❤️ Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingDomain[i]}
                    onClick={() => handleDomain(i, result.name)}
                  >
                    {loadingDomain[i] ? "..." : "🌐 Domain"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingSocial[i]}
                    onClick={() => handleSocial(i, result.name)}
                  >
                    {loadingSocial[i] ? "..." : "📱 Social"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingTrademark[i]}
                    onClick={() => handleTrademark(i, result.name)}
                  >
                    {loadingTrademark[i] ? "..." : "™️ Trademark"}
                  </Button>
                </div>

                {domainData[i] && domainData[i].length > 0 && (
                  <div className="mt-3 rounded-md border bg-green-50 p-3 text-sm">
                    <p className="mb-1 font-medium text-green-800">Domain Availability</p>
                    <ul className="space-y-0.5">
                      {domainData[i].map((d, j) => (
                        <li key={j} className="flex items-center justify-between">
                          <span className="font-mono text-green-700">{d.tld}</span>
                          <span className={d.available ? "text-green-600" : "text-red-500"}>
                            {d.available ? `Available${d.price ? ` - $${d.price}` : ""}` : "Unavailable"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {socialData[i] && socialData[i].length > 0 && (
                  <div className="mt-3 rounded-md border bg-blue-50 p-3 text-sm">
                    <p className="mb-1 font-medium text-blue-800">Social Availability</p>
                    <ul className="space-y-0.5">
                      {socialData[i].map((s, j) => (
                        <li key={j} className="flex items-center justify-between">
                          <span className="text-blue-700">{s.platform}</span>
                          <span className={s.available ? "text-green-600" : "text-red-500"}>
                            {s.available ? "Available" : "Taken"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(() => {
                  const td = trademarkData[i];
                  if (!td || td.length === 0) return null;
                  const first = td[0]!;
                  if (first.status === "check unavailable (no API key)")
                    return (
                      <div className="mt-3 rounded-md border bg-gray-50 p-3 text-sm">
                        <p className="mb-1 font-medium text-gray-600">Trademark Check</p>
                        <p className="text-gray-500">Add a free USPTO API key in settings to enable trademark checking.</p>
                      </div>
                    );
                  return (
                    <div className="mt-3 rounded-md border bg-purple-50 p-3 text-sm">
                      <p className="mb-1 font-medium text-purple-800">Trademark Status</p>
                      <ul className="space-y-0.5">
                        {td.map((t, j) => (
                          <li key={j} className="flex items-center justify-between">
                            <span className="text-purple-700">{t.jurisdiction ?? "Global"}</span>
                            <span className="font-medium text-purple-900">{t.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="mb-1 h-16 w-full rounded bg-gray-100" style={{ position: "relative" }}>
        <div
          className="absolute bottom-0 w-full rounded bg-blue-500 transition-all"
          style={{ height: `${value}%` }}
        />
      </div>
      <span className="font-medium">{value}</span>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}
