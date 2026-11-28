import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { leerAdminJson } from "@/lib/api-admin";
import { validarProyecto } from "@/lib/validacion-proyecto";
import { recalcularAvance } from "@/lib/avance-proyecto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,17}$/.test(String(id)))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { respuesta, datos: p } =
    await leerAdminJson(request, validarProyecto, "Datos de proyecto inválidos");
  if (respuesta) return respuesta;

  try {
    const [r] = await sql`
      UPDATE public.proyectos SET
        nombre = ${p.nombre}, descripcion = ${p.descripcion}, tipo = ${p.tipo},
        departamento = ${p.departamento}, ciudad = ${p.ciudad}, zona = ${p.zona},
        direccion = ${p.direccion}, estado = ${p.estado},
        avance_modo = ${p.avance_modo},
        avance_porcentaje = ${p.avance_porcentaje}, presupuesto = ${p.presupuesto},
        moneda = ${p.moneda}, fecha_inicio = ${p.fecha_inicio},
        fecha_fin_estimada = ${p.fecha_fin_estimada}, fecha_fin_real = ${p.fecha_fin_real},
        actualizado_en = NOW()
      WHERE id = ${id}::bigint
      RETURNING id`;
    if (!r) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    await recalcularAvance(id);
    return NextResponse.json({ ok: true, id: String(r.id), mensaje: "Proyecto actualizado correctamente" });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el proyecto" }, { status: 503 });
  }
}
