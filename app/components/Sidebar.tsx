"use client"

import { LayoutDashboard, ShoppingCart, CreditCard, Package, BarChart3, Settings, Users } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

interface SidebarProps {
  activeModule: string
  setActiveModule: (module: string) => void
}

export default function Sidebar({ activeModule, setActiveModule }: SidebarProps) {
  const { hasPermission } = useAuth()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
    { id: "pdv", label: "PDV", icon: ShoppingCart, module: "pdv" },
    { id: "caixa", label: "Controle de Caixa", icon: CreditCard, module: "caixa" },
    { id: "estoque", label: "Estoque", icon: Package, module: "estoque" },
    { id: "relatorios", label: "Relatórios", icon: BarChart3, module: "relatorios" },
    { id: "usuarios", label: "Usuários", icon: Users, module: "usuarios" },
    { id: "configuracoes", label: "Configurações", icon: Settings, module: "configuracoes" },
  ]

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter((item) => hasPermission(item.module, "view"))

  return (
    <div className="w-64 bg-slate-900 text-white">
      <div className="p-6">
        <h1 className="text-xl font-bold">Neogest  Comércio</h1>
        <p className="text-sm text-slate-400">Sistema Integrado</p>
      </div>

      <nav className="mt-6">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-slate-800 transition-colors ${
                activeModule === item.id ? "bg-slate-800 border-r-2 border-blue-500" : ""
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
