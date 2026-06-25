"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/saved", label: "Saved Names" },
  { href: "/wishlists", label: "Wishlists" },
  { href: "/moodboards", label: "Mood Boards" },
];

const toolsNavItems = [
  { href: "/shareable-cards", label: "Shareable Cards" },
  { href: "/social-posts", label: "Social Posts" },
  { href: "/email-signatures", label: "Email Signatures" },
  { href: "/webhooks", label: "Webhooks" },
];

const communityNavItems = [
  { href: "/community/marketplace", label: "Marketplace" },
  { href: "/community/polls", label: "Polls" },
  { href: "/community/case-studies", label: "Case Studies" },
  { href: "/community/seo-directories", label: "SEO Directories" },
  { href: "/badges", label: "Badges" },
];

const settingsNavItems = [
  { href: "/workspaces", label: "Workspaces" },
  { href: "/billing", label: "Billing" },
  { href: "/integrations", label: "Integrations" },
  { href: "/security", label: "Security" },
  { href: "/settings", label: "Settings" },
];

function NavSection({ title, items, pathname }: { title: string; items: { href: string; label: string }[]; pathname: string }) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="text-xl font-bold">
            <span className="text-blue-600">Brand</span>Namer
          </Link>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-4">
          <NavSection title="Main" items={mainNavItems} pathname={pathname} />
          <NavSection title="Community" items={communityNavItems} pathname={pathname} />
          <NavSection title="Tools" items={toolsNavItems} pathname={pathname} />
          <NavSection title="Settings" items={settingsNavItems} pathname={pathname} />
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 text-sm font-medium">{user?.name}</div>
          <div className="mb-4 text-xs text-muted-foreground">{user?.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
}
