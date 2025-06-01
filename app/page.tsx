"use client"

import { useState } from "react"
import Sidebar from "./components/Sidebar"
import Dashboard from "./components/Dashboard"
import PDV from "./components/PDV"
import CaixaControl from "./components/CaixaControl"
import EstoqueControl from "./components/EstoqueControl"
import Relatorios from "./components/Relatorios"
import UserManagement from "./components/UserManagement"
import ProtectedRoute from "./components/ProtectedRoute"
import Header from "./components/Header"

export default function Home() {
  const [activeModule, setActiveModule] = useState("dashboard")

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <ProtectedRoute requiredModule="dashboard">
            <Dashboard />
          </ProtectedRoute>
        )
      case "pdv":
        return (
          <ProtectedRoute requiredModule="pdv">
            <PDV />
          </ProtectedRoute>
        )
      case "caixa":
        return (
          <ProtectedRoute requiredModule="caixa">
            <CaixaControl />
          </ProtectedRoute>
        )
      case "estoque":
        return (
          <ProtectedRoute requiredModule="estoque">
            <EstoqueControl />
          </ProtectedRoute>
        )
      case "relatorios":
        return (
          <ProtectedRoute requiredModule="relatorios">
            <Relatorios />
          </ProtectedRoute>
        )
      case "usuarios":
        return (
          <ProtectedRoute requiredModule="usuarios">
            <UserManagement />
          </ProtectedRoute>
        )
      default:
        return (
          <ProtectedRoute requiredModule="dashboard">
            <Dashboard />
          </ProtectedRoute>
        )
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">{renderModule()}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
