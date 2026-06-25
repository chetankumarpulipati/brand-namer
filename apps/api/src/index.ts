import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { config } from "@/config/env";
import { prisma } from "@/config/database";
import { errorHandler } from "@/middleware/error";
import { rateLimit } from "@/middleware/rateLimit";
import { apiRouter } from "@/routes";
import { setupWebSocket } from "@/websocket";
import { initializeOpenTelemetry } from "@/config/telemetry";

// Initialize OpenTelemetry if configured
if (config.sentry.dsn) {
  initializeOpenTelemetry().catch(console.error);
}

const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.app.url,
    methods: ["GET", "POST"],
  },
});

// Global middleware
app.use(helmet());
app.use(cors({ origin: config.app.url, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (config.isDev) app.use(morgan("dev"));

// Global rate limit
app.use(rateLimit({ windowMs: 60_000, max: 1000, keyPrefix: "global" }));

// Health check
app.get("/health", async (_req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  res.json({
    status: dbOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbOk ? "connected" : "disconnected",
      redis: "pending",
    },
  });
});

// API routes
app.use("/api", apiRouter);

// Error handler
app.use(errorHandler);

// WebSocket
setupWebSocket(io);

// Start server (skip in Vercel serverless)
if (!process.env.VERCEL) {
  httpServer.listen(config.port, () => {
    console.log(`🚀 Brand Namer API running on port ${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/health`);
    console.log(`   Environment: ${config.nodeEnv}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down...");
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down...");
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default app;
export { app, httpServer, io };
