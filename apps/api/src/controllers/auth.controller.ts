import { Request, Response, NextFunction } from "express";
import { AuthService } from "@/services/auth.service";
import { asyncHandler } from "@/middleware/error";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body.email, req.body.password);
    res.json(result);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken ?? req.headers["x-refresh-token"];
    if (!refreshToken || typeof refreshToken !== "string") {
      res.status(400).json({ error: { message: "Refresh token required", code: "MISSING_TOKEN" } });
      return;
    }
    const result = await this.authService.refreshToken(refreshToken);
    res.json(result);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.logout(req.user!.id);
    res.json({ message: "Logged out successfully" });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.authService.getProfile(req.user!.id);
    res.json(user);
  });

  setupTotp = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.setupTotp(req.user!.id);
    res.json(result);
  });

  verifyTotp = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.verifyTotpSetup(req.user!.id, req.body.token);
    res.json({ message: "2FA enabled successfully" });
  });

  disableTotp = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.disableTotp(req.user!.id);
    res.json({ message: "2FA disabled successfully" });
  });

  listSessions = asyncHandler(async (req: Request, res: Response) => {
    const sessions = await this.authService.listSessions(req.user!.id);
    res.json(sessions);
  });

  revokeSession = asyncHandler(async (req: Request, res: Response) => {
    await this.authService.revokeSession(req.user!.id, req.params.id);
    res.json({ message: "Session revoked" });
  });
}
