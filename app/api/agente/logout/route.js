import { NextResponse } from "next/server";
import {
  AGENTE_COOKIE_NAME,
  AGENTE_COOKIE_OPTIONS
} from "@/lib/auth-agente";

export async function POST(request) {
  const origen = request.headers.get("origin");

  if (!origen || origen !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Solicitud no permitida" },
      { status: 403 }
    );
  }

  const respuesta = NextResponse.json({ ok: true });

  respuesta.cookies.set(AGENTE_COOKIE_NAME, "", {
    ...AGENTE_COOKIE_OPTIONS,
    maxAge: 0
  });

  return respuesta;
}
