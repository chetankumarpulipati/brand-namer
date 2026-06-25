import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "@/config/env";

interface AuthenticatedSocket {
  userId?: string;
  username?: string;
}

export function setupWebSocket(io: SocketServer): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
    if (!token || typeof token !== "string") {
      (socket as any).userId = undefined;
      return next();
    }
    try {
      const payload = jwt.verify(token, config.jwt.secret) as { id: string; email: string; name?: string };
      (socket as any).userId = payload.id;
      (socket as any).username = payload.name ?? payload.email;
      next();
    } catch {
      (socket as any).userId = undefined;
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    console.log(`[WS] Client connected${userId ? ` (user: ${userId})` : ""}`);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Join co-editing session
    socket.on("join:board", (boardId: string) => {
      socket.join(`board:${boardId}`);
      socket.to(`board:${boardId}`).emit("user:joined", {
        userId,
        username: (socket as any).username,
      });
    });

    // Leave co-editing session
    socket.on("leave:board", (boardId: string) => {
      socket.leave(`board:${boardId}`);
      socket.to(`board:${boardId}`).emit("user:left", { userId });
    });

    // Cursor position update
    socket.on("cursor:move", (data: { boardId: string; position: { x: number; y: number } }) => {
      socket.to(`board:${data.boardId}`).emit("cursor:moved", {
        userId,
        username: (socket as any).username,
        position: data.position,
      });
    });

    // Mood board item update
    socket.on("board:update", (data: { boardId: string; items: unknown[] }) => {
      socket.to(`board:${data.boardId}`).emit("board:updated", {
        userId,
        items: data.items,
      });
    });

    // Co-editing action
    socket.on("board:action", (data: { boardId: string; action: string; payload: unknown }) => {
      socket.to(`board:${data.boardId}`).emit("board:action", {
        userId,
        action: data.action,
        payload: data.payload,
      });
    });

    // Join name generation session
    socket.on("join:generation", (generationId: string) => {
      socket.join(`generation:${generationId}`);
    });

    // Name generation progress
    socket.on("generation:progress", (data: { generationId: string; progress: number; names?: string[] }) => {
      io.to(`generation:${data.generationId}`).emit("generation:progress", data);
    });

    // Notification
    socket.on("notification:send", (data: { targetUserId: string; notification: unknown }) => {
      io.to(`user:${data.targetUserId}`).emit("notification:received", data.notification);
    });

    socket.on("disconnect", () => {
      console.log(`[WS] Client disconnected (user: ${userId})`);
    });
  });
}
