"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  User,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react";

interface Profile {
  name: string;
  email: string;
  image?: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  createdAt: string;
}

interface Transaction {
  id: string;
  createdAt: string;
  description: string;
  amount: number;
  type: "earned" | "spent";
  balance: number;
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      {children}
    </div>
  );
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
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant] ?? variants.default,
      )}
    >
      {children}
    </span>
  );
}

export default function SettingsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [revokingKey, setRevokingKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(true);
  const [txnsError, setTxnsError] = useState<string | null>(null);
  const [txnPage, setTxnPage] = useState(1);
  const [txnTotal, setTxnTotal] = useState(0);
  const txnLimit = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await api.getProfile(token) as Profile;
      setProfile(data);
      setProfileName(data.name ?? "");
      setProfileImage(data.image ?? "");
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  const fetchApiKeys = useCallback(async () => {
    if (!token) return;
    setKeysLoading(true);
    setKeysError(null);
    try {
      const data = await api.listApiKeys(token) as { items: ApiKey[] };
      setApiKeys(data.items ?? []);
    } catch (e) {
      setKeysError(e instanceof Error ? e.message : "Failed to load API keys");
    } finally {
      setKeysLoading(false);
    }
  }, [token]);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setTxnsLoading(true);
    setTxnsError(null);
    try {
      const data = await api.getTransactions(token, txnPage, txnLimit) as { items: Transaction[]; total: number };
      setTransactions(data.items ?? []);
      setTxnTotal(data.total);
    } catch (e) {
      setTxnsError(e instanceof Error ? e.message : "Failed to load transactions");
    } finally {
      setTxnsLoading(false);
    }
  }, [token, txnPage, txnLimit]);

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchApiKeys();
    }
  }, [token, fetchProfile, fetchApiKeys]);

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token, fetchTransactions, txnPage]);

  const totalPages = Math.max(1, Math.ceil(txnTotal / txnLimit));

  const handleSaveProfile = async () => {
    if (!token) return;
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      await api.updateProfile(token, { name: profileName, image: profileImage || undefined });
      if (profile) {
        setProfile({ ...profile, name: profileName, image: profileImage });
      }
      setProfileSaved(true);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const handleGenerateKey = async () => {
    if (!token || !newKeyName.trim()) return;
    setGeneratingKey(true);
    setGeneratedKey(null);
    try {
      const result = await api.createApiKey(token, { name: newKeyName.trim(), scopes: newKeyScopes });
      setGeneratedKey(result.rawKey);
      setNewKeyName("");
      setNewKeyScopes([]);
      await fetchApiKeys();
    } catch (e) {
      setKeysError(e instanceof Error ? e.message : "Failed to generate API key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to revoke "${name}"? This cannot be undone.`)) return;
    setRevokingKey(id);
    try {
      await api.revokeApiKey(token, id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      setKeysError(e instanceof Error ? e.message : "Failed to revoke API key");
    } finally {
      setRevokingKey(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
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
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account, API keys, and transaction history.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : profileError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {profileError}
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email ?? ""} disabled />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save Changes
                  </Button>
                  {profileSaved && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      Saved
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {keysError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {keysError}
              </div>
            )}

            {keysLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : apiKeys.length === 0 && !showGenerateForm ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Key className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No API keys yet.</p>
                <Button onClick={() => setShowGenerateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate New Key
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{key.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{key.keyPrefix}...</span>
                        <span>{format(new Date(key.createdAt), "MMM d, yyyy")}</span>
                        {key.scopes?.map((scope) => (
                          <Badge key={scope} variant="outline">{scope}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeKey(key.id, key.name)}
                      disabled={revokingKey === key.id}
                    >
                      {revokingKey === key.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                ))}

                {!showGenerateForm && (
                  <Button variant="outline" onClick={() => setShowGenerateForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New Key
                  </Button>
                )}
              </div>
            )}

            {showGenerateForm && (
              <div className="space-y-4 rounded-md border p-4">
                {generatedKey ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Key generated successfully! Copy it now — you won&apos;t be able to see it again.
                    </p>
                    <div className="relative">
                      <pre
                        className="overflow-x-auto rounded-md bg-muted p-3 text-xs"
                        style={{ userSelect: "all" }}
                      >
                        {generatedKey}
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute right-2 top-2"
                        onClick={() => copyToClipboard(generatedKey)}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGeneratedKey(null);
                        setShowGenerateForm(false);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Development"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Scopes</Label>
                      <div className="flex flex-wrap gap-4">
                        {["read", "write", "admin"].map((scope) => (
                          <label key={scope} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newKeyScopes.includes(scope)}
                              onChange={() => toggleScope(scope)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            {scope}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleGenerateKey}
                        disabled={!newKeyName.trim() || generatingKey}
                      >
                        {generatingKey ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Generate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowGenerateForm(false);
                          setNewKeyName("");
                          setNewKeyScopes([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txnsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {txnsError}
              </div>
            ) : txnsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions yet.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Date</th>
                        <th className="pb-3 pr-4 font-medium">Description</th>
                        <th className="pb-3 pr-4 font-medium">Amount</th>
                        <th className="pb-3 pr-4 font-medium">Type</th>
                        <th className="pb-3 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="border-b last:border-0">
                          <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                            {format(new Date(txn.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="py-3 pr-4">{txn.description}</td>
                          <td className="py-3 pr-4 font-medium">
                            {txn.amount > 0 ? "+" : ""}{txn.amount}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={txn.type === "earned" ? "success" : "destructive"}>
                              {txn.type}
                            </Badge>
                          </td>
                          <td className="py-3 font-medium">{txn.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {txnPage} of {totalPages} ({txnTotal} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
                        disabled={txnPage <= 1}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTxnPage((p) => Math.min(totalPages, p + 1))}
                        disabled={txnPage >= totalPages}
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
