import { prisma } from "@/config/database";

const WHOIS_SERVERS: Record<string, string> = {
  com: "whois.verisign-grs.com",
  io: "whois.nic.io",
  ai: "whois.nic.ai",
  app: "whois.nic.google",
  dev: "whois.nic.google",
  net: "whois.verisign-grs.com",
  org: "whois.pir.org",
  co: "whois.nic.co",
  me: "whois.nic.me",
  tv: "whois.nic.tv",
};

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean;
  price?: number;
  registrar?: string;
  sslValid?: boolean;
}

// Simplified DNS-based check using public resolver
async function dnsLookup(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json() as { Status?: number; Answer?: Array<unknown> };
    return !data.Answer || data.Answer.length === 0;
  } catch {
    // Fallback: assume available
    return true;
  }
}

const TLD_PRICES: Record<string, number> = {
  com: 12.99, io: 38.99, ai: 79.99, app: 14.99, dev: 14.99,
  net: 13.99, org: 12.99, co: 29.99, me: 21.99, tv: 34.99,
};

export async function checkDomainAvailability(name: string, tlds?: string[]): Promise<DomainResult[]> {
  const extensions = tlds ?? ["com", "io", "ai", "app", "dev", "net", "org"];
  const results: DomainResult[] = [];

  for (const tld of extensions) {
    const domain = `${name.toLowerCase().replace(/[^a-z0-9-]/g, "")}.${tld}`;
    try {
      const available = await dnsLookup(domain);
      results.push({
        domain,
        tld,
        available,
        price: TLD_PRICES[tld],
        sslValid: false,
      });
    } catch {
      results.push({
        domain,
        tld,
        available: true,
        price: TLD_PRICES[tld],
      });
    }
  }

  // Save to DB
  const brandName = await prisma.brandName.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });

  if (brandName) {
    for (const r of results) {
      await prisma.domainCheck.create({
        data: {
          brandNameId: brandName.id,
          domain: r.domain,
          tld: r.tld,
          available: r.available,
          price: r.price,
        },
      });
    }
  }

  return results;
}
