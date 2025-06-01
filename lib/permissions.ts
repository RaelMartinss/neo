import { prisma } from "./prisma"
import type { UserRole } from "@prisma/client"

export const DEFAULT_PERMISSIONS = {
  ADMIN: [
    { module: "dashboard", action: "view" },
    { module: "pdv", action: "view" },
    { module: "pdv", action: "create" },
    { module: "pdv", action: "edit" },
    { module: "pdv", action: "delete" },
    { module: "caixa", action: "view" },
    { module: "caixa", action: "create" },
    { module: "caixa", action: "edit" },
    { module: "caixa", action: "delete" },
    { module: "caixa", action: "open" },
    { module: "caixa", action: "close" },
    { module: "estoque", action: "view" },
    { module: "estoque", action: "create" },
    { module: "estoque", action: "edit" },
    { module: "estoque", action: "delete" },
    { module: "relatorios", action: "view" },
    { module: "relatorios", action: "export" },
    { module: "usuarios", action: "view" },
    { module: "usuarios", action: "create" },
    { module: "usuarios", action: "edit" },
    { module: "usuarios", action: "delete" },
    { module: "configuracoes", action: "view" },
    { module: "configuracoes", action: "edit" },
  ],
  MANAGER: [
    { module: "dashboard", action: "view" },
    { module: "pdv", action: "view" },
    { module: "pdv", action: "create" },
    { module: "caixa", action: "view" },
    { module: "caixa", action: "create" },
    { module: "caixa", action: "edit" },
    { module: "caixa", action: "open" },
    { module: "caixa", action: "close" },
    { module: "estoque", action: "view" },
    { module: "estoque", action: "create" },
    { module: "estoque", action: "edit" },
    { module: "relatorios", action: "view" },
    { module: "relatorios", action: "export" },
  ],
  CASHIER: [
    { module: "pdv", action: "view" },
    { module: "pdv", action: "create" },
    { module: "caixa", action: "view" },
    { module: "caixa", action: "create" },
  ],
  STOCK_MANAGER: [
    { module: "dashboard", action: "view" },
    { module: "estoque", action: "view" },
    { module: "estoque", action: "create" },
    { module: "estoque", action: "edit" },
    { module: "estoque", action: "delete" },
    { module: "relatorios", action: "view" },
  ],
  SALES: [
    { module: "pdv", action: "view" },
    { module: "pdv", action: "create" },
  ],
}

export async function assignDefaultPermissions(userId: string, role: UserRole) {
  const permissions = DEFAULT_PERMISSIONS[role]

  for (const perm of permissions) {
    // Encontrar ou criar a permissão
    let permission = await prisma.permission.findUnique({
      where: {
        module_action: {
          module: perm.module,
          action: perm.action,
        },
      },
    })

    if (!permission) {
      permission = await prisma.permission.create({
        data: {
          module: perm.module,
          action: perm.action,
        },
      })
    }

    // Atribuir permissão ao usuário
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        userId,
        permissionId: permission.id,
      },
    })
  }
}
