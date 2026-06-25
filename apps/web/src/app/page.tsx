import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container flex flex-col items-center gap-8 pb-32 pt-24 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Name Your Brand with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Generate unique, memorable brand names in seconds. Check domain availability, trademark conflicts, and social media handles — all in one place.
            </p>
          </div>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link href="/search">Start Generating</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="border-t bg-muted/50 py-24">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">Everything You Need to Name Your Brand</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="mb-4 text-3xl">{feature.icon}</div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t py-24">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">Simple, Transparent Pricing</h2>
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.name} className={`rounded-lg border p-6 shadow-sm ${plan.featured ? "border-blue-500 ring-2 ring-blue-500" : ""}`}>
                  <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                  <p className="mb-4 text-3xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.featured ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t bg-muted/50 py-24">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
            <div className="grid gap-8 md:grid-cols-4">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mb-2 font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

const features = [
  { icon: "🤖", title: "AI Name Generation", description: "5+ strategies: Acronym, Compound, Thesaurus, Emotional, Metaphor. Get 10 unique names per search." },
  { icon: "🌐", title: "Domain & Trademark Check", description: "Check .com, .io, .ai, .app availability and USPTO trademark conflicts instantly." },
  { icon: "📱", title: "Social Media Check", description: "Verify name availability across Twitter, Instagram, LinkedIn, GitHub, TikTok, and more." },
  { icon: "⭐", title: "Brand Score", description: "AI grades each name on Memorability, Pronounceability, Meaning, Uniqueness, and SEO." },
  { icon: "👥", title: "Team Workspaces", description: "Collaborate with your team in real-time. Share mood boards, vote on names, and more." },
  { icon: "🏪", title: "Name Marketplace", description: "Buy, sell, and auction brand names. Join naming contests and earn from your creativity." },
];

const plans = [
  { name: "Free", price: 0, features: ["3 searches per day", "10 names per search", "Basic domain check", "Social media check"], cta: "Get Started", featured: false },
  { name: "Pro", price: 9.99, features: ["100 searches per day", "All AI strategies", "Bulk generation (500 keywords)", "Priority support"], cta: "Start Free Trial", featured: true },
  { name: "Enterprise", price: 29.99, features: ["10,000 searches per day", "Custom AI fine-tuning", "Team workspaces", "API access", "SLA guarantee"], cta: "Contact Sales", featured: false },
];

const steps = [
  { number: 1, title: "Describe Your Brand", description: "Enter keywords, industry, and a brief about your brand vision." },
  { number: 2, title: "AI Generates Names", description: "Our AI creates names using 5+ strategies and scores each one." },
  { number: 3, title: "Check Availability", description: "Verify domains, trademarks, and social handles instantly." },
  { number: 4, title: "Save & Share", description: "Save favorites, create mood boards, and share with your team." },
];
