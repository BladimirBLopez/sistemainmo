import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  if (!(await verificarSesion(request.cookies.get(COOKIE_NAME)?.value))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
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

  const estado = datos.estado;
  const password = datos.password === undefined ? "" : datos.password;

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

  if (!["activo", "inactivo"].includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  if (
    typeof password !== "string" ||
    (password !== "" && (password.length < 12 || password.length > 128 || Buffer.byteLength(password, "utf8") > 72))
  ) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 12 caracteres y no superar 72 bytes UTF-8" },
      { status: 400 }
    );
  }

  try {
    let resultado;

    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);

      resultado = await sql`
        UPDATE public.agentes
        SET
          nombre_completo = ${nombre},
          email = ${email},
          telefono = ${telefono},
          estado = ${estado},
          password_hash = ${passwordHash},
          session_version = session_version + 1,
          actualizado_en = NOW()
        WHERE id = ${id}
        RETURNING id
      `;
    } else {
      resultado = await sql`
        UPDATE public.agentes
        SET
          nombre_completo = ${nombre},
          email = ${email},
          telefono = ${telefono},
          estado = ${estado},
          session_version = session_version + CASE WHEN estado IS DISTINCT FROM ${estado} THEN 1 ELSE 0 END,
          actualizado_en = NOW()
        WHERE id = ${id}
        RETURNING id
      `;
    }

    if (!resultado[0]) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      id: String(resultado[0].id),
      mensaje: "Agente actualizado correctamente"
    });

  } catch (error) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Ese correo ya pertenece a otro agente" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "No se pudo actualizar el agente" },
      { status: 503 }
    );
  }
}
