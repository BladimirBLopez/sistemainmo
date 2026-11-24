import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  obtenerAgenteDeRequest,
  agenteTienePropiedad
} from "@/lib/autorizacion-agente";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const agente = await obtenerAgenteDeRequest(request);

    if (!agente) {
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

    const { id, fotoId } = await params;
    const valido = /^[1-9]\d{0,18}$/;

    if (!valido.test(id) || !valido.test(fotoId)) {
      return NextResponse.json(
        { error: "Identificador invalido" },
        { status: 400 }
      );
    }

    if (!(await agenteTienePropiedad(agente.id, id))) {
      return NextResponse.json(
        { error: "Propiedad no encontrada o no asignada" },
        { status: 404 }
      );
    }

    const [foto] = await sql`
      SELECT i.id
      FROM public.propiedad_imagenes i
      WHERE i.id = ${fotoId}
        AND i.propiedad_id = ${id}
        AND EXISTS (
          SELECT 1
          FROM public.agente_propiedades ap
          JOIN public.agentes a ON a.id = ap.agente_id
          WHERE ap.agente_id = ${agente.id}
            AND ap.propiedad_id = ${id}
            AND a.estado = 'activo'
        )
      LIMIT 1
    `;

    if (!foto) {
      return NextResponse.json(
        { error: "Fotografia no encontrada" },
        { status: 404 }
      );
    }

    const resultados = await sql.transaction([
      sql`
        SELECT id
        FROM public.propiedades
        WHERE id = ${id}
        FOR UPDATE
      `,
      sql`
        UPDATE public.propiedad_imagenes
        SET es_portada = FALSE
        WHERE propiedad_id = ${id}
          AND es_portada = TRUE
          AND EXISTS (
            SELECT 1
            FROM public.agente_propiedades ap
            JOIN public.agentes a ON a.id = ap.agente_id
            WHERE ap.agente_id = ${agente.id}
              AND ap.propiedad_id = ${id}
              AND a.estado = 'activo'
          )
      `,
      sql`
        UPDATE public.propiedad_imagenes
        SET es_portada = TRUE
        WHERE propiedad_id = ${id}
          AND id = ${fotoId}
          AND EXISTS (
            SELECT 1
            FROM public.agente_propiedades ap
            JOIN public.agentes a ON a.id = ap.agente_id
            WHERE ap.agente_id = ${agente.id}
              AND ap.propiedad_id = ${id}
              AND a.estado = 'activo'
          )
        RETURNING id
      `
    ]);

    if (!resultados[2]?.length) {
      return NextResponse.json(
        { error: "No se pudo cambiar la portada o la asignacion ya no existe" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch {
    return NextResponse.json(
      { error: "No se pudo cambiar la portada" },
      { status: 503 }
    );
  }
}
