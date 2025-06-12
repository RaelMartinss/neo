import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Usuário não encontrado ou inativo" }, { status: 404 });
    }

    // Formatar permissões
    const permissions = user.permissions.map((up) => ({
      module: up.permission.module,
      actions: [up.permission.action],
    }));

    const groupedPermissions = permissions.reduce(
      (acc, perm) => {
        const existing = acc.find((p) => p.module === perm.module);
        if (existing) {
          existing.actions.push(...perm.actions);
        } else {
          acc.push(perm);
        }
        return acc;
      },
      [] as Array<{ module: string; actions: string[] }>,
    );

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      permissions: groupedPermissions,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
    };

    return NextResponse.json({ user: userResponse }, { status: 200 });
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}