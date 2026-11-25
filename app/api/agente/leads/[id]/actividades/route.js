import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  obtenerAgenteDeRequest,
  leerJsonLimitado
} from "@/lib/autorizacion-agente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tipos = [
  "nota", "llamada", "whatsapp", "correo",
  "reunion", "visita", "tarea", "otro"
];

const estados = ["pendiente", "completada", "cancelada"];

export async function POST(request, { params }) {
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

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
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

  const lectura = await leerJsonLimitado(request, 8192);

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

  const tipo = datos.tipo;
  const titulo = typeof datos.titulo === "string"
    ? datos.titulo.trim() : "";

  let descripcion = null;
  if (datos.descripcion != null && datos.descripcion !== "") {
    if (typeof datos.descripcion !== "string") {
      return NextResponse.json({ error: "Descripción inválida" }, { status: 400 });
    }
    descripcion = datos.descripcion.trim() || null;
  }

  const estado = datos.estado ||
    (datos.programado_en ? "pendiente" : "completada");

  let programado = null;

  if (datos.programado_en != null && datos.programado_en !== "") {
    if (typeof datos.programado_en !== "string") {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }

    programado = new Date(datos.programado_en);

    if (Number.isNaN(programado.getTime())) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }
  }

  if (
    !tipos.includes(tipo) ||
    titulo.length < 2 ||
    titulo.length > 160 ||
    (descripcion && descripcion.length > 3000) ||
    !estados.includes(estado)
  ) {
    return NextResponse.json(
      { error: "Datos de actividad inválidos" },
      { status: 400 }
    );
  }

  if (tipo === "visita" && !programado) {
    return NextResponse.json(
      { error: "Las visitas requieren fecha y hora programada" },
      { status: 400 }
    );
  }

  try {
    const [actividad] = await sql`
      WITH nueva AS (
        INSERT INTO public.lead_actividades (
          lead_id, tipo, titulo, descripcion, estado,
          programado_en, completado_en,
          creado_por_tipo, creado_por_agente_id
        )
        SELECT
          l.id, ${tipo}, ${titulo}, ${descripcion},
          ${estado}, ${programado},
          CASE WHEN ${estado} = 'completada' THEN NOW() ELSE NULL END,
          'agente', ${agente.id}
        FROM public.leads l
        WHERE l.id = ${id}
          AND l.agente_id = ${agente.id}
        RETURNING *
      ),
      actualizado AS (
        UPDATE public.leads l
        SET
          proximo_seguimiento_en = (
            SELECT MIN(seguimiento.fecha)
            FROM (
              SELECT la.programado_en AS fecha
              FROM public.lead_actividades la
              WHERE la.lead_id = l.id
                AND la.estado = 'pendiente'
                AND la.programado_en IS NOT NULL
              UNION ALL
              SELECT n.programado_en AS fecha
              WHERE n.estado = 'pendiente'
                AND n.programado_en IS NOT NULL
            ) AS seguimiento
          ),
          ultimo_contacto_en = CASE
            WHEN n.estado = 'completada'
              AND n.tipo IN ('llamada', 'whatsapp', 'correo', 'reunion', 'visita')
              THEN COALESCE(n.completado_en, NOW())
            ELSE l.ultimo_contacto_en
          END,
          actualizado_en = NOW()
        FROM nueva n
        WHERE l.id = n.lead_id
          AND l.agente_id = ${agente.id}
        RETURNING l.id
      )
      SELECT n.* FROM nueva n
      JOIN actualizado u ON u.id = n.lead_id
    `;

    if (!actividad) {
      return NextResponse.json(
        { error: "Lead no encontrado o no asignado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      actividad: {
        ...actividad,
        id: String(actividad.id),
        lead_id: String(actividad.lead_id)
      }
    }, { status: 201 });

  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar la actividad" },
      { status: 503 }
    );
  }
}
