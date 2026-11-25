import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";
import { validarCampana } from "@/lib/validacion-marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  if (!(await verificarSesion(
    request.cookies.get(COOKIE_NAME)?.value
  ))) {
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

  if (!/^[1-9]\d{0,17}$/.test(String(id))) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  if (!/^application\/json(?:\s*;|$)/i.test(
    request.headers.get("content-type") || ""
  )) {
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

  const validacion = validarCampana.safeParse(lectura.datos);

  if (!validacion.success) {
    return NextResponse.json(
      {
        error: "Datos de campaña inválidos",
        campo: validacion.error.issues[0]?.path?.[0]
      },
      { status: 400 }
    );
  }

  const p = validacion.data;

  try {
    const [campana] = await sql`
      UPDATE public.marketing_campanas
      SET
        nombre = ${p.nombre},
        descripcion = ${p.descripcion},
        objetivo = ${p.objetivo},
        tipo = ${p.tipo},
        estado = ${p.estado},
        presupuesto = ${p.presupuesto},
        moneda = ${p.moneda},
        fecha_inicio = ${p.fecha_inicio},
        fecha_fin = ${p.fecha_fin}
      WHERE id = ${id}::bigint
      RETURNING id
    `;

    if (!campana) {
      return NextResponse.json(
        { error: "Campaña no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(campana.id),
      mensaje: "Campaña actualizada correctamente"
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar la campaña" },
      { status: 503 }
    );
  }
}
