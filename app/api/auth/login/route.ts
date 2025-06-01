import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Criar sessão
    const token = await createSession(user.id)

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        module: "auth",
        details: { email },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    })

    // Formatar permissões
    const permissions = user.permissions.map((up) => ({
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

    const response = NextResponse.json({
      user: userResponse,
      token,
    })

    // Definir cookie httpOnly para o token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    })

    return response
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
