import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, context: { params: Promise<{ barcode: string }> }) {
  const params = await context.params; // Aguarda a resolução dos parâmetros
  const { barcode } = params;

  if (!barcode) {
    return NextResponse.json({ error: "Código de barras inválido" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { barcode },
    });
    if (product) {
      return NextResponse.json(product, { status: 200 });
    } else {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}