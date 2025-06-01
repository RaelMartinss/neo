"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Scan, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
}

export default function PDV() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [total, setTotal] = useState(0)

  const products = [
    { id: "1", name: "Coca-Cola 350ml", price: 4.5, barcode: "7894900011517" },
    { id: "2", name: "Pão de Açúcar 500g", price: 3.2, barcode: "7891234567890" },
    { id: "3", name: "Leite Integral 1L", price: 5.8, barcode: "7891234567891" },
    { id: "4", name: "Arroz Branco 5kg", price: 18.9, barcode: "7891234567892" },
  ]

  const addToCart = (product: (typeof products)[0]) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price,
      }
      setCart([...cart, newItem])
      setTotal(total + product.price)
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }

    const updatedCart = cart.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          quantity: newQuantity,
          total: item.price * newQuantity,
        }
      }
      return item
    })

    setCart(updatedCart)
    setTotal(updatedCart.reduce((sum, item) => sum + item.total, 0))
  }

  const removeFromCart = (id: string) => {
    const updatedCart = cart.filter((item) => item.id !== id)
    setCart(updatedCart)
    setTotal(updatedCart.reduce((sum, item) => sum + item.total, 0))
  }

  const filteredProducts = products.filter(
    (product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.barcode.includes(searchTerm),
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ponto de Venda (PDV)</h1>
        <p className="text-gray-600">Sistema de vendas integrado</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar produto ou código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Scan className="w-4 h-4 mr-2" />
                  Scanner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-600">Código: {product.barcode}</p>
                    <p className="text-lg font-bold text-green-600">R$ {product.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Carrinho de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Carrinho vazio</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-bold">R$ {item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">R$ {total.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" size="lg">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Dinheiro
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Cartão
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                      <Smartphone className="w-4 h-4 mr-2" />
                      PIX
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
