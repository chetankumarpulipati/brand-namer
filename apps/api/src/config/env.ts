export const config = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: process.env.NODE_ENV !== "production",

  jwt: {
    secret: process.env.JWT_SECRET ?? "change-me-in-production",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "change-me-in-production-too",
    expiresIn: "15m",
    refreshExpiresIn: "7d",
  },

  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    orgId: process.env.OPENAI_ORG_ID ?? "",
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  },

  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY ?? "",
    apiUrl: process.env.NVIDIA_API_URL ?? "https://integrate.api.nvidia.com/v1",
    model: process.env.NVIDIA_API_MODEL ?? "meta/llama-3.1-8b-instruct",
  },

  aerolink: {
    apiKey: process.env.AEROLINK_API_KEY ?? "",
    apiUrl: process.env.AEROLINK_BASE_URL ?? "https://aerolink.lat/v1",
    model: process.env.AEROLINK_MODEL ?? "claude-sonnet-4-20250514",
  },

  supabase: {
    url: process.env.SUPABASE_URL ?? "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
    anonKey: process.env.SUPABASE_ANON_KEY ?? "",
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    region: process.env.AWS_REGION ?? "us-east-1",
    s3Bucket: process.env.AWS_S3_BUCKET ?? "brand-namer-assets",
  },

  uspto: {
    apiKey: process.env.USPTO_API_KEY ?? "",
  },

  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY ?? "",
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY ?? "",
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY ?? "",
  },

  email: {
    from: process.env.EMAIL_FROM ?? "noreply@brandnamer.com",
  },

  sentry: {
    dsn: process.env.SENTRY_DSN ?? "",
  },

  social: {
    twitter: { bearerToken: process.env.TWITTER_BEARER_TOKEN ?? "" },
    instagram: { accessToken: process.env.INSTAGRAM_ACCESS_TOKEN ?? "" },
    linkedin: { accessToken: process.env.LINKEDIN_ACCESS_TOKEN ?? "" },
    github: { token: process.env.GITHUB_TOKEN ?? "" },
    tiktok: { accessToken: process.env.TIKTOK_ACCESS_TOKEN ?? "" },
    youtube: { apiKey: process.env.YOUTUBE_API_KEY ?? "" },
    pinterest: { accessToken: process.env.PINTEREST_ACCESS_TOKEN ?? "" },
  },

  slack: {
    botToken: process.env.SLACK_BOT_TOKEN ?? "",
    signingSecret: process.env.SLACK_SIGNING_SECRET ?? "",
  },

  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN ?? "",
    clientId: process.env.DISCORD_CLIENT_ID ?? "",
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER ?? "",
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  },

  docusign: {
    accessToken: process.env.DOCUSIGN_ACCESS_TOKEN ?? "",
  },

  hellosign: {
    apiKey: process.env.HELLOSIGN_API_KEY ?? "",
  },

  zapier: {
    clientId: process.env.ZAPIER_CLIENT_ID ?? "",
    clientSecret: process.env.ZAPIER_CLIENT_SECRET ?? "",
  },

  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  },
} as const;
