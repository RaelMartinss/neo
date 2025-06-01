import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, assignDefaultPermissions } from "@/lib/auth"
import type { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      permissions: user.permissions.map((up) => ({
        module: up.permission.module,
        action: up.permission.action,
      })),
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase() as UserRole,
      },
    })

    // Atribuir permissões padrão
    await assignDefaultPermissions(user.id, user.role)

    // Registrar log de auditoria
    const adminUserId = request.headers.get("x-user-id")
    if (adminUserId) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: "CREATE_USER",
          module: "users",
          details: { createdUserId: user.id, email: user.email },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      })
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
