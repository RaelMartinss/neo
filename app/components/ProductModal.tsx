"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import type { Product, Category, Supplier } from "../types/product"

interface ProductModalProps {
  product?: Product | null
  categories: Category[]
  suppliers: Supplier[]
  onClose: () => void
  onSave: () => void
}

export default function ProductModal({ product, categories, suppliers, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    barcode: "",
    category: "",
    supplier: "",
    costPrice: "",
    salePrice: "",
    stockQuantity: "",
    minStock: "",
    maxStock: "",
    unit: "UN",
    isActive: true,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        barcode: product.barcode || "",
        category: product.category,
        supplier: product.supplier,
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stockQuantity: product.stockQuantity.toString(),
        minStock: product.minStock.toString(),
        maxStock: product.maxStock.toString(),
        unit: product.unit,
        isActive: product.isActive,
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          costPrice: Number.parseFloat(formData.costPrice) || 0,
          salePrice: Number.parseFloat(formData.salePrice) || 0,
          stockQuantity: Number.parseInt(formData.stockQuantity) || 0,
          minStock: Number.parseInt(formData.minStock) || 0,
          maxStock: Number.parseInt(formData.maxStock) || 100,
        }),
      })

      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao salvar produto")
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      alert("Erro ao salvar produto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{product ? "Editar Produto" : "Novo Produto"}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nome do produto"
                />
              </div>

              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Código de barras"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="supplier">Fornecedor *</Label>
                <select
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="costPrice">Preço de Custo</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="salePrice">Preço de Venda</Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="stockQuantity">Estoque Atual</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="unit">Unidade</Label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="UN">Unidade</option>
                  <option value="KG">Quilograma</option>
                  <option value="L">Litro</option>
                  <option value="M">Metro</option>
                  <option value="CX">Caixa</option>
                </select>
              </div>

              <div>
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  name="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="maxStock">Estoque Máximo</Label>
                <Input
                  id="maxStock"
                  name="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={handleChange}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Descrição do produto"
              />
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              <Label htmlFor="isActive">Produto ativo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
