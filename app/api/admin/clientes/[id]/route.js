import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { validarCliente } from "@/lib/validacion-cliente";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";

export const runtime = "nodejs";


export async function PUT(request, { params }) {
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

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return NextResponse.json(
      { error: "ID invalido" },
      { status: 400 }
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
      UPDATE public.clientes
      SET
        nombre_completo = ${p.nombre_completo},
        telefono = ${p.telefono},
        telefono_secundario = ${p.telefono_secundario},
        email = ${p.email},
        tipo_documento = ${p.tipo_documento},
        numero_documento = ${p.numero_documento},
        roles = ${p.roles},
        departamento = ${p.departamento},
        ciudad = ${p.ciudad},
        zona = ${p.zona},
        direccion = ${p.direccion},
        notas = ${p.notas},
        estado = ${p.estado},
        actualizado_en = NOW()
      WHERE id = ${id}
      RETURNING id
    `;

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(cliente.id),
      mensaje: "Cliente actualizado correctamente"
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el cliente" },
      { status: 503 }
    );
  }
}
