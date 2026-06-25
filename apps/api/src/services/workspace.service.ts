import { prisma } from "@/config/database";
import { AppError, ConflictError } from "@/utils/errors";

export class WorkspaceService {
  async list(userId: string) {
    return prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        _count: { select: { brandNames: true, searchHistory: true } },
      },
    });
  }

  async create(userId: string, data: { name: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 50);
    return prisma.workspace.create({
      data: {
        name: data.name,
        slug,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  async getById(userId: string, workspaceId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, members: { some: { userId } } },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
        teamBilling: true,
        _count: { select: { brandNames: true, searchHistory: true } },
      },
    });
    if (!workspace) throw new AppError(404, "Workspace not found", "WORKSPACE_NOT_FOUND");
    return workspace;
  }

  async update(userId: string, workspaceId: string, data: { name?: string }) {
    await this.requireRole(userId, workspaceId, "OWNER");
    return prisma.workspace.update({
      where: { id: workspaceId },
      data,
      include: { members: true },
    });
  }

  async delete(userId: string, workspaceId: string) {
    await this.requireRole(userId, workspaceId, "OWNER");
    await prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async invite(userId: string, workspaceId: string, data: { email: string; role?: string }) {
    await this.requireRole(userId, workspaceId, "OWNER", "EDITOR");

    const invitedUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (!invitedUser) throw new AppError(404, "User not found", "USER_NOT_FOUND");

    const existing = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: invitedUser.id },
    });
    if (existing) throw new ConflictError("User already a member");

    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: invitedUser.id,
        role: (data.role as any) ?? "VIEWER",
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeMember(userId: string, workspaceId: string, memberId: string) {
    await this.requireRole(userId, workspaceId, "OWNER");
    await prisma.workspaceMember.delete({ where: { id: memberId } });
  }

  private async requireRole(userId: string, workspaceId: string, ...roles: string[]) {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!member) throw new AppError(404, "Workspace not found", "WORKSPACE_NOT_FOUND");
    if (!roles.includes(member.role)) throw new AppError(403, "Insufficient permissions", "FORBIDDEN");
  }
}
