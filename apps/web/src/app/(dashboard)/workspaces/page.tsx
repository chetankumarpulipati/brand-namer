"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  ownerId: string;
  members?: WorkspaceMember[];
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border p-4">
      <div className="mb-2 h-6 w-3/4 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
    </div>
  );
}

export default function WorkspacesPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviting, setInviting] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!token || authLoading) return;
    setLoading(true);
    setError(null);
    api
      .listWorkspaces(token)
      .then((data) => setWorkspaces((data as { items: Workspace[] }).items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load workspaces"))
      .finally(() => setLoading(false));
  }, [token, user, authLoading, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !formName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.createWorkspace(token, {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
      });
      setWorkspaces((prev) => [...prev, created as Workspace]);
      setFormName("");
      setFormDesc("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite(workspaceId: string) {
    if (!token || !inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      await api.inviteMember(token, workspaceId, inviteEmail.trim(), inviteRole);
      const updated = await api.getWorkspace(token, workspaceId);
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === workspaceId ? (updated as Workspace) : w)),
      );
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(workspaceId: string, memberId: string) {
    if (!token) return;
    try {
      await api.removeMember(token, workspaceId, memberId);
      const updated = await api.getWorkspace(token, workspaceId);
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === workspaceId ? (updated as Workspace) : w)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  function startEdit(ws: Workspace) {
    setEditId(ws.id);
    setEditName(ws.name);
    setEditDesc(ws.description ?? "");
  }

  async function handleSaveEdit(workspaceId: string) {
    if (!token || !editName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateWorkspace(token, workspaceId, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === workspaceId ? (updated as Workspace) : w)),
      );
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(workspaceId: string) {
    if (!token) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteWorkspace(token, workspaceId);
      setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
      setDeleteConfirm(null);
      if (expandedId === workspaceId) setExpandedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
    } finally {
      setDeleting(false);
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
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">Collaborate with your team on brand names.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="ws-name">Name</Label>
            <Input id="ws-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Design Team" disabled={creating} />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="ws-desc">Description (optional)</Label>
            <Input id="ws-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Workspace for..." disabled={creating} />
          </div>
          <Button type="submit" disabled={creating || !formName.trim()}>
            {creating ? "Creating..." : "Create Workspace"}
          </Button>
        </form>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="mb-2 text-lg font-medium">No workspaces yet</p>
            <p className="text-sm text-muted-foreground">Create your first workspace!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws) => (
              <div key={ws.id} className="rounded-lg border">
                <button
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
                  onClick={() => {
                    if (editId === ws.id) setEditId(null);
                    setExpandedId(expandedId === ws.id ? null : ws.id);
                  }}
                >
                  <div>
                    <p className="font-medium">{ws.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(ws.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-muted-foreground">
                    {expandedId === ws.id ? "▲" : "▼"}
                  </span>
                </button>

                {expandedId === ws.id && (
                  <div className="border-t p-4 space-y-6">
                    {/* Workspace Info / Inline Edit */}
                    {editId === ws.id ? (
                      <div className="space-y-3 rounded-lg bg-muted/30 p-4">
                        <div className="space-y-1">
                          <Label htmlFor={`edit-name-${ws.id}`}>Name</Label>
                          <Input id={`edit-name-${ws.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} disabled={saving} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`edit-desc-${ws.id}`}>Description</Label>
                          <Input id={`edit-desc-${ws.id}`} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} disabled={saving} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(ws.id)} disabled={saving || !editName.trim()}>
                            {saving ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditId(null)} disabled={saving}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{ws.name}</h3>
                          {ws.description && (
                            <p className="text-sm text-muted-foreground">{ws.description}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => startEdit(ws)}>
                          Edit
                        </Button>
                      </div>
                    )}

                    {/* Members List */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Members</h4>
                      {ws.members && ws.members.length > 0 ? (
                        <div className="space-y-2">
                          {ws.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm">
                              <div>
                                <span className="font-medium">{member.name}</span>
                                <span className="ml-2 text-muted-foreground">{member.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium uppercase">
                                  {member.role}
                                </span>
                                {member.role !== "OWNER" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveMember(ws.id, member.id)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No members yet.</p>
                      )}
                    </div>

                    {/* Invite Form */}
                    <div className="rounded-lg border p-4">
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Invite Member</h4>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={`invite-email-${ws.id}`}>Email</Label>
                          <Input
                            id={`invite-email-${ws.id}`}
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            disabled={inviting}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`invite-role-${ws.id}`}>Role</Label>
                          <select
                            id={`invite-role-${ws.id}`}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as "EDITOR" | "VIEWER")}
                            disabled={inviting}
                          >
                            <option value="EDITOR">Editor</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleInvite(ws.id)}
                          disabled={inviting || !inviteEmail.trim()}
                        >
                          {inviting ? "Inviting..." : "Invite"}
                        </Button>
                      </div>
                    </div>

                    {/* Delete Workspace */}
                    <div className="border-t pt-4">
                      {deleteConfirm === ws.id ? (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                          <span className="text-red-700">Are you sure? This cannot be undone.</span>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(ws.id)} disabled={deleting}>
                            {deleting ? "Deleting..." : "Confirm"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                          onClick={() => setDeleteConfirm(ws.id)}
                        >
                          Delete Workspace
                        </Button>
                      )}
                    </div>
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
