import { config } from "@/config/env";

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function initializeOpenTelemetry(): Promise<void> {
  if (!config.sentry.dsn) return;
  console.log("[OTel] OpenTelemetry available but not configured (packages not installed)");
}
