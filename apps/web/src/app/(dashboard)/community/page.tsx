"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const features = [
  { href: "/community/marketplace", icon: "🏪", title: "Marketplace", description: "Buy and sell brand names" },
  { href: "/community/auctions", icon: "🔨", title: "Auctions", description: "Bid on premium brand names" },
  { href: "/community/contests", icon: "🏆", title: "Contests", description: "Compete in naming contests" },
  { href: "/community/forum", icon: "💬", title: "Forum", description: "Discuss branding topics" },
  { href: "/community/stories", icon: "📖", title: "Stories", description: "Success stories and case studies" },
  { href: "/community/experts", icon: "⭐", title: "Experts", description: "Connect with branding experts" },
  { href: "/community/polls", icon: "📊", title: "Polls", description: "Create and vote in polls" },
  { href: "/community/case-studies", icon: "📚", title: "Case Studies", description: "Learn from real branding examples" },
  { href: "/community/seo-directories", icon: "🌐", title: "SEO Directories", description: "Industry-specific name directories" },
  { href: "/community/challenge", icon: "🎯", title: "Daily Challenge", description: "Test your naming skills daily" },
  { href: "/community/quiz", icon: "🧠", title: "Quiz", description: "Discover your brand style" },
];

export default function CommunityPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-muted-foreground">Explore and engage with the BrandNamer community</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="flex flex-col gap-3 rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
