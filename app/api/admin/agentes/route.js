import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await verificarSesion(request.cookies.get(COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) {
    return NextResponse.json({ error: "Se requiere JSON" }, { status: 415 });
  }

  let lectura;

  try {
    lectura = await leerJsonLimitado(request, 8192);
  } catch {
    return NextResponse.json({ error: "Datos incorrectos" }, { status: 400 });
  }

  if (!lectura.ok) {
    return NextResponse.json({ error: lectura.error }, { status: lectura.status });
  }

  const datos = lectura.datos;

  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return NextResponse.json({ error: "Datos incorrectos" }, { status: 400 });
  }

  const nombre = typeof datos.nombre_completo === "string"
    ? datos.nombre_completo.trim()
    : "";

  const email = typeof datos.email === "string"
    ? datos.email.trim().toLowerCase()
    : "";

  const telefono = typeof datos.telefono === "string"
    ? datos.telefono.trim() || null
    : datos.telefono === null || datos.telefono === undefined
      ? null : false;

  const password = datos.password;

  if (nombre.length < 2 || nombre.length > 150) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  if (
    email.length > 180 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json({ error: "Correo electrónico inválido" }, { status: 400 });
  }

  if (
    telefono === false ||
    (telefono !== null && (
      telefono.length > 25 ||
      !/^\+?[0-9\s().-]{7,25}$/.test(telefono)
    ))
  ) {
    return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 12 || password.length > 128 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 12 caracteres y no superar 72 bytes UTF-8" },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const [agente] = await sql`
      INSERT INTO public.agentes (
        nombre_completo,
        email,
        password_hash,
        telefono,
        estado
      )
      VALUES (
        ${nombre},
        ${email},
        ${passwordHash},
        ${telefono},
        'activo'
      )
      RETURNING id
    `;

    return NextResponse.json({
      ok: true,
      id: String(agente.id),
      mensaje: "Agente registrado correctamente"
    }, { status: 201 });

  } catch (error) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe un agente con ese correo electrónico" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "No se pudo registrar el agente" },
      { status: 503 }
    );
  }
}
