const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/api${path}`, { ...fetchOptions, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message ?? `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string }) =>
    fetchApi<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    fetchApi<{ user: unknown; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  refreshToken: (refreshToken: string) =>
    fetchApi<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
  logout: (token: string) =>
    fetchApi<void>("/auth/logout", { method: "POST", token }),
  getMe: (token: string) =>
    fetchApi<unknown>("/auth/me", { token }),
  totpSetup: (token: string) =>
    fetchApi<{ secret: string; qrCode: string }>("/auth/totp/setup", { method: "POST", token }),
  totpVerify: (token: string, code: string) =>
    fetchApi<{ verified: boolean }>("/auth/totp/verify", { method: "POST", body: JSON.stringify({ code }), token }),
  totpDisable: (token: string) =>
    fetchApi<void>("/auth/totp/disable", { method: "POST", token }),
  listSessions: (token: string) =>
    fetchApi<{ items: unknown[] }>("/auth/sessions", { token }),
  revokeSession: (token: string, sessionId: string) =>
    fetchApi<void>(`/auth/sessions/${sessionId}`, { method: "DELETE", token }),

  // Search
  search: (data: { query: string; industry?: string; count?: number; brief?: string; strategies?: string[] }, token: string) =>
    fetchApi<{ id: string; results: unknown[] }>("/search", { method: "POST", body: JSON.stringify(data), token }),
  bulkSearch: (data: { keywords: string[]; countPerKeyword?: number; industry?: string }, token: string) =>
    fetchApi<{ results: unknown[] }>("/search/bulk", { method: "POST", body: JSON.stringify(data), token }),
  searchHistory: (token: string) =>
    fetchApi<{ items: unknown[] }>("/search/history", { token }),
  searchHistoryDetail: (token: string, id: string) =>
    fetchApi<unknown>(`/search/history/${id}`, { token }),
  checkDomain: (token: string, data: { name: string; tlds?: string[] }) =>
    fetchApi<unknown>("/search/domain", { method: "POST", body: JSON.stringify(data), token }),
  checkTrademark: (token: string, name: string) =>
    fetchApi<unknown>("/search/trademark", { method: "POST", body: JSON.stringify({ name }), token }),
  checkSocial: (token: string, name: string) =>
    fetchApi<unknown>("/search/social", { method: "POST", body: JSON.stringify({ name }), token }),

  // Brand Names
  saveName: (token: string, nameId: string) =>
    fetchApi<unknown>("/brands/save", { method: "POST", body: JSON.stringify({ nameId }), token }),
  unsaveName: (token: string, nameId: string) =>
    fetchApi<unknown>("/brands/unsave", { method: "POST", body: JSON.stringify({ nameId }), token }),
  savedNames: (token: string) =>
    fetchApi<{ items: unknown[] }>("/search/saved", { token }),
  getNameDetail: (token: string, id: string) =>
    fetchApi<unknown>(`/brands/name/${id}`, { token }),
  getNameDomain: (token: string, id: string, tlds?: string[]) =>
    fetchApi<unknown>(`/brands/name/${id}/domain`, { method: "POST", body: JSON.stringify({ tlds }), token }),
  getNameTrademark: (token: string, id: string) =>
    fetchApi<unknown>(`/brands/name/${id}/trademark`, { method: "POST", token }),
  getNameSocial: (token: string, id: string) =>
    fetchApi<unknown>(`/brands/name/${id}/social`, { method: "POST", token }),
  getNameTts: (token: string, id: string) =>
    fetchApi<{ url: string }>(`/brands/name/${id}/tts`, { method: "POST", token }),
  updateName: (token: string, id: string, data: Record<string, unknown>) =>
    fetchApi<unknown>(`/brands/name/${id}`, { method: "PUT", body: JSON.stringify(data), token }),

  // Wishlists
  createWishlist: (token: string, data: { name: string }) =>
    fetchApi<unknown>("/brands/wishlist", { method: "POST", body: JSON.stringify(data), token }),
  listWishlists: (token: string) =>
    fetchApi<{ items: unknown[] }>("/brands/wishlists", { token }),

  // Mood Boards
  listMoodBoards: (token: string) =>
    fetchApi<{ items: unknown[] }>("/brands/moodboards", { token }),
  createMoodBoard: (token: string, data: { name: string; description?: string }) =>
    fetchApi<unknown>("/brands/moodboards", { method: "POST", body: JSON.stringify(data), token }),
  getMoodBoard: (token: string, id: string) =>
    fetchApi<unknown>(`/brands/moodboards/${id}`, { token }),

  // Billing
  createCheckoutSession: (priceId: string, successUrl: string, cancelUrl: string, token: string) =>
    fetchApi<{ url: string }>("/billing/create-checkout-session", { method: "POST", body: JSON.stringify({ priceId, successUrl, cancelUrl }), token }),
  createPortalSession: (returnUrl: string, token: string) =>
    fetchApi<{ url: string }>("/billing/create-portal-session", { method: "POST", body: JSON.stringify({ returnUrl }), token }),
  getSubscription: (token: string) =>
    fetchApi<unknown>("/billing/subscription", { token }),
  getInvoices: (token: string) =>
    fetchApi<{ items: unknown[] }>("/billing/invoices", { token }),
  getUsageAlerts: (token: string) =>
    fetchApi<{ items: unknown[] }>("/billing/usage-alerts", { token }),
  upsertUsageAlert: (token: string, data: { threshold: number; email: boolean }) =>
    fetchApi<unknown>("/billing/usage-alerts", { method: "POST", body: JSON.stringify(data), token }),
  deleteUsageAlert: (token: string, id: string) =>
    fetchApi<void>(`/billing/usage-alerts/${id}`, { method: "DELETE", token }),
  purchase: (token: string, data: { priceId: string }) =>
    fetchApi<{ url: string }>("/billing/purchase", { method: "POST", body: JSON.stringify(data), token }),

  // User Profile
  getProfile: (token: string) =>
    fetchApi<unknown>("/users/profile", { token }),
  updateProfile: (token: string, data: { name?: string; image?: string }) =>
    fetchApi<unknown>("/users/profile", { method: "PATCH", body: JSON.stringify(data), token }),
  getCredits: (token: string) =>
    fetchApi<{ credits: number; lifetimeCredits: number; tier: string }>("/users/credits", { token }),
  getTransactions: (token: string, page?: number, limit?: number) =>
    fetchApi<{ items: unknown[]; total: number; page: number; limit: number }>("/users/transactions", { token, body: JSON.stringify({ page, limit }) }),

  // API Keys
  createApiKey: (token: string, data: { name: string; scopes?: string[] }) =>
    fetchApi<{ id: string; name: string; keyPrefix: string; rawKey: string }>("/users/api-keys", { method: "POST", body: JSON.stringify(data), token }),
  listApiKeys: (token: string) =>
    fetchApi<{ items: unknown[] }>("/users/api-keys", { token }),
  revokeApiKey: (token: string, id: string) =>
    fetchApi<void>(`/users/api-keys/${id}`, { method: "DELETE", token }),

  // Workspaces
  listWorkspaces: (token: string) =>
    fetchApi<{ items: unknown[] }>("/workspaces", { token }),
  createWorkspace: (token: string, data: { name: string; description?: string }) =>
    fetchApi<unknown>("/workspaces", { method: "POST", body: JSON.stringify(data), token }),
  getWorkspace: (token: string, id: string) =>
    fetchApi<unknown>(`/workspaces/${id}`, { token }),
  updateWorkspace: (token: string, id: string, data: { name?: string; description?: string }) =>
    fetchApi<unknown>(`/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(data), token }),
  deleteWorkspace: (token: string, id: string) =>
    fetchApi<void>(`/workspaces/${id}`, { method: "DELETE", token }),
  inviteMember: (token: string, id: string, email: string, role?: string) =>
    fetchApi<unknown>(`/workspaces/${id}/invite`, { method: "POST", body: JSON.stringify({ email, role }), token }),
  removeMember: (token: string, id: string, memberId: string) =>
    fetchApi<void>(`/workspaces/${id}/members/${memberId}`, { method: "DELETE", token }),

  // Community - Marketplace
  listMarketplace: (page?: number, limit?: number) =>
    fetchApi<{ items: unknown[]; total: number }>(`/community/marketplace?page=${page ?? 1}&limit=${limit ?? 20}`),
  getMarketplaceItem: (id: string) =>
    fetchApi<unknown>(`/community/marketplace/${id}`),
  createMarketplaceListing: (token: string, data: Record<string, unknown>) =>
    fetchApi<unknown>("/community/marketplace", { method: "POST", body: JSON.stringify(data), token }),

  // Community - Auctions
  listAuctions: (page?: number, limit?: number) =>
    fetchApi<{ items: unknown[]; total: number }>(`/community/auctions?page=${page ?? 1}&limit=${limit ?? 20}`),
  getAuction: (id: string) =>
    fetchApi<unknown>(`/community/auctions/${id}`),
  createAuction: (token: string, data: Record<string, unknown>) =>
    fetchApi<unknown>("/community/auctions", { method: "POST", body: JSON.stringify(data), token }),
  placeBid: (token: string, id: string, amount: number) =>
    fetchApi<unknown>(`/community/auctions/${id}/bid`, { method: "POST", body: JSON.stringify({ amount }), token }),

  // Community - Contests
  listContests: (page?: number, limit?: number) =>
    fetchApi<{ items: unknown[]; total: number }>(`/community/contests?page=${page ?? 1}&limit=${limit ?? 20}`),
  createContest: (token: string, data: Record<string, unknown>) =>
    fetchApi<unknown>("/community/contests", { method: "POST", body: JSON.stringify(data), token }),
  submitContest: (token: string, id: string, nameId: string) =>
    fetchApi<unknown>(`/community/contests/${id}/submit`, { method: "POST", body: JSON.stringify({ nameId }), token }),

  // Community - Polls
  listPolls: (page?: number, limit?: number) =>
    fetchApi<{ items: unknown[]; total: number }>(`/community/polls?page=${page ?? 1}&limit=${limit ?? 20}`),
  createPoll: (token: string, data: { question: string; options: string[] }) =>
    fetchApi<unknown>("/community/polls", { method: "POST", body: JSON.stringify(data), token }),
  getPoll: (id: string) =>
    fetchApi<unknown>(`/community/polls/${id}`),
  votePoll: (token: string, id: string, optionIndex: number) =>
    fetchApi<unknown>(`/community/polls/${id}/vote`, { method: "POST", body: JSON.stringify({ optionIndex }), token }),

  // Community - Forum
  listForumCategories: () =>
    fetchApi<{ items: unknown[] }>("/community/forum/categories"),
  getForumThreads: (categoryId: string) =>
    fetchApi<{ items: unknown[] }>(`/community/forum/categories/${categoryId}/threads`),
  createForumThread: (token: string, data: { title: string; content: string; categoryId: string }) =>
    fetchApi<unknown>("/community/forum/threads", { method: "POST", body: JSON.stringify(data), token }),
  getForumThread: (id: string) =>
    fetchApi<unknown>(`/community/forum/threads/${id}`),
  createForumPost: (token: string, threadId: string, content: string) =>
    fetchApi<unknown>(`/community/forum/threads/${threadId}/posts`, { method: "POST", body: JSON.stringify({ content }), token }),
  voteForumThread: (token: string, threadId: string, vote: number) =>
    fetchApi<unknown>(`/community/forum/threads/${threadId}/vote`, { method: "POST", body: JSON.stringify({ vote }), token }),

  // Community - Stories
  listStories: (page?: number, limit?: number) =>
    fetchApi<{ items: unknown[]; total: number }>(`/community/stories?page=${page ?? 1}&limit=${limit ?? 20}`),
  createStory: (token: string, data: Record<string, unknown>) =>
    fetchApi<unknown>("/community/stories", { method: "POST", body: JSON.stringify(data), token }),
  likeStory: (token: string, id: string) =>
    fetchApi<unknown>(`/community/stories/${id}/like`, { method: "POST", token }),

  // Community - Experts
  listExperts: () =>
    fetchApi<{ items: unknown[] }>("/community/experts"),
  createConsultation: (token: string, data: { expertId: string; message: string }) =>
    fetchApi<unknown>("/community/consultations", { method: "POST", body: JSON.stringify(data), token }),

  // Community - Portfolios
  getPortfolio: (userId: string) =>
    fetchApi<unknown>(`/community/portfolios/${userId}`),

  // Community - Case Studies
  listCaseStudies: () =>
    fetchApi<{ items: unknown[] }>("/community/case-studies"),

  // Community - Daily Challenges
  getDailyChallenge: () =>
    fetchApi<unknown>("/community/challenges/today"),
  submitChallenge: (token: string, id: string, brandNameId: string) =>
    fetchApi<unknown>(`/community/challenges/${id}/submit`, { method: "POST", body: JSON.stringify({ brandNameId }), token }),

  // Community - Quiz
  submitQuiz: (token: string, data: { industry: string; styles: string[]; goals: string[] }) =>
    fetchApi<{ recommendations: string[] }>("/community/quiz", { method: "POST", body: JSON.stringify(data), token }),

  // Community - Badges
  listBadges: () =>
    fetchApi<{ items: unknown[] }>("/community/badges"),
  getUserBadges: (token: string) =>
    fetchApi<{ items: unknown[] }>("/community/badges/mine", { token }),

  // Community - Leaderboard
  getLeaderboard: (period?: string, metricType?: string) =>
    fetchApi<{ items: unknown[] }>(`/community/leaderboard?period=${period ?? "weekly"}&metricType=${metricType ?? "xp"}`),

  // Community - SEO Directories
  getSeoDirectories: (industry: string) =>
    fetchApi<unknown>(`/community/seo/${industry}`),

  // Webhook Configs
  listWebhookConfigs: (token: string) =>
    fetchApi<{ items: unknown[] }>("/users/webhooks", { token }),
  createWebhookConfig: (token: string, data: { url: string; events: string[]; secret?: string }) =>
    fetchApi<unknown>("/users/webhooks", { method: "POST", body: JSON.stringify(data), token }),
  updateWebhookConfig: (token: string, id: string, data: { url?: string; events?: string[]; isActive?: boolean }) =>
    fetchApi<unknown>(`/users/webhooks/${id}`, { method: "PATCH", body: JSON.stringify(data), token }),
  deleteWebhookConfig: (token: string, id: string) =>
    fetchApi<void>(`/users/webhooks/${id}`, { method: "DELETE", token }),
  getUserWebhookLogs: (token: string, id: string) =>
    fetchApi<{ items: unknown[] }>(`/users/webhooks/${id}/logs`, { token }),

  // Email Signatures
  listEmailSignatures: (token: string) =>
    fetchApi<{ items: unknown[] }>("/users/email-signatures", { token }),
  createEmailSignature: (token: string, data: { name: string; title?: string; company?: string; html: string }) =>
    fetchApi<unknown>("/users/email-signatures", { method: "POST", body: JSON.stringify(data), token }),
  deleteEmailSignature: (token: string, id: string) =>
    fetchApi<void>(`/users/email-signatures/${id}`, { method: "DELETE", token }),

  // Social Posts
  listSocialPosts: (token: string) =>
    fetchApi<{ items: unknown[] }>("/users/social-posts", { token }),
  createSocialPost: (token: string, data: { platform: string; content: string; mediaUrl?: string; brandNameId?: string }) =>
    fetchApi<unknown>("/users/social-posts", { method: "POST", body: JSON.stringify(data), token }),
  deleteSocialPost: (token: string, id: string) =>
    fetchApi<void>(`/users/social-posts/${id}`, { method: "DELETE", token }),

  // Shareable Cards
  listShareableCards: (token: string) =>
    fetchApi<{ items: unknown[] }>("/users/shareable-cards", { token }),
  createShareableCard: (token: string, data: { brandNameId: string; title?: string }) =>
    fetchApi<unknown>("/users/shareable-cards", { method: "POST", body: JSON.stringify(data), token }),
  deleteShareableCard: (token: string, id: string) =>
    fetchApi<void>(`/users/shareable-cards/${id}`, { method: "DELETE", token }),

  // Integrations
  listIntegrations: (token: string) =>
    fetchApi<{ items: unknown[] }>("/integrations", { token }),
  connectIntegration: (token: string, data: { platform: string; accessToken: string; refreshToken?: string; platformUserId?: string }) =>
    fetchApi<unknown>("/integrations/connect", { method: "POST", body: JSON.stringify(data), token }),
  disconnectIntegration: (token: string, id: string) =>
    fetchApi<void>(`/integrations/${id}`, { method: "DELETE", token }),

  // Admin
  getAdminStats: (token: string) =>
    fetchApi<unknown>("/admin/stats", { token }),
  listAdminUsers: (token: string, page?: number, limit?: number) =>
    fetchApi<{ items: unknown[]; total: number }>(`/admin/users?page=${page ?? 1}&limit=${limit ?? 20}`, { token }),
  getAdminUser: (token: string, id: string) =>
    fetchApi<unknown>(`/admin/users/${id}`, { token }),
  updateAdminUser: (token: string, id: string, data: Record<string, unknown>) =>
    fetchApi<unknown>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data), token }),
  deleteAdminUser: (token: string, id: string) =>
    fetchApi<void>(`/admin/users/${id}`, { method: "DELETE", token }),
  impersonateUser: (token: string, id: string) =>
    fetchApi<{ token: string }>(`/admin/users/${id}/impersonate`, { method: "POST", token }),
  getAuditLogs: (token: string, page?: number, limit?: number) =>
    fetchApi<{ items: unknown[]; total: number }>(`/admin/audit-logs?page=${page ?? 1}&limit=${limit ?? 20}`, { token }),
  listFeatureFlags: (token: string) =>
    fetchApi<{ items: unknown[] }>("/admin/feature-flags", { token }),
  updateFeatureFlag: (token: string, id: string, data: { enabled?: boolean; rules?: Record<string, unknown> }) =>
    fetchApi<unknown>(`/admin/feature-flags/${id}`, { method: "PATCH", body: JSON.stringify(data), token }),
  listWebhookLogs: (token: string) =>
    fetchApi<{ items: unknown[] }>("/admin/webhooks", { token }),
  getWebhookLogs: (token: string, id: string) =>
    fetchApi<{ items: unknown[] }>(`/admin/webhooks/${id}/logs`, { token }),
  retryWebhook: (token: string, id: string) =>
    fetchApi<void>(`/admin/webhooks/${id}/retry`, { method: "POST", token }),
};
