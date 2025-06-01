import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const user = await validateSession(token)

    if (!user) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 })
    }

    // Buscar permissões do usuário
    const userWithPermissions = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!userWithPermissions) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Formatar permissões
    const permissions = userWithPermissions.permissions.map((up) => ({
      module: up.permission.module,
      actions: [up.permission.action],
    }))

    // Agrupar ações por módulo
    const groupedPermissions = permissions.reduce(
      (acc, perm) => {
        const existing = acc.find((p) => p.module === perm.module)
        if (existing) {
          existing.actions.push(...perm.actions)
        } else {
          acc.push(perm)
        }
        return acc
      },
      [] as Array<{ module: string; actions: string[] }>,
    )

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      permissions: groupedPermissions,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
    }

    return NextResponse.json({ user: userResponse })
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
