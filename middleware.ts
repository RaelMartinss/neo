import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export function middleware(request: NextRequest) {
  // Proteger todas as rotas, exceto login e logout
  const protectedPaths = ["/api/auth/:path*", "/pdv", "/estoque"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  if (!isProtected) return NextResponse.next();

  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // Adicionar informações do usuário ao header para todas as rotas protegidas
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-email", payload.email);
  requestHeaders.set("x-user-role", payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/auth/:path*", "/pdv", "/estoque", "/api/:path*"],
};