import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";
import { validarMetricasMarketing } from "@/lib/validacion-metricas-marketing";

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

  const tipo = request.headers.get("content-type") || "";

  if (!/^application\/json(?:\s*;|$)/i.test(tipo)) {
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

  const validacion = validarMetricasMarketing.safeParse(
    lectura.datos
  );

  if (!validacion.success) {
    return NextResponse.json(
      {
        error: "Datos de rendimiento inválidos",
        campo: validacion.error.issues[0]?.path?.[0]
      },
      { status: 400 }
    );
  }

  const p = validacion.data;

  try {
    const [registro] = await sql`
      INSERT INTO public.marketing_metricas_diarias (
        campana_id,
        fecha,
        plataforma,
        alcance,
        impresiones,
        clics,
        interacciones,
        mensajes,
        leads_reportados,
        conversiones_reportadas,
        gasto_reportado,
        moneda
      )
      VALUES (
        ${p.campana_id}::bigint,
        ${p.fecha}::date,
        ${p.plataforma},
        ${p.alcance},
        ${p.impresiones},
        ${p.clics},
        ${p.interacciones},
        ${p.mensajes},
        ${p.leads_reportados},
        ${p.conversiones_reportadas},
        ${p.gasto_reportado}::numeric,
        ${p.moneda}
      )
      ON CONFLICT (campana_id, fecha, plataforma)
      DO UPDATE SET
        alcance = EXCLUDED.alcance,
        impresiones = EXCLUDED.impresiones,
        clics = EXCLUDED.clics,
        interacciones = EXCLUDED.interacciones,
        mensajes = EXCLUDED.mensajes,
        leads_reportados = EXCLUDED.leads_reportados,
        conversiones_reportadas = EXCLUDED.conversiones_reportadas,
        gasto_reportado = EXCLUDED.gasto_reportado,
        moneda = EXCLUDED.moneda,
        actualizado_en = NOW()
      RETURNING id
    `;

    return NextResponse.json({
      ok: true,
      id: String(registro.id),
      mensaje: "Métricas registradas correctamente."
    }, { status: 200 });

  } catch (error) {
    if (error?.code === "23503") {
      return NextResponse.json(
        { error: "La campaña indicada no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "No se pudieron guardar las métricas." },
      { status: 503 }
    );
  }
}
