import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const product = await prisma.product.update({
      where: { id: params.id },
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
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Produto deletado" });
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

function calculateStatus(stockQuantity: number, minStock: number): "NORMAL" | "LOW" | "OUT" {
  if (stockQuantity === 0) return "OUT";
  if (stockQuantity <= minStock) return "LOW";
  return "NORMAL";
}