"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Clock, Plus, Minus, Eye } from "lucide-react"

export default function CaixaControl() {
  const [caixaAberto, setCaixaAberto] = useState(true)
  const [saldoInicial] = useState(500.0)
  const [entradas] = useState(2450.0)
  const [saidas] = useState(150.0)
  const [saldoAtual] = useState(saldoInicial + entradas - saidas)

  const movimentacoes = [
    { id: 1, tipo: "entrada", descricao: "Venda #0001", valor: 125.5, hora: "09:15" },
    { id: 2, tipo: "entrada", descricao: "Venda #0002", valor: 89.9, hora: "09:32" },
    { id: 3, tipo: "saida", descricao: "Sangria", valor: 100.0, hora: "10:00" },
    { id: 4, tipo: "entrada", descricao: "Venda #0003", valor: 245.8, hora: "10:15" },
    { id: 5, tipo: "entrada", descricao: "Suprimento", valor: 200.0, hora: "10:30" },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Controle de Caixa</h1>
        <p className="text-gray-600">Gestão financeira em tempo real</p>
      </div>

      {/* Status do Caixa */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Status do Caixa</span>
              <div
                className={`px-3 py-1 rounded-full text-sm ${
                  caixaAberto ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {caixaAberto ? "Aberto" : "Fechado"}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Saldo Inicial</p>
                <p className="text-2xl font-bold">R$ {saldoInicial.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Entradas</p>
                <p className="text-2xl font-bold text-green-600">R$ {entradas.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Saídas</p>
                <p className="text-2xl font-bold text-red-600">R$ {saidas.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Saldo Atual</p>
                <p className="text-2xl font-bold">R$ {saldoAtual.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movimentações */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {movimentacoes.map((mov) => (
                  <div key={mov.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${mov.tipo === "entrada" ? "bg-green-100" : "bg-red-100"}`}>
                        {mov.tipo === "entrada" ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{mov.descricao}</p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {mov.hora}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${mov.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                        {mov.tipo === "entrada" ? "+" : "-"}R$ {mov.valor.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Suprimento
              </Button>
              <Button className="w-full" variant="outline">
                <Minus className="w-4 h-4 mr-2" />
                Sangria
              </Button>
              <Button className="w-full" variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Conferir Caixa
              </Button>
              <Button
                className="w-full"
                variant={caixaAberto ? "destructive" : "default"}
                onClick={() => setCaixaAberto(!caixaAberto)}
              >
                {caixaAberto ? "Fechar Caixa" : "Abrir Caixa"}
              </Button>
            </CardContent>
          </Card>

          {/* Resumo Rápido */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Resumo do Turno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Vendas:</span>
                  <span className="font-bold">15</span>
                </div>
                <div className="flex justify-between">
                  <span>Ticket Médio:</span>
                  <span className="font-bold">R$ 163,33</span>
                </div>
                <div className="flex justify-between">
                  <span>Dinheiro:</span>
                  <span className="font-bold">R$ 1.250,00</span>
                </div>
                <div className="flex justify-between">
                  <span>Cartão:</span>
                  <span className="font-bold">R$ 1.200,00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
