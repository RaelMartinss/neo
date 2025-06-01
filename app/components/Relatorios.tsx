"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Users,
  FileText,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Sale {
  id: string;
  customerId: string | null;
  userId: string;
  totalAmount: number;
  createdAt: string;
  customer: { name: string } | null;
  saleItems: { product: { name: string; salePrice: number }; quantity: number; unitPrice: number }[];
  user: { name: string };
}

interface ReportData {
  vendas: { period: string; vendas: number; lucro: number }[];
  topProducts: { name: string; vendas: number; receita: number }[];
  estoque: { name: string; estoque: number; minimo: number; status: string }[];
  financeiro: { mes: string; receita: number; despesas: number; lucro: number }[];
  clientes: { nome: string; compras: number; valorTotal: number; ultimaCompra: string }[];
}

export default function Relatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedTab, setSelectedTab] = useState("vendas");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    vendas: [],
    topProducts: [],
    estoque: [],
    financeiro: [],
    clientes: [],
  });

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, selectedTab]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      if (!selectedTab) {
        throw new Error("Tipo de relatório não selecionado (selectedTab é null).");
      }
      if (!selectedPeriod) {
        throw new Error("Período não selecionado (selectedPeriod é null).");
      }
  
      console.log(`PRO ------- Fetching report of type: ${selectedTab} for period: ${selectedPeriod}`);
      const response = await fetch(`/api/reports/${selectedTab}?period=${selectedPeriod}`);
      console.log("Response:", response);
  
      if (!response.ok) {
        throw new Error(`Falha ao carregar dados do relatório: ${response.status} ${response.statusText}`);
      }
  
      const rawData = await response.json();
      console.log("Raw Data:", rawData);
  
      let processedData: ReportData = {
        vendas: [],
        topProducts: [],
        estoque: [],
        financeiro: [],
        clientes: [],
      };
  
      if (selectedTab === "vendas" && Array.isArray(rawData)) {
        // Agrupar vendas por período (dia, semana, mês, ano)
        const salesByPeriod = rawData.reduce((acc: { [key: string]: { vendas: number; lucro: number } }, sale: Sale) => {
          const date = new Date(sale.createdAt);
          let periodKey: string;
          if (selectedPeriod === "day") periodKey = date.toLocaleDateString("pt-BR");
          else if (selectedPeriod === "week") periodKey = `Semana ${Math.floor(date.getDate() / 7) + 1} - ${date.getMonth() + 1}`;
          else if (selectedPeriod === "month") periodKey = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
          else if (selectedPeriod === "year") periodKey = date.getFullYear().toString();
          else periodKey = "Personalizado";
  
          if (!acc[periodKey]) {
            acc[periodKey] = { vendas: 0, lucro: 0 };
          }
          acc[periodKey].vendas += sale.totalAmount;
          const lucro = sale.saleItems.reduce((sum, item) => sum + (item.unitPrice - item.product.costPrice) * item.quantity, 0);
          acc[periodKey].lucro += lucro;
          return acc;
        }, {});
  
        processedData.vendas = Object.entries(salesByPeriod).map(([period, data]) => ({
          period,
          vendas: data.vendas,
          lucro: data.lucro,
        }));
  
        // Calcular produtos mais vendidos
        const productSales = rawData.reduce((acc: { [key: string]: { vendas: number; receita: number } }, sale: Sale) => {
          sale.saleItems.forEach((item) => {
            const productName = item.product.name;
            if (!acc[productName]) {
              acc[productName] = { vendas: 0, receita: 0 };
            }
            acc[productName].vendas += item.quantity;
            acc[productName].receita += item.quantity * item.unitPrice;
          });
          return acc;
        }, {});
  
        processedData.topProducts = Object.entries(productSales)
          .map(([name, data]) => ({
            name,
            vendas: data.vendas,
            receita: data.receita,
          }))
          .sort((a, b) => b.vendas - a.vendas);
      } else if (selectedTab === "estoque" && Array.isArray(rawData)) {
        // Processar dados de estoque
        processedData.estoque = rawData.map((product: any) => ({
          name: product.name,
          estoque: product.stockQuantity,
          minimo: product.minStock,
          status: product.status,
        }));
      }
  
      console.log("Processed Data:", processedData);
      setReportData(processedData);
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
      alert(`Erro ao carregar relatório: ${error.message}. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      let dataToExport: { [key: string]: string | number }[] = [];
      let fileName = "";

      switch (selectedTab) {
        case "vendas":
          dataToExport = reportData.vendas.map((item) => ({
            Período: item.period,
            "Vendas (R$)": item.vendas.toFixed(2),
            "Lucro (R$)": item.lucro.toFixed(2),
            "Margem (%)": ((item.lucro / item.vendas) * 100).toFixed(2),
          }));
          fileName = `Relatório_Vendas_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.xlsx`;
          break;
        case "estoque":
          console.log("Exporting estoque data to Excel");
          dataToExport = reportData.estoque.map((item) => ({
            Produto: item.name,
            "Estoque Atual": item.estoque,
            "Estoque Mínimo": item.minimo,
            Status: item.status,
          }));
          fileName = `Relatório_Estoque_${new Date().toISOString().split("T")[0]}.xlsx`;
          break;
        case "financeiro":
          dataToExport = reportData.financeiro.map((item) => ({
            Mês: item.mes,
            "Receita (R$)": item.receita.toFixed(2),
            "Despesas (R$)": item.despesas.toFixed(2),
            "Lucro (R$)": item.lucro.toFixed(2),
            "Margem (%)": ((item.lucro / item.receita) * 100).toFixed(2),
          }));
          fileName = `Relatório_Financeiro_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.xlsx`;
          break;
        case "clientes":
          dataToExport = reportData.clientes.map((item) => ({
            Nome: item.nome,
            Compras: item.compras,
            "Valor Total (R$)": item.valorTotal.toFixed(2),
            "Média por Compra (R$)": (item.valorTotal / item.compras).toFixed(2),
            "Última Compra": item.ultimaCompra,
          }));
          fileName = `Relatório_Clientes_${new Date().toISOString().split("T")[0]}.xlsx`;
          break;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      alert("Erro ao exportar para Excel. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let title = "";
      let columns: { header: string; dataKey: string }[] = [];
      let rows: Array<{ [key: string]: string | number }> = [];

      switch (selectedTab) {
        case "vendas":
          title = `Relatório de Vendas - ${selectedPeriod === "month" ? "Mensal" : "Anual"}`;
          columns = [
            { header: "Período", dataKey: "period" },
            { header: "Vendas (R$)", dataKey: "vendas" },
            { header: "Lucro (R$)", dataKey: "lucro" },
            { header: "Margem (%)", dataKey: "margem" },
          ];
          rows = reportData.vendas.map((item) => ({
            period: item.period,
            vendas: item.vendas.toLocaleString("pt-BR"),
            lucro: item.lucro.toLocaleString("pt-BR"),
            margem: ((item.lucro / item.vendas) * 100).toFixed(2) + "%",
          }));
          break;
        case "estoque":
          title = "Relatório de Estoque";
          columns = [
            { header: "Produto", dataKey: "name" },
            { header: "Estoque Atual", dataKey: "estoque" },
            { header: "Estoque Mínimo", dataKey: "minimo" },
            { header: "Status", dataKey: "status" },
          ];
          rows = reportData.estoque.map((item) => ({
            name: item.name,
            estoque: item.estoque,
            minimo: item.minimo,
            status: item.status,
          }));
          console.log("Exporting estoque data to PDF rows:", rows);
          break;
        case "financeiro":
          title = `Relatório Financeiro - ${selectedPeriod === "month" ? "Mensal" : "Anual"}`;
          columns = [
            { header: "Mês", dataKey: "mes" },
            { header: "Receita (R$)", dataKey: "receita" },
            { header: "Despesas (R$)", dataKey: "despesas" },
            { header: "Lucro (R$)", dataKey: "lucro" },
            { header: "Margem (%)", dataKey: "margem" },
          ];
          rows = reportData.financeiro.map((item) => ({
            mes: item.mes,
            receita: item.receita.toLocaleString("pt-BR"),
            despesas: item.despesas.toLocaleString("pt-BR"),
            lucro: item.lucro.toLocaleString("pt-BR"),
            margem: ((item.lucro / item.receita) * 100).toFixed(2) + "%",
          }));
          break;
        case "clientes":
          title = "Relatório de Clientes";
          columns = [
            { header: "Nome", dataKey: "nome" },
            { header: "Compras", dataKey: "compras" },
            { header: "Valor Total (R$)", dataKey: "valorTotal" },
            { header: "Média (R$)", dataKey: "media" },
            { header: "Última Compra", dataKey: "ultimaCompra" },
          ];
          rows = reportData.clientes.map((item) => ({
            nome: item.nome,
            compras: item.compras,
            valorTotal: item.valorTotal.toLocaleString("pt-BR"),
            media: (item.valorTotal / item.compras).toFixed(2),
            ultimaCompra: item.ultimaCompra,
          }));
          break;
      }

      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`, 14, 30);

      doc.autoTable({
        startY: 35,
        head: [columns.map((col) => col.header)],
        body: rows.map((row) => columns.map((col) => row[col.dataKey])),
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3 },
      });

      const fileName = `Relatório_${selectedTab}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error);
      alert("Erro ao exportar para PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const reports = [
    {
      id: "vendas",
      title: "Relatório de Vendas",
      description: "Análise detalhada das vendas por período",
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      id: "estoque",
      title: "Relatório de Estoque",
      description: "Posição atual e movimentação do estoque",
      icon: Package,
      color: "bg-blue-500",
    },
    {
      id: "financeiro",
      title: "Relatório Financeiro",
      description: "Fluxo de caixa e análise financeira",
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      id: "clientes",
      title: "Relatório de Clientes",
      description: "Análise do comportamento dos clientes",
      icon: Users,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Analytics</h1>
          <p className="text-gray-600">Análises e insights do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} disabled={isExporting || isLoading}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF} disabled={isExporting || isLoading}>
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FilePdf className="w-4 h-4 mr-2" />}
            Exportar PDF
          </Button>
        </div>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "day", label: "Hoje" },
              { value: "week", label: "Esta Semana" },
              { value: "month", label: "Este Mês" },
              { value: "quarter", label: "Trimestre" },
              { value: "year", label: "Ano" },
              { value: "custom", label: "Personalizado" },
            ].map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period.value)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="grid grid-cols-4 mb-4">
          {reports.map((report) => (
            <TabsTrigger key={report.id} value={report.id} className="flex items-center gap-2">
              <report.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{report.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{reports.find((r) => r.id === selectedTab)?.title}</span>
              <Button variant="outline" size="sm" onClick={loadReportData}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Atualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <TabsContent value="vendas" className="mt-0">
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Período</th>
                            <th className="border p-2 text-right">Vendas (R$)</th>
                            <th className="border p-2 text-right">Lucro (R$)</th>
                            <th className="border p-2 text-right">Margem (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.vendas.map((data, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border p-2">{data.period}</td>
                              <td className="border p-2 text-right">{data.vendas.toLocaleString("pt-BR")}</td>
                              <td className="border p-2 text-right text-green-600">
                                {data.lucro.toLocaleString("pt-BR")}
                              </td>
                              <td className="border p-2 text-right">
                                {((data.lucro / data.vendas) * 100).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td className="border p-2">Total</td>
                            <td className="border p-2 text-right">
                              {reportData.vendas.reduce((sum, item) => sum + item.vendas, 0).toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right text-green-600">
                              {reportData.vendas.reduce((sum, item) => sum + item.lucro, 0).toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right">
                              {(
                                (reportData.vendas.reduce((sum, item) => sum + item.lucro, 0) /
                                  reportData.vendas.reduce((sum, item) => sum + item.vendas, 0)) *
                                100
                              ).toFixed(2)}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Produtos Mais Vendidos</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border p-2 text-left">Produto</th>
                              <th className="border p-2 text-right">Vendas (un)</th>
                              <th className="border p-2 text-right">Receita (R$)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.topProducts.map((product, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border p-2">{product.name}</td>
                                <td className="border p-2 text-right">{product.vendas}</td>
                                <td className="border p-2 text-right">{product.receita.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="estoque" className="mt-0">
  <div className="space-y-6">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Produto</th>
            <th className="border p-2 text-right">Estoque Atual</th>
            <th className="border p-2 text-right">Estoque Mínimo</th>
            <th className="border p-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {reportData.estoque.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border p-2">{item.name}</td>
              <td className="border p-2 text-right">{item.estoque}</td>
              <td className="border p-2 text-right">{item.minimo}</td>
              <td className="border p-2 text-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === "NORMAL"
                      ? "bg-green-100 text-green-800"
                      : item.status === "LOW"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Produtos em Estoque</p>
            <p className="text-2xl font-bold">
              {reportData.estoque.filter((item) => item.estoque > 0).length}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Produtos com Estoque Baixo</p>
            <p className="text-2xl font-bold text-yellow-600">
              {reportData.estoque.filter((item) => item.status === "LOW").length}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Produtos Esgotados</p>
            <p className="text-2xl font-bold text-red-600">
              {reportData.estoque.filter((item) => item.status === "OUT").length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</TabsContent>
                <TabsContent value="financeiro" className="mt-0">
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Mês</th>
                            <th className="border p-2 text-right">Receita (R$)</th>
                            <th className="border p-2 text-right">Despesas (R$)</th>
                            <th className="border p-2 text-right">Lucro (R$)</th>
                            <th className="border p-2 text-right">Margem (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.financeiro.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border p-2">{item.mes}</td>
                              <td className="border p-2 text-right">{item.receita.toLocaleString("pt-BR")}</td>
                              <td className="border p-2 text-right text-red-600">
                                {item.despesas.toLocaleString("pt-BR")}
                              </td>
                              <td className="border p-2 text-right text-green-600">
                                {item.lucro.toLocaleString("pt-BR")}
                              </td>
                              <td className="border p-2 text-right">
                                {((item.lucro / item.receita) * 100).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold">
                            <td className="border p-2">Total</td>
                            <td className="border p-2 text-right">
                              {reportData.financeiro.reduce((sum, item) => sum + item.receita, 0).toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right text-red-600">
                              {reportData.financeiro.reduce((sum, item) => sum + item.despesas, 0).toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right text-green-600">
                              {reportData.financeiro.reduce((sum, item) => sum + item.lucro, 0).toLocaleString("pt-BR")}
                            </td>
                            <td className="border p-2 text-right">
                              {(
                                (reportData.financeiro.reduce((sum, item) => sum + item.lucro, 0) /
                                  reportData.financeiro.reduce((sum, item) => sum + item.receita, 0)) *
                                100
                              ).toFixed(2)}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="clientes" className="mt-0">
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Nome</th>
                            <th className="border p-2 text-right">Compras</th>
                            <th className="border p-2 text-right">Total (R$)</th>
                            <th className="border p-2 text-right">Média (R$)</th>
                            <th className="border p-2 text-center">Última Compra</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.clientes.map((cliente, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border p-2">{cliente.nome}</td>
                              <td className="border p-2 text-right">{cliente.compras}</td>
                              <td className="border p-2 text-right">{cliente.valorTotal.toFixed(2)}</td>
                              <td className="border p-2 text-right">
                                {(cliente.valorTotal / cliente.compras).toFixed(2)}
                              </td>
                              <td className="border p-2 text-center">{cliente.ultimaCompra}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total de Clientes</p>
                            <p className="text-2xl font-bold">{reportData.clientes.length}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Total de Compras</p>
                            <p className="text-2xl font-bold">
                              {reportData.clientes.reduce((sum, cliente) => sum + cliente.compras, 0)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {reportData.clientes.reduce((sum, cliente) => sum + cliente.valorTotal, 0).toFixed(2)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}