"use client"

import type { ReactNode } from "react"
import { useAuth } from "../contexts/AuthContext"
import LoginForm from "./LoginForm"

interface ProtectedRouteProps {
  children: ReactNode
  requiredModule?: string
  requiredAction?: string
}

export default function ProtectedRoute({ children, requiredModule, requiredAction = "view" }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  if (requiredModule && !hasPermission(requiredModule, requiredAction)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta funcionalidade.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
