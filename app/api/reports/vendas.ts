import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { period } = req.query;

  // Validar o parâmetro period
  if (!period || typeof period !== "string") {
    return res.status(400).json({ error: "Parâmetro 'period' é obrigatório e deve ser uma string" });
  }

  const validPeriods = ["day", "week", "month", "year"];
  if (!validPeriods.includes(period)) {
    return res.status(400).json({ error: `Período inválido. Use um dos seguintes: ${validPeriods.join(", ")}` });
  }

  try {
    // Definir intervalo de datas com base no período
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date(); // 1º de junho de 2025, 19:19

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
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    if (startDate === null || endDate === null) {
      throw new Error("startDate or endDate is not defined");
    }
    console.log(`Fetching sales from ${startDate} to ${endDate}`);

    // Buscar vendas no intervalo de datas
    const sales = await prisma.sales.findMany({
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

    return res.status(200).json(sales);
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
    return res.status(500).json({ error: "Erro interno ao buscar vendas" });
  } finally {
    await prisma.$disconnect();
  }
}