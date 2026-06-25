export type UserRole = "ADMIN" | "OWNER" | "EDITOR" | "VIEWER";
export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";
export type SearchStrategy = "ACRONYM" | "COMPOUND" | "THESAURUS" | "EMOTIONAL" | "METAPHOR" | "PORTMANTEAU" | "GENERATIVE";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface HealthResponse {
  status: "healthy" | "degraded";
  timestamp: string;
  uptime: number;
  services: {
    database: "connected" | "disconnected";
    redis: "connected" | "disconnected" | "pending";
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  tier: SubscriptionTier;
  credits: number;
  lifetimeCredits: number;
  xp: number;
  level: number;
  totpEnabled: boolean;
  createdAt: string;
}
