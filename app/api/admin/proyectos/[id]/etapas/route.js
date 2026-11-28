import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { leerAdminJson } from "@/lib/api-admin";
import { validarEtapa } from "@/lib/validacion-etapa";
import { recalcularAvance } from "@/lib/avance-proyecto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(String(id)))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { respuesta, datos: p } =
    await leerAdminJson(request, validarEtapa, "Datos de etapa inválidos");
  if (respuesta) return respuesta;

  try {
    const [e] = await sql`
      INSERT INTO public.proyecto_etapas
        (proyecto_id, nombre, orden, estado, avance_porcentaje, fecha_inicio, fecha_fin)
      SELECT ${id}::bigint, ${p.nombre}, ${p.orden}, ${p.estado},
        ${p.avance_porcentaje}, ${p.fecha_inicio}::date, ${p.fecha_fin}::date
      WHERE EXISTS (SELECT 1 FROM public.proyectos WHERE id = ${id}::bigint)
      RETURNING id`;
    if (!e)
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    await recalcularAvance(id);
    return NextResponse.json({
      ok: true, id: String(e.id), mensaje: "Etapa registrada correctamente"
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar la etapa" }, { status: 503 });
  }
}
