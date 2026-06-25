interface Scores {
  memorability: number;
  pronounceability: number;
  meaning: number;
  uniqueness: number;
  seo: number;
  overall: number;
}

const labels: Record<keyof Scores, string> = {
  memorability: "Memorability",
  pronounceability: "Pronounceability",
  meaning: "Meaning",
  uniqueness: "Uniqueness",
  seo: "SEO",
  overall: "Overall",
};

const colors: Record<keyof Scores, string> = {
  memorability: "bg-blue-500",
  pronounceability: "bg-emerald-500",
  meaning: "bg-violet-500",
  uniqueness: "bg-amber-500",
  seo: "bg-cyan-500",
  overall: "bg-rose-500",
};

export function ScoreBars({ scores }: { scores: Scores }) {
  const keys = Object.keys(scores) as (keyof Scores)[];
  return (
    <div className="space-y-2">
      {keys.map((key) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{labels[key]}</span>
            <span className="text-muted-foreground">{scores[key]}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted">
            <div
              className={`h-2.5 rounded-full transition-all ${colors[key]}`}
              style={{ width: `${Math.min(scores[key], 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
