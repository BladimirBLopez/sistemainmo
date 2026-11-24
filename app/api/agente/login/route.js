import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { obtenerIpHash } from "@/lib/login-ip";
import {
  reservarIntentoAgente,
  limpiarFallosAgente
} from "@/lib/agente-login-limite";
import {
  AGENTE_COOKIE_NAME,
  AGENTE_COOKIE_OPTIONS,
  crearSesionAgente
} from "@/lib/auth-agente";

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

    if (!(await reservarIntentoAgente(ipHash))) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta más tarde." },
        { status: 429 }
      );
    }

    if (
      !request.headers.get("content-type")
        ?.startsWith("application/json") ||
      Number(request.headers.get("content-length") || 0) > 8192
    ) {
      return NextResponse.json(
        { error: "Solicitud incorrecta" },
        { status: 400 }
      );
    }

    const datos = await request.json().catch(() => null);

    const email = typeof datos?.email === "string"
      ? datos.email.trim().toLowerCase()
      : "";

    const password = datos?.password;

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 180 ||
      typeof password !== "string" ||
      !password ||
      password.length > 256
    ) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const [agente] = await sql`
      SELECT id, password_hash, estado
      FROM public.agentes
      WHERE LOWER(email) = ${email}
      LIMIT 1
    `;

    if (
      !agente ||
      agente.estado !== "activo" ||
      !(await bcrypt.compare(password, agente.password_hash))
    ) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const token = await crearSesionAgente(agente.id);

    await limpiarFallosAgente(ipHash);

    const respuesta = NextResponse.json({ ok: true });

    respuesta.cookies.set(
      AGENTE_COOKIE_NAME,
      token,
      AGENTE_COOKIE_OPTIONS
    );

    return respuesta;
  } catch {
    return NextResponse.json(
      { error: "Servicio temporalmente no disponible" },
      { status: 503 }
    );
  }
}
