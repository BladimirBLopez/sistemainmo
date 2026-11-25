import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";
import { validarCampana } from "@/lib/validacion-marketing";

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
      INSERT INTO public.marketing_campanas (
        nombre,
        descripcion,
        objetivo,
        tipo,
        estado,
        presupuesto,
        moneda,
        fecha_inicio,
        fecha_fin
      )
      VALUES (
        ${p.nombre},
        ${p.descripcion},
        ${p.objetivo},
        ${p.tipo},
        ${p.estado},
        ${p.presupuesto},
        ${p.moneda},
        ${p.fecha_inicio},
        ${p.fecha_fin}
      )
      RETURNING id
    `;

    return NextResponse.json({
      ok: true,
      id: String(campana.id),
      mensaje: "Campaña registrada correctamente"
    }, { status: 201 });

  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar la campaña" },
      { status: 503 }
    );
  }
}
