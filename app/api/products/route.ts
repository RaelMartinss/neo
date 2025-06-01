import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      supplier: true,
    },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const product = await prisma.product.create({
      data: {
        name: data.name,
        barcode: data.barcode,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        stockQuantity: parseInt(data.stockQuantity),
        minStock: parseInt(data.minStock),
        maxStock: parseInt(data.maxStock),
        costPrice: parseFloat(data.costPrice),
        salePrice: parseFloat(data.salePrice),
        status: calculateStatus(data.stockQuantity, data.minStock),
      },
      include: {
        category: true,
        supplier: true,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}

function calculateStatus(stockQuantity: number, minStock: number): "NORMAL" | "LOW" | "OUT" {
  if (stockQuantity === 0) return "OUT";
  if (stockQuantity <= minStock) return "LOW";
  return "NORMAL";
}