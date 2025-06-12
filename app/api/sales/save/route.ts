import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { saleNumber, userId, totalAmount, items } = await request.json();
  console.log("Dados recebidos:", { saleNumber, userId, totalAmount, items });
  if (!saleNumber || !userId || !totalAmount || !items) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  try {
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        customerId: null,
        userId,
        totalAmount,
        saleItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          })),
        },
      },
    });
    return NextResponse.json({ message: `Venda ${saleNumber} salva com sucesso`, sale });
  } catch (error) {
    console.error("Erro ao salvar venda:", error);
    return NextResponse.json({ error: "Falha ao salvar venda" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}