import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";
import { validarContenidoMarketing } from "@/lib/validacion-contenido-marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, context) {
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

  const validacion = validarContenidoMarketing.safeParse(
    lectura.datos
  );

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
      UPDATE public.marketing_contenidos
      SET
        campana_id = ${p.campana_id}::bigint,
        titulo = ${p.titulo},
        plataforma = ${p.plataforma},
        formato = ${p.formato},
        texto_publicacion = ${p.texto_publicacion},
        fecha_programada = ${p.fecha_programada}::timestamp AT TIME ZONE 'America/La_Paz',
        estado = ${p.estado},
        url_publicacion = ${p.url_publicacion},
        recurso_url = ${p.recurso_url},
        publicado_en = CASE
          WHEN ${p.estado} = 'publicado'
            THEN COALESCE(publicado_en, NOW())
          ELSE NULL
        END,
        actualizado_en = NOW()
      WHERE
        id = ${id}::bigint
        AND (
          ${p.campana_id}::bigint IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.marketing_campanas
            WHERE id = ${p.campana_id}::bigint
          )
        )
      RETURNING id
    `;

    if (!contenido) {
      return NextResponse.json(
        {
          error: "La publicación no existe o la campaña indicada no existe."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(contenido.id),
      mensaje: "Publicación actualizada correctamente."
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar la publicación." },
      { status: 503 }
    );
  }
}
