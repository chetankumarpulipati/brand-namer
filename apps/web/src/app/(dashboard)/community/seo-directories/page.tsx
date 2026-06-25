"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Globe, ExternalLink } from "lucide-react";

interface SeoDirectory {
  id?: string;
  industry: string;
  title: string;
  description?: string;
  h1?: string;
  metaDescription?: string;
  names: string[];
  isGenerated: boolean;
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

const INDUSTRIES = [
  "tech", "healthcare", "finance", "food", "fashion", "education",
  "real-estate", "travel", "entertainment", "sports", "legal", "beauty",
];

export default function SeoDirectoriesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [searchIndustry, setSearchIndustry] = useState("");
  const [directory, setDirectory] = useState<SeoDirectory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchIndustry.trim()) return;
    setLoading(true);
    setError(null);
    setDirectory(null);
    try {
      const data = await api.getSeoDirectories(searchIndustry.trim().toLowerCase()) as unknown as SeoDirectory;
      setDirectory(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load directory");
    } finally {
      setLoading(false);
    }
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
        <div>
          <h1 className="text-3xl font-bold">SEO Directories</h1>
          <p className="text-muted-foreground">Browse brand names curated by industry for SEO-rich directories.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    id="industry"
                    value={searchIndustry}
                    onChange={(e) => setSearchIndustry(e.target.value)}
                    placeholder="e.g. tech, healthcare, food"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                    list="industry-suggestions"
                  />
                  <datalist id="industry-suggestions">
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind} />
                    ))}
                  </datalist>
                </div>
                <Button onClick={handleSearch} disabled={!searchIndustry.trim() || loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((ind) => (
                <Button
                  key={ind}
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearchIndustry(ind); }}
                >
                  {ind}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {directory && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{directory.title}</h2>
                {directory.description && (
                  <p className="text-muted-foreground">{directory.description}</p>
                )}
              </div>

              {Array.isArray(directory.names) && directory.names.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {directory.names.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Globe className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No names generated yet for this industry.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
