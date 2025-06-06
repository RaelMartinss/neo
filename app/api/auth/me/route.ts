import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getProductByBarcode(barcode: string) {
  return await prisma.product.findUnique({
    where: { barcode },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { barcode } = req.query;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Método ${req.method} não permitido`);
  }

  if (typeof barcode !== "string") {
    return res.status(400).json({ error: "Código de barras inválido" });
  }

  try {
    const product = await getProductByBarcode(barcode);
    if (product) {
      return res.status(200).json(product);
    } else {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({ error: "Erro ao buscar produto" });
  } finally {
    await prisma.$disconnect();
  }
}