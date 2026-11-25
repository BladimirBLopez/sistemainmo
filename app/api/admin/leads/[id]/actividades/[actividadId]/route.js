import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const estados = ["pendiente", "completada", "cancelada"];

export async function PATCH(request, { params }) {
  if (!(await verificarSesion(
    request.cookies.get(COOKIE_NAME)?.value
  ))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const { id, actividadId } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id) ||
      !/^[1-9]\d{0,18}$/.test(actividadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  if (!/^application\/json(?:\s*;|$)/i.test(
    request.headers.get("content-type") || ""
  )) {
    return NextResponse.json({ error: "Se requiere JSON" }, { status: 415 });
  }

  const lectura = await leerJsonLimitado(request, 2048);

  if (!lectura.ok) {
    return NextResponse.json(
      { error: lectura.error },
      { status: lectura.status }
    );
  }

  const datos = lectura.datos;

  if (!datos || typeof datos !== "object" ||
      Array.isArray(datos) || !estados.includes(datos.estado)) {
    return NextResponse.json(
      { error: "Estado de actividad inválido" },
      { status: 400 }
    );
  }

  const nuevoEstado = datos.estado;

  try {
    const [resultado] = await sql`
      WITH anterior AS (
        SELECT
          id,
          lead_id,
          estado AS estado_anterior
        FROM public.lead_actividades
        WHERE id = ${actividadId}
          AND lead_id = ${id}
      ),
      actualizada AS (
        UPDATE public.lead_actividades la
        SET
          estado = ${nuevoEstado},
          completado_en = CASE
            WHEN ${nuevoEstado} = 'completada'
              THEN COALESCE(la.completado_en, NOW())
            ELSE NULL
          END
        FROM anterior a
        WHERE la.id = a.id
        RETURNING
          la.id,
          la.lead_id,
          la.tipo,
          la.titulo,
          la.estado,
          la.programado_en,
          la.completado_en
      ),
      registro AS (
        INSERT INTO public.lead_actividades (
          lead_id,
          tipo,
          titulo,
          descripcion,
          estado,
          completado_en,
          creado_por_tipo
        )
        SELECT
          u.lead_id,
          'cambio_estado',
          'Cambio de estado de actividad',
          'Actividad "' || u.titulo ||
          '" cambió de ' || a.estado_anterior ||
          ' a ' || u.estado,
          'completada',
          NOW(),
          'admin'
        FROM actualizada u
        JOIN anterior a ON a.id = u.id
        WHERE a.estado_anterior IS DISTINCT FROM u.estado
        RETURNING id
      ),
      lead_actualizado AS (
        UPDATE public.leads l
        SET
          proximo_seguimiento_en = (
            SELECT MIN(s.fecha)
            FROM (
              SELECT la.programado_en AS fecha
              FROM public.lead_actividades la
              WHERE la.lead_id = l.id
                AND la.id <> u.id
                AND la.estado = 'pendiente'
                AND la.programado_en IS NOT NULL

              UNION ALL

              SELECT u.programado_en
              WHERE u.estado = 'pendiente'
                AND u.programado_en IS NOT NULL
            ) s
          ),
          ultimo_contacto_en = (
            SELECT MAX(c.fecha)
            FROM (
              SELECT la.completado_en AS fecha
              FROM public.lead_actividades la
              WHERE la.lead_id = l.id
                AND la.id <> u.id
                AND la.estado = 'completada'
                AND la.tipo IN (
                  'llamada', 'whatsapp', 'correo',
                  'reunion', 'visita'
                )
                AND la.completado_en IS NOT NULL

              UNION ALL

              SELECT u.completado_en
              WHERE u.estado = 'completada'
                AND u.tipo IN (
                  'llamada', 'whatsapp', 'correo',
                  'reunion', 'visita'
                )
                AND u.completado_en IS NOT NULL
            ) c
          ),
          actualizado_en = NOW()
        FROM actualizada u
        WHERE l.id = u.lead_id
        RETURNING l.id
      )
      SELECT u.*
      FROM actualizada u
      JOIN lead_actualizado l ON l.id = u.lead_id
    `;

    if (!resultado) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      actividad: {
        ...resultado,
        id: String(resultado.id),
        lead_id: String(resultado.lead_id)
      },
      mensaje: "Actividad actualizada correctamente"
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar la actividad" },
      { status: 503 }
    );
  }
}
