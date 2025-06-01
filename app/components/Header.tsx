"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Settings } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

export default function Header() {
  const { user, logout } = useAuth()

  const getRoleLabel = (role: string) => {
    const roles = {
      admin: "Administrador",
      manager: "Gerente",
      cashier: "Operador de Caixa",
      stock_manager: "Gestor de Estoque",
      sales: "Vendedor",
    }
    return roles[role as keyof typeof roles] || role
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bem-vindo, {user?.name}</h2>
          <p className="text-sm text-gray-600">{getRoleLabel(user?.role || "")}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-600">{user?.email}</p>
          </div>

          <Avatar>
            <AvatarFallback className="bg-blue-500 text-white">{getInitials(user?.name || "")}</AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
