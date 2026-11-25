import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";
import { validarCanal } from "@/lib/validacion-canal-marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, context) {
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

  const { id } = await context.params;

  if (!/^[1-9]\d{0,17}$/.test(String(id))) {
    return NextResponse.json(
      { error: "Identificador incorrecto" },
      { status: 400 }
    );
  }

  const lectura = await leerJsonLimitado(request, 16384);

  if (!lectura.ok) {
    return NextResponse.json(
      { error: lectura.error },
      { status: lectura.status }
    );
  }

  const validacion = validarCanal.safeParse(lectura.datos);

  if (!validacion.success) {
    return NextResponse.json(
      {
        error: "Datos del canal inválidos",
        campo: validacion.error.issues[0]?.path?.[0]
      },
      { status: 400 }
    );
  }

  const p = validacion.data;

  try {
    const [canal] = await sql`
      INSERT INTO public.marketing_campana_canales (
        campana_id,
        plataforma,
        id_externo,
        url_externa,
        estado
      )
      SELECT
        ${id}::bigint,
        ${p.plataforma},
        ${p.id_externo},
        ${p.url_externa},
        ${p.estado}
      WHERE EXISTS (
        SELECT 1
        FROM public.marketing_campanas
        WHERE id = ${id}::bigint
      )
      RETURNING id
    `;

    if (!canal) {
      return NextResponse.json(
        { error: "La campaña no existe" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(canal.id),
      mensaje: "Canal registrado correctamente"
    }, { status: 201 });

  } catch (error) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Este identificador ya está registrado en esta campaña y plataforma." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "No se pudo registrar el canal" },
      { status: 503 }
    );
  }
}
