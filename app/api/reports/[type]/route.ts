import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// Exportação nomeada para o método GET
export async function GET(req: NextRequest, context: { params: Promise<{ type: string }> }) {
  // Aguardar a resolução de params
  const params = await context.params;
  console.log('received request for reports:', params);
  
  const { type } = params; // "vendas", "estoque", "financeiro", "clientes"
  console.log(`Report type: ${type}`);
  
  const url = new URL(req.url);
  const period = url.searchParams.get("period");

  // Validação de parâmetros
  if (!type || typeof type !== "string") {
    return NextResponse.json({ error: "Parâmetro 'type' é obrigatório e deve ser uma string" }, { status: 400 });
  }

  if (!period || typeof period !== "string") {
    return NextResponse.json({ error: "Parâmetro 'period' é obrigatório e deve ser uma string" }, { status: 400 });
  }

  const validPeriods = ["day", "week", "month", "year", "quarter", "custom"];
  if (!validPeriods.includes(period)) {
    return NextResponse.json({ error: `Período inválido. Use um dos seguintes: ${validPeriods.join(", ")}` }, { status: 400 });
  }

  try {
    // Definir intervalo de datas com base no período
    let startDate: Date;
    let endDate: Date;
    const now = new Date(); // 1º de junho de 2025, 20:04 -03

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
        data = await prisma.sale.findMany({
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
        const sales = await prisma.sale.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        const expenses = await prisma.expense.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });
        data = {
          receita: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
          despesas: expenses.reduce((sum, expense) => sum + expense.amount, 0),
          lucro: sales.reduce((sum, sale) => sum + sale.totalAmount, 0) - expenses.reduce((sum, expense) => sum + expense.amount, 0),
        };
        break;
        case "clientes":
          data = await prisma.customer.findMany({
            include: {
              sales: {
                select: {
                  totalAmount: true,
                  createdAt: true,
                },
              },
            },
          });
          break;
      default:
        return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
    }
    console.log('Fetched data-------------------(((((((((()))))))))):', data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(`Erro ao buscar ${type}:`, error);
    return NextResponse.json({ error: `Erro interno ao buscar ${type}` }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}