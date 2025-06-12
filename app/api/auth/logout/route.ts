import { type NextRequest, NextResponse } from "next/server";
import { invalidateSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value;

    if (token) {
      await invalidateSession(token);

      // Registrar log de auditoria
      const userId = request.headers.get("x-user-id");
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: "LOGOUT",
            module: "auth",
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
          },
        });
      }
    }

    const response = NextResponse.json({ message: "Logout realizado com sucesso" });
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expira imediatamente
    });
    return response;
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}