import { NextResponse } from "next/server";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";

export async function middleware(request) {
  const ruta = request.nextUrl.pathname;

  if (ruta === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const autorizado = await verificarSesion(token);

  if (autorizado) {
    return NextResponse.next();
  }

  if (ruta.startsWith("/api/admin/")) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  return NextResponse.redirect(
    new URL("/admin/login", request.url)
  );
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
