import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";
import { validarGastoMarketing } from "@/lib/validacion-gasto-marketing";

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

  const validacion = validarGastoMarketing.safeParse(lectura.datos);

  if (!validacion.success) {
    return NextResponse.json(
      {
        error: "Datos del gasto inválidos",
        campo: validacion.error.issues[0]?.path?.[0]
      },
      { status: 400 }
    );
  }

  const p = validacion.data;

  try {
    const [gasto] = await sql`
      INSERT INTO public.marketing_gastos (
        campana_id,
        plataforma,
        fecha,
        categoria,
        concepto,
        monto,
        moneda,
        comprobante_url
      )
      SELECT
        ${p.campana_id}::bigint,
        ${p.plataforma},
        ${p.fecha}::date,
        ${p.categoria},
        ${p.concepto},
        ${p.monto}::numeric,
        ${p.moneda},
        ${p.comprobante_url}
      WHERE
        ${p.campana_id}::bigint IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.marketing_campanas
          WHERE id = ${p.campana_id}::bigint
        )
      RETURNING id
    `;

    if (!gasto) {
      return NextResponse.json(
        { error: "La campaña indicada no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(gasto.id),
      mensaje: "Gasto registrado correctamente"
    }, { status: 201 });

  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el gasto." },
      { status: 503 }
    );
  }
}
