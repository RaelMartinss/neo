import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const sequence = await prisma.saleSequence.findFirst();
    let newSaleNumber = 1;
    if (sequence) {
      const updatedSequence = await prisma.saleSequence.update({
        where: { id: sequence.id },
        data: { lastNumber: { increment: 1 } },
      });
      newSaleNumber = updatedSequence.lastNumber;
    } else {
      const newSequence = await prisma.saleSequence.create({ data: { lastNumber: 1 } });
      newSaleNumber = newSequence.lastNumber;
    }
    return NextResponse.json({ saleNumber: newSaleNumber });
  } catch (error) {
    console.error("Erro ao iniciar venda:", error);
    return NextResponse.json({ error: "Falha ao iniciar venda" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}