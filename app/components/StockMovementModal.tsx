"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, Minus, RotateCcw } from "lucide-react"
import type { Product } from "../types/product"

interface StockMovementModalProps {
  product: Product
  onClose: () => void
  onSave: () => void
}

export default function StockMovementModal({ product, onClose, onSave }: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [referenceDocument, setReferenceDocument] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movementType,
          quantity: Number.parseInt(quantity) || 0,
          reason,
          referenceDocument,
          unitCost: Number.parseFloat(unitCost) || undefined,
        }),
      })

      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao realizar movimentação")
      }
    } catch (error) {
      console.error("Erro ao realizar movimentação:", error)
      alert("Erro ao realizar movimentação")
    } finally {
      setIsLoading(false)
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "IN":
        return "Entrada"
      case "OUT":
        return "Saída"
      case "ADJUSTMENT":
        return "Ajuste"
      default:
        return type
    }
  }

  const getNewStock = () => {
    const qty = Number.parseInt(quantity) || 0
    switch (movementType) {
      case "IN":
        return product.stockQuantity + qty
      case "OUT":
        return Math.max(0, product.stockQuantity - qty)
      case "ADJUSTMENT":
        return qty
      default:
        return product.stockQuantity
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Movimentação de Estoque</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Produto:</strong> {product.name}
            </p>
            <p>
              <strong>Estoque Atual:</strong> {product.stockQuantity} {product.unit}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo de Movimentação</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={movementType === "IN" ? "default" : "outline"}
                  onClick={() => setMovementType("IN")}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Entrada
                </Button>
                <Button
                  type="button"
                  variant={movementType === "OUT" ? "default" : "outline"}
                  onClick={() => setMovementType("OUT")}
                  className="flex-1"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Saída
                </Button>
                <Button
                  type="button"
                  variant={movementType === "ADJUSTMENT" ? "default" : "outline"}
                  onClick={() => setMovementType("ADJUSTMENT")}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Ajuste
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="quantity">{movementType === "ADJUSTMENT" ? "Novo Estoque" : "Quantidade"} *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                placeholder="0"
                min="0"
              />
              {quantity && (
                <p className="text-sm text-gray-600 mt-1">
                  Novo estoque:{" "}
                  <strong>
                    {getNewStock()} {product.unit}
                  </strong>
                </p>
              )}
            </div>

            {movementType === "IN" && (
              <div>
                <Label htmlFor="unitCost">Custo Unitário</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0.00"
                />
                {unitCost && quantity && (
                  <p className="text-sm text-gray-600 mt-1">
                    Custo total:{" "}
                    <strong>R$ {(Number.parseFloat(unitCost) * Number.parseInt(quantity)).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="reason">Motivo *</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Motivo da movimentação"
              />
            </div>

            <div>
              <Label htmlFor="referenceDocument">Documento de Referência</Label>
              <Input
                id="referenceDocument"
                value={referenceDocument}
                onChange={(e) => setReferenceDocument(e.target.value)}
                placeholder="NF, Pedido, etc."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processando..." : "Confirmar Movimentação"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
