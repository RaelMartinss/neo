export interface Product {
  id: string
  name: string
  description?: string
  barcode?: string
  category: string
  supplier: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  minStock: number
  maxStock: number
  unit: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description?: string
}

export interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
  cnpj?: string
}

export interface StockMovement {
  id: string
  productId: string
  userId: string
  movementType: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  previousStock: number
  newStock: number
  unitCost?: number
  totalCost?: number
  reason?: string
  referenceDocument?: string
  createdAt: string
}

export interface StockStats {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
  activeProducts: number
}

export interface ProductFilters {
  search?: string
  category?: string
  supplier?: string
  status?: "all" | "active" | "inactive" | "low_stock" | "out_of_stock"
}
