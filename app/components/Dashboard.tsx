import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, TrendingUp, Users, AlertTriangle } from "lucide-react"

export default function Dashboard() {
  const stats = [
    {
      title: "Vendas Hoje",
      value: "R$ 12.450,00",
      icon: DollarSign,
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Vendas do Mês",
      value: "R$ 245.680,00",
      icon: TrendingUp,
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Produtos em Estoque",
      value: "1.234",
      icon: Package,
      change: "-2%",
      changeType: "negative",
    },
    {
      title: "Clientes Ativos",
      value: "856",
      icon: Users,
      change: "+15%",
      changeType: "positive",
    },
  ]

  const alerts = [
    { type: "warning", message: "5 produtos com estoque baixo" },
    { type: "info", message: "Caixa 2 precisa ser fechado" },
    { type: "error", message: "Falha na sincronização do produto #1234" },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                  {stat.change} em relação ao período anterior
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((sale) => (
                <div key={sale} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Venda #{String(sale).padStart(4, "0")}</p>
                    <p className="text-sm text-gray-600">Cliente: João Silva</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ 125,50</p>
                    <p className="text-sm text-gray-600">há 5 min</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === "warning"
                      ? "bg-yellow-50 border-yellow-400"
                      : alert.type === "error"
                        ? "bg-red-50 border-red-400"
                        : "bg-blue-50 border-blue-400"
                  }`}
                >
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
