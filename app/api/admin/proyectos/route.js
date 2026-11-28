import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { leerAdminJson } from "@/lib/api-admin";
import { validarProyecto } from "@/lib/validacion-proyecto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const { respuesta, datos: p } =
    await leerAdminJson(request, validarProyecto, "Datos de proyecto inválidos");
  if (respuesta) return respuesta;

  try {
    const [r] = await sql`
      INSERT INTO public.proyectos (
        nombre, descripcion, tipo, departamento, ciudad, zona, direccion,
        estado, avance_porcentaje, presupuesto, moneda,
        fecha_inicio, fecha_fin_estimada, fecha_fin_real
      ) VALUES (
        ${p.nombre}, ${p.descripcion}, ${p.tipo}, ${p.departamento}, ${p.ciudad},
        ${p.zona}, ${p.direccion}, ${p.estado}, ${p.avance_porcentaje},
        ${p.presupuesto}, ${p.moneda},
        ${p.fecha_inicio}, ${p.fecha_fin_estimada}, ${p.fecha_fin_real}
      ) RETURNING id`;
    return NextResponse.json(
      { ok: true, id: String(r.id), mensaje: "Proyecto registrado correctamente" },
      { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el proyecto" }, { status: 503 });
  }
}
