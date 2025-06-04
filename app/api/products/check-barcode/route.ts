import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const barcode = url.searchParams.get("barcode");

  if (!barcode) {
    return NextResponse.json({ error: "Código de barras é obrigatório" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findFirst({
      where: { barcode },
    });

    return NextResponse.json({ exists: !!product }, { status: 200 });
  } catch (error) {
    console.error("Erro ao verificar código de barras:", error);
    return NextResponse.json({ error: "Erro interno ao verificar código de barras" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}