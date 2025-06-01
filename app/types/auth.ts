export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  permissions: Permission[]
  isActive: boolean
  createdAt: string
  lastLogin?: string
  password?: string // Optional for security reasons, not returned in API responses
}

export type UserRole = "admin" | "manager" | "cashier" | "stock_manager" | "sales"

export interface Permission {
  module: string
  actions: string[]
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  hasPermission: (module: string, action: string) => boolean
  isLoading: boolean
}
