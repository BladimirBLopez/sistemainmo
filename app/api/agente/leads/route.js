import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  obtenerAgenteDeRequest,
  agenteTieneCliente,
  agenteTienePropiedad,
  leerJsonLimitado
} from "@/lib/autorizacion-agente";
import { validarLead } from "@/lib/validacion-lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const agente = await obtenerAgenteDeRequest(request);

    if (!agente) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);

    const q = (url.searchParams.get("q") || "")
      .trim().slice(0, 100);

    const estados = [
      "nuevo", "contactado", "calificado",
      "visita_programada", "negociacion",
      "ganado", "perdido", "pausado"
    ];

    const prioridades = ["baja", "media", "alta", "urgente"];

    const estadoSolicitado = url.searchParams.get("estado") || "";
    const prioridadSolicitada = url.searchParams.get("prioridad") || "";

    if (
      (estadoSolicitado && !estados.includes(estadoSolicitado)) ||
      (prioridadSolicitada && !prioridades.includes(prioridadSolicitada))
    ) {
      return NextResponse.json(
        { error: "Filtro inválido" },
        { status: 400 }
      );
    }

    const patron = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

    const leads = await sql`
      SELECT
        l.*,
        a.nombre_completo AS agente_nombre,

        (
          SELECT COUNT(*)::int
          FROM public.lead_actividades la
          WHERE la.lead_id = l.id
        ) AS total_actividades

      FROM public.leads l

      LEFT JOIN public.agentes a
        ON a.id = l.agente_id

      WHERE l.agente_id = ${agente.id}
        AND (
          ${q} = ''
          OR l.nombre_contacto ILIKE ${patron}
          OR l.telefono ILIKE ${patron}
          OR COALESCE(l.email, '') ILIKE ${patron}
          OR COALESCE(l.ciudad, '') ILIKE ${patron}
        )
        AND (
          ${estadoSolicitado} = ''
          OR l.estado = ${estadoSolicitado}
        )
        AND (
          ${prioridadSolicitada} = ''
          OR l.prioridad = ${prioridadSolicitada}
        )

      ORDER BY l.actualizado_en DESC
      LIMIT 200
    `;

    return NextResponse.json({
      ok: true,
      total: leads.length,
      leads: leads.map(l => ({
        ...l,
        id: String(l.id),
        cliente_id: l.cliente_id == null ? null : String(l.cliente_id),
        propiedad_id: l.propiedad_id == null ? null : String(l.propiedad_id),
        agente_id: String(l.agente_id)
      }))
    }, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudieron consultar tus leads" },
      { status: 503 }
    );
  }
}

export async function POST(request) {
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

    const datos = lectura.datos;

    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
      return NextResponse.json(
        { error: "Datos incorrectos" },
        { status: 400 }
      );
    }

    const validacion = validarLead.safeParse(datos);

    if (!validacion.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          campo: validacion.error.issues[0]?.path?.[0]
        },
        { status: 400 }
      );
    }

    const p = validacion.data;

    if (
      p.cliente_id &&
      !(await agenteTieneCliente(agente.id, p.cliente_id))
    ) {
      return NextResponse.json(
        { error: "Cliente no encontrado o no asignado" },
        { status: 404 }
      );
    }

    if (
      p.propiedad_id &&
      !(await agenteTienePropiedad(agente.id, p.propiedad_id))
    ) {
      return NextResponse.json(
        { error: "Propiedad no encontrada o no asignada" },
        { status: 404 }
      );
    }

    const [lead] = await sql`
      WITH nuevo AS (
        INSERT INTO public.leads (
          cliente_id,
          propiedad_id,
          agente_id,
          nombre_contacto,
          telefono,
          email,
          origen,
          origen_detalle,
          estado,
          prioridad,
          tipo_operacion,
          tipo_inmueble,
          departamento,
          ciudad,
          zona,
          presupuesto_min,
          presupuesto_max,
          moneda,
          mensaje,
          motivo_perdida,
          creado_por_tipo,
          creado_por_agente_id
        )
        VALUES (
          ${p.cliente_id},
          ${p.propiedad_id},
          ${agente.id},
          ${p.nombre_contacto},
          ${p.telefono},
          ${p.email},
          ${p.origen},
          ${p.origen_detalle},
          ${p.estado},
          ${p.prioridad},
          ${p.tipo_operacion},
          ${p.tipo_inmueble},
          ${p.departamento},
          ${p.ciudad},
          ${p.zona},
          ${p.presupuesto_min},
          ${p.presupuesto_max},
          ${p.moneda},
          ${p.mensaje},
          ${p.motivo_perdida},
          'agente',
          ${agente.id}
        )
        RETURNING id
      ),
      historial AS (
        INSERT INTO public.lead_asignaciones_historial (
          lead_id,
          agente_nuevo_id,
          actor_tipo,
          actor_agente_id,
          observacion
        )
        SELECT
          id,
          ${agente.id},
          'agente',
          ${agente.id},
          'Lead captado por el agente'
        FROM nuevo
        RETURNING id
      )
      SELECT id FROM nuevo
    `;

    return NextResponse.json({
      ok: true,
      id: String(lead.id),
      mensaje: "Lead registrado correctamente"
    }, { status: 201 });

  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el lead" },
      { status: 503 }
    );
  }
}
