import { config } from "@/config/env";

interface SocialResult {
  platform: string;
  handle: string;
  available: boolean;
  profileUrl?: string;
}

const PLATFORMS = [
  { name: "Twitter", url: "https://twitter.com/" },
  { name: "Instagram", url: "https://instagram.com/" },
  { name: "LinkedIn", url: "https://linkedin.com/company/" },
  { name: "GitHub", url: "https://github.com/" },
  { name: "TikTok", url: "https://tiktok.com/@" },
  { name: "YouTube", url: "https://youtube.com/@" },
  { name: "Pinterest", url: "https://pinterest.com/" },
];

async function checkHandle(platform: string, baseUrl: string, handle: string): Promise<SocialResult> {
  const url = `${baseUrl}${encodeURIComponent(handle)}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    // If we get a 200, the profile exists (not available)
    // If we get 404, handle is available
    return {
      platform,
      handle,
      available: response.status === 404,
      profileUrl: response.status === 200 ? url : undefined,
    };
  } catch {
    return { platform, handle, available: true };
  }
}

export async function checkSocialHandles(name: string): Promise<SocialResult[]> {
  const handle = name.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const results = await Promise.all(
    PLATFORMS.map((p) => checkHandle(p.name, p.url, handle)),
  );
  return results;
}
