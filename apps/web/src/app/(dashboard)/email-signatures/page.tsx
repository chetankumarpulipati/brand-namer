"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Mail, Trash2, Copy, Check } from "lucide-react";

interface EmailSignature {
  id: string;
  name: string;
  title: string;
  company: string;
  html: string;
  isDefault: boolean;
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

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "outline" }) {
  const variants: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    outline: "border text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant] ?? variants.default)}>
      {children}
    </span>
  );
}

export default function EmailSignaturesPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [sigName, setSigName] = useState("");
  const [sigTitle, setSigTitle] = useState("");
  const [sigCompany, setSigCompany] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchSignatures = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listEmailSignatures(token) as { items: EmailSignature[] };
      setSignatures(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load email signatures");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchSignatures();
  }, [token, fetchSignatures]);

  const generateHtml = (name: string, title: string, company: string) => {
    const userName = name || user?.name || "Your Name";
    const userTitle = title || "";
    const userCompany = company || "";
    const brand = "BrandNamer";
    return `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:14px;color:#333;border-top:2px solid #2563eb;padding-top:12px;margin-top:12px">
<tr><td style="font-weight:bold;font-size:16px;color:#2563eb">${userName}</td></tr>
${userTitle ? `<tr><td style="color:#666">${userTitle}</td></tr>` : ""}
${userCompany ? `<tr><td style="color:#666">${userCompany}</td></tr>` : ""}
<tr><td style="padding-top:8px;font-size:12px;color:#999">Powered by <a href="https://brandnamer.com" style="color:#2563eb;text-decoration:none">${brand}</a></td></tr>
</table>`;
  };

  const handleCreate = async () => {
    if (!token || !sigName.trim()) return;
    setCreating(true);
    try {
      const html = generateHtml(sigName, sigTitle, sigCompany);
      await api.createEmailSignature(token, {
        name: sigName.trim(),
        title: sigTitle.trim() || undefined,
        company: sigCompany.trim() || undefined,
        html,
      });
      setSigName("");
      setSigTitle("");
      setSigCompany("");
      setShowCreate(false);
      await fetchSignatures();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create signature");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this email signature?")) return;
    setDeleting(id);
    try {
      await api.deleteEmailSignature(token, id);
      setSignatures((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete signature");
    } finally {
      setDeleting(null);
    }
  };

  const copyHtml = async (id: string, html: string) => {
    try {
      await navigator.clipboard.writeText(html);
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
            <h1 className="text-3xl font-bold">Email Signatures</h1>
            <p className="text-muted-foreground">Create and manage branded email signatures.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Signature
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
              <CardTitle>New Email Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="sig-name">Your Name</Label>
                <Input id="sig-name" value={sigName} onChange={(e) => setSigName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sig-title">Title (optional)</Label>
                <Input id="sig-title" value={sigTitle} onChange={(e) => setSigTitle(e.target.value)} placeholder="Brand Strategist" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sig-company">Company (optional)</Label>
                <Input id="sig-company" value={sigCompany} onChange={(e) => setSigCompany(e.target.value)} placeholder="Acme Inc." />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!sigName.trim() || creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Generate Signature
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Card key={i}><CardContent className="p-6"><div className="h-16 animate-pulse rounded bg-muted" /></CardContent></Card>)}</div>
        ) : signatures.length === 0 && !showCreate ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Mail className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No email signatures yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {signatures.map((sig) => (
              <Card key={sig.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{sig.name}</p>
                        {sig.isDefault && <Badge variant="success">Default</Badge>}
                      </div>
                      {(sig.title || sig.company) && (
                        <p className="text-sm text-muted-foreground">
                          {[sig.title, sig.company].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(sig.id)} disabled={deleting === sig.id}>
                      {deleting === sig.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                    </Button>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-4">
                    <div dangerouslySetInnerHTML={{ __html: sig.html }} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyHtml(sig.id, sig.html)}>
                    {copied === sig.id ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied === sig.id ? "Copied!" : "Copy HTML"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
