import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { validarCliente } from "@/lib/validacion-cliente";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Origen no permitido" },
      { status: 403 }
    );
  }

  const tipoContenido = request.headers.get("content-type") || "";

  if (!/^application\/json(?:\s*;|$)/i.test(tipoContenido)) {
    return NextResponse.json(
      { error: "Se requiere JSON" },
      { status: 415 }
    );
  }

  const lectura = await leerJsonLimitado(request, 16384);

  if (!lectura.ok) {
    return NextResponse.json(
      { error: lectura.error },
      { status: lectura.status }
    );
  }

  const datos = lectura.datos;

  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return NextResponse.json(
      { error: "Datos incorrectos" },
      { status: 400 }
    );
  }

  const validacion = validarCliente.safeParse(datos);

  if (!validacion.success) {
    const campo = validacion.error.issues[0]?.path?.[0] || "datos";

    return NextResponse.json(
      { error: "Dato invalido: " + campo },
      { status: 400 }
    );
  }

  const p = validacion.data;

  try {
    const [cliente] = await sql`
      INSERT INTO public.clientes (
        nombre_completo, telefono, telefono_secundario,
        email, tipo_documento, numero_documento,
        roles, departamento, ciudad, zona,
        direccion, notas, estado
      )
      VALUES (
        ${p.nombre_completo},
        ${p.telefono},
        ${p.telefono_secundario},
        ${p.email},
        ${p.tipo_documento},
        ${p.numero_documento},
        ${p.roles},
        ${p.departamento},
        ${p.ciudad},
        ${p.zona},
        ${p.direccion},
        ${p.notas},
        ${p.estado}
      )
      RETURNING id
    `;

    return NextResponse.json(
      {
        ok: true,
        id: String(cliente.id),
        mensaje: "Cliente registrado correctamente"
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el cliente" },
      { status: 503 }
    );
  }
}
