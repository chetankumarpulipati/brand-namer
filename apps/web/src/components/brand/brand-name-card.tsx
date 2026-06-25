import Link from "next/link";
import { ScoreBars } from "@/components/brand/score-bars";

interface Scores {
  memorability: number;
  pronounceability: number;
  meaning: number;
  uniqueness: number;
  seo: number;
  overall: number;
}

interface BrandNameCardProps {
  id: string;
  name: string;
  strategy: string;
  meaning?: string;
  scores?: Scores;
  actions?: React.ReactNode;
}

const strategyColors: Record<string, string> = {
  coined: "bg-purple-100 text-purple-800",
  compound: "bg-blue-100 text-blue-800",
  descriptive: "bg-green-100 text-green-800",
  evocative: "bg-orange-100 text-orange-800",
  abstract: "bg-pink-100 text-pink-800",
  acronym: "bg-yellow-100 text-yellow-800",
  founder: "bg-indigo-100 text-indigo-800",
  geographic: "bg-teal-100 text-teal-800",
  blend: "bg-cyan-100 text-cyan-800",
  borrowed: "bg-rose-100 text-rose-800",
};

export function BrandNameCard({ id, name, strategy, meaning, scores, actions }: BrandNameCardProps) {
  const badgeClass = strategyColors[strategy.toLowerCase()] ?? "bg-gray-100 text-gray-800";
  return (
    <div className="rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <Link href={`/dashboard/brand/${id}`} className="text-xl font-bold hover:text-blue-600">
          {name}
        </Link>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          {strategy}
        </span>
      </div>
      {meaning && <p className="mb-3 text-sm text-muted-foreground">{meaning}</p>}
      {scores && (
        <div className="mb-3">
          <ScoreBars scores={scores} />
        </div>
      )}
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
