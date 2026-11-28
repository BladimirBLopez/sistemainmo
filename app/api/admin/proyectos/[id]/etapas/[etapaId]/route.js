import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerAdminJson } from "@/lib/api-admin";
import { validarEtapa } from "@/lib/validacion-etapa";
import { recalcularAvance } from "@/lib/avance-proyecto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = /^[1-9]\d{0,17}$/;

export async function PUT(request, { params }) {
  const { id, etapaId } = await params;
  if (!ID.test(String(id)) || !ID.test(String(etapaId)))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { respuesta, datos: p } =
    await leerAdminJson(request, validarEtapa, "Datos de etapa inválidos");
  if (respuesta) return respuesta;

  try {
    const [e] = await sql`
      UPDATE public.proyecto_etapas SET
        nombre = ${p.nombre}, orden = ${p.orden}, estado = ${p.estado},
        avance_porcentaje = ${p.avance_porcentaje},
        fecha_inicio = ${p.fecha_inicio}::date, fecha_fin = ${p.fecha_fin}::date
      WHERE id = ${etapaId}::bigint AND proyecto_id = ${id}::bigint
      RETURNING id`;
    if (!e)
      return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
    await recalcularAvance(id);
    return NextResponse.json({ ok: true, id: String(e.id), mensaje: "Etapa actualizada correctamente" });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar la etapa" }, { status: 503 });
  }
}

export async function DELETE(request, { params }) {
  const { id, etapaId } = await params;
  if (!ID.test(String(id)) || !ID.test(String(etapaId)))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  if (!(await verificarSesion(request.cookies.get(COOKIE_NAME)?.value)))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });

  try {
    const [e] = await sql`
      DELETE FROM public.proyecto_etapas
      WHERE id = ${etapaId}::bigint AND proyecto_id = ${id}::bigint
      RETURNING id`;
    if (!e)
      return NextResponse.json({ error: "Etapa no encontrada" }, { status: 404 });
    await recalcularAvance(id);
    return NextResponse.json({ ok: true, mensaje: "Etapa eliminada correctamente" });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar la etapa" }, { status: 503 });
  }
}
