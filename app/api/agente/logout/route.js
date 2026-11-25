import { NextResponse } from "next/server";
import {
  AGENTE_COOKIE_NAME,
  AGENTE_COOKIE_OPTIONS,
  revocarSesionAgente
} from "@/lib/auth-agente";

export async function POST(request) {
  const origen = request.headers.get("origin");

  if (!origen || origen !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Solicitud no permitida" },
      { status: 403 }
    );
  }

  const token = request.cookies.get(
    AGENTE_COOKIE_NAME
  )?.value;

  try {
    if (token) {
      await revocarSesionAgente(token);
    }

    const respuesta = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );

    respuesta.cookies.set(AGENTE_COOKIE_NAME, "", {
      ...AGENTE_COOKIE_OPTIONS,
      maxAge: 0
    });

    return respuesta;

  } catch {
    return NextResponse.json(
      { error: "No se pudo revocar la sesión. Intenta nuevamente." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}
