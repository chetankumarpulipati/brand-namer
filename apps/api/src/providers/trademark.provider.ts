import { config } from "@/config/env";

interface TrademarkResult {
  trademark: string;
  status: string;
  classCode?: string;
  ownerName?: string;
  similarity?: number;
  details?: Record<string, unknown>;
}

const USPTO_BASE = "https://developer.uspto.gov/trademark/v1";

export async function checkTrademark(name: string): Promise<TrademarkResult[]> {
  if (!config.uspto.apiKey) {
    return [{
      trademark: name,
      status: "check unavailable (no API key)",
      details: { note: "USPTO API key not configured" },
    }];
  }

  try {
    const response = await fetch(
      `${USPTO_BASE}/trademarks/search?query=${encodeURIComponent(name)}&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${config.uspto.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      return [{ trademark: name, status: "error", details: { status: response.status } }];
    }

    const data = await response.json() as { results?: Array<Record<string, unknown>> };
    return (data.results ?? []).map((r) => ({
      trademark: r.market_name as string ?? name,
      status: (r.current_status as string) ?? "unknown",
      classCode: r.class_code as string,
      ownerName: r.owner_name as string,
    }));
  } catch (error) {
    return [{
      trademark: name,
      status: "error",
      details: { message: (error as Error).message },
    }];
  }
}
