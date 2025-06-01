import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { type } = req.query; // "vendas", "estoque", "financeiro", "clientes"
  const { period } = req.query;

  console.log(`FRO --- Received request for type: ${type}, period: ${period}`);

  if (!type || typeof type !== "string") {
    return res.status(400).json({ error: "Parâmetro 'type' é obrigatório e deve ser uma string" });
  }

  if (!period || typeof period !== "string") {
    return res.status(400).json({ error: "Parâmetro 'period' é obrigatório e deve ser uma string" });
  }

  const validPeriods = ["day", "week", "month", "year", "quarter", "custom"];
  if (!validPeriods.includes(period)) {
    return res.status(400).json({ error: `Período inválido. Use um dos seguintes: ${validPeriods.join(", ")}` });
  }

  try {
    let startDate: Date;
    let endDate: Date;
    const now = new Date(); // 1º de junho de 2025, 19:23 -03

    if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === "week") {
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      endDate = new Date(startDate.getTime());
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === "quarter") {
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0, 23, 59, 59, 999);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      startDate = new Date(2024, 0, 1); // Default para "custom" (ajustar conforme necessário)
      endDate = now;
    }

    console.log(`Fetching ${type} from ${startDate} to ${endDate}`);

    let data;
    switch (type) {
      case "vendas":
        data = await prisma.sales.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            customer: true,
            saleItems: {
              include: {
                product: true,
              },
            },
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        break;
      case "estoque":
        data = await prisma.product.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            stockQuantity: "asc",
          },
        });
        break;
      case "financeiro":
        // Implementar lógica para somar vendas e despesas por mês
        const sales = await prisma.sales.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        const expenses = await prisma.expenses.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        interface FinancialReport {
          receita: number;
          despesas: number;
          lucro: number;
        }

        interface Sale {
          totalAmount: number;
        }

        interface Expense {
          amount: number;
        }

        data = {
          receita: sales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0),
          despesas: expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0),
          lucro: sales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0) - expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0),
        } as FinancialReport;
        break;
      case "clientes":
        data = await prisma.customers.findMany({
          include: {
            sales: true,
          },
        });
        break;
      default:
        return res.status(400).json({ error: "Tipo de relatório inválido" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(`Erro ao buscar ${type}:`, error);
    return res.status(500).json({ error: `Erro interno ao buscar ${type}` });
  } finally {
    await prisma.$disconnect();
  }
}