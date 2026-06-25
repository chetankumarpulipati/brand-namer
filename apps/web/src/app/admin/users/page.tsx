"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  credits: number;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  details: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUser & { auditLogs: AuditEntry[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const limit = 10;

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.listAdminUsers(token, page, limit);
      setUsers(data.items as AdminUser[]);
      setTotal(data.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  const handleView = async (user: AdminUser) => {
    if (!token) return;
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const data = await api.getAdminUser(token, user.id);
      setUserDetail(data as AdminUser & { auditLogs: AuditEntry[] });
    } catch {
      setUserDetail({ ...user, auditLogs: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!token) return;
    try {
      await api.updateAdminUser(token, userId, { role });
      fetchUsers();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleTierChange = async (userId: string, tier: string) => {
    if (!token) return;
    try {
      await api.updateAdminUser(token, userId, { tier });
      fetchUsers();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteAdminUser(token, userId);
      fetchUsers();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleImpersonate = async (userId: string) => {
    if (!token) return;
    try {
      const result = await api.impersonateUser(token, userId);
      localStorage.setItem("bn_token", result.token);
      window.location.href = "/";
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (!token) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Users</h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          No users found
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tier</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Credits</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.tier}
                        onChange={(e) => handleTierChange(user.id, e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{user.credits}</td>
                    <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleView(user)}>
                          View
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}>
                          Delete
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleImpersonate(user.id)}>
                          Impersonate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">User Detail</h3>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserDetail(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            {detailLoading ? (
              <div className="space-y-2">
                <div className="h-4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 animate-pulse rounded bg-gray-200" />
              </div>
            ) : userDetail ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-500">ID:</span>{" "}
                  <span className="text-gray-900">{userDetail.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Email:</span>{" "}
                  <span className="text-gray-900">{userDetail.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Name:</span>{" "}
                  <span className="text-gray-900">{userDetail.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Role:</span>{" "}
                  <span className="text-gray-900">{userDetail.role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Tier:</span>{" "}
                  <span className="text-gray-900">{userDetail.tier}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Credits:</span>{" "}
                  <span className="text-gray-900">{userDetail.credits}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Created:</span>{" "}
                  <span className="text-gray-900">
                    {new Date(userDetail.createdAt).toLocaleString()}
                  </span>
                </div>

                <h4 className="mt-4 font-semibold text-gray-900">Audit Logs</h4>
                {userDetail.auditLogs.length === 0 ? (
                  <p className="text-gray-500">No audit log entries</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {userDetail.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded border border-gray-100 bg-gray-50 p-2"
                      >
                        <p className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-900">
                          {log.action} &mdash; {log.resource}
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-500">{log.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
