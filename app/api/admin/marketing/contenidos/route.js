import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";
import { validarContenidoMarketing } from "@/lib/validacion-contenido-marketing";

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

  const validacion = validarContenidoMarketing.safeParse(lectura.datos);

  if (!validacion.success) {
    return NextResponse.json(
      {
        error: "Datos del contenido inválidos",
        campo: validacion.error.issues[0]?.path?.[0]
      },
      { status: 400 }
    );
  }

  const p = validacion.data;

  try {
    const [contenido] = await sql`
      INSERT INTO public.marketing_contenidos (
        campana_id,
        titulo,
        plataforma,
        formato,
        texto_publicacion,
        fecha_programada,
        estado,
        url_publicacion,
        recurso_url,
        publicado_en
      )
      SELECT
        ${p.campana_id}::bigint,
        ${p.titulo},
        ${p.plataforma},
        ${p.formato},
        ${p.texto_publicacion},
        ${p.fecha_programada}::timestamp AT TIME ZONE 'America/La_Paz',
        ${p.estado},
        ${p.url_publicacion},
        ${p.recurso_url},
        CASE
          WHEN ${p.estado} = 'publicado' THEN NOW()
          ELSE NULL
        END
      WHERE
        ${p.campana_id}::bigint IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.marketing_campanas
          WHERE id = ${p.campana_id}::bigint
        )
      RETURNING id
    `;

    if (!contenido) {
      return NextResponse.json(
        { error: "La campaña indicada no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(contenido.id),
      mensaje: "Contenido registrado correctamente."
    }, { status: 201 });

  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el contenido." },
      { status: 503 }
    );
  }
}
