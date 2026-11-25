import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, COOKIE_OPTIONS, crearSesion } from "@/lib/auth";
import { obtenerIpHash } from "@/lib/login-ip";
import { reservarIntento, limpiarFallos } from "@/lib/login-limite";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";

export const runtime = "nodejs";

export async function POST(request) {
  const origen = request.headers.get("origin");
  if (!origen || origen !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Solicitud no permitida" },
      { status: 403 }
    );
  }
  try {
    const ipHash = obtenerIpHash(request);

    if (!(await reservarIntento(ipHash))) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta más tarde." },
        { status: 429 }
      );
    }

    const tipoContenido = request.headers.get("content-type") || "";

    if (!/^application\/json(?:\s*;|$)/i.test(tipoContenido)) {
      return NextResponse.json(
        { error: "Solicitud incorrecta" },
        { status: 415 }
      );
    }

    const lectura = await leerJsonLimitado(request, 8192);

    if (!lectura.ok) {
      return NextResponse.json(
        { error: "Solicitud incorrecta" },
        { status: lectura.status }
      );
    }

    const datos = lectura.datos;

    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
      return NextResponse.json(
        { error: "Solicitud incorrecta" },
        { status: 400 }
      );
    }

    const password = datos.password;

    if (typeof password !== "string" || !password || password.length > 256) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) throw new Error("Configuracion incompleta");

    const a = createHash("sha256").update(password).digest();
    const b = createHash("sha256").update(adminPassword).digest();

    if (!timingSafeEqual(a, b)) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const token = await crearSesion();
    await limpiarFallos(ipHash);

    const respuesta = NextResponse.json({ ok: true });
    respuesta.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);

    return respuesta;
  } catch {
    return NextResponse.json(
      { error: "Servicio temporalmente no disponible" },
      { status: 503 }
    );
  }
}
