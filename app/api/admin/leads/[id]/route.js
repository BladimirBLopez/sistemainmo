import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";
import { validarLead } from "@/lib/validacion-lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function autorizado(request) {
  return verificarSesion(
    request.cookies.get(COOKIE_NAME)?.value
  );
}

export async function GET(request, { params }) {
  if (!(await autorizado(request))) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    const [lead] = await sql`
      SELECT
        l.*,
        a.nombre_completo AS agente_nombre,
        c.nombre_completo AS cliente_nombre,
        p.titulo AS propiedad_titulo
      FROM public.leads l
      LEFT JOIN public.agentes a ON a.id = l.agente_id
      LEFT JOIN public.clientes c ON c.id = l.cliente_id
      LEFT JOIN public.propiedades p ON p.id = l.propiedad_id
      WHERE l.id = ${id}
      LIMIT 1
    `;

    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      lead: {
        ...lead,
        id: String(lead.id),
        cliente_id: lead.cliente_id == null ? null : String(lead.cliente_id),
        propiedad_id: lead.propiedad_id == null ? null : String(lead.propiedad_id),
        agente_id: lead.agente_id == null ? null : String(lead.agente_id)
      }
    }, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar el lead" },
      { status: 503 }
    );
  }
}

export async function PUT(request, { params }) {
  if (!(await autorizado(request))) {
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

  const agenteId =
    datos.agente_id == null || datos.agente_id === ""
      ? null
      : String(datos.agente_id);

  if (agenteId && !/^[1-9]\d{0,18}$/.test(agenteId)) {
    return NextResponse.json(
      { error: "Agente inválido" },
      { status: 400 }
    );
  }

  try {
    if (p.cliente_id) {
      const [cliente] = await sql`
        SELECT id FROM public.clientes
        WHERE id = ${p.cliente_id}
        LIMIT 1
      `;

      if (!cliente) {
        return NextResponse.json(
          { error: "Cliente no encontrado" },
          { status: 404 }
        );
      }
    }

    if (p.propiedad_id) {
      const [propiedad] = await sql`
        SELECT id FROM public.propiedades
        WHERE id = ${p.propiedad_id}
        LIMIT 1
      `;

      if (!propiedad) {
        return NextResponse.json(
          { error: "Propiedad no encontrada" },
          { status: 404 }
        );
      }
    }

    if (agenteId) {
      const [agente] = await sql`
        SELECT id FROM public.agentes
        WHERE id = ${agenteId}
          AND estado = 'activo'
        LIMIT 1
      `;

      if (!agente) {
        return NextResponse.json(
          { error: "Agente no encontrado o inactivo" },
          { status: 404 }
        );
      }
    }

    const [resultado] = await sql`
      WITH anterior AS (
        SELECT id, agente_id, estado
        FROM public.leads
        WHERE id = ${id}
      ),
      actualizado AS (
        UPDATE public.leads l
        SET
          cliente_id = ${p.cliente_id},
          propiedad_id = ${p.propiedad_id},
          agente_id = ${agenteId},
          nombre_contacto = ${p.nombre_contacto},
          telefono = ${p.telefono},
          email = ${p.email},
          origen = ${p.origen},
          origen_detalle = ${p.origen_detalle},
          estado = ${p.estado},
          prioridad = ${p.prioridad},
          tipo_operacion = ${p.tipo_operacion},
          tipo_inmueble = ${p.tipo_inmueble},
          departamento = ${p.departamento},
          ciudad = ${p.ciudad},
          zona = ${p.zona},
          presupuesto_min = ${p.presupuesto_min},
          presupuesto_max = ${p.presupuesto_max},
          moneda = ${p.moneda},
          mensaje = ${p.mensaje},
          motivo_perdida = ${p.motivo_perdida},
          actualizado_en = NOW()
        FROM anterior a
        WHERE l.id = a.id
        RETURNING l.id, l.agente_id, l.estado
      ),
      historial AS (
        INSERT INTO public.lead_asignaciones_historial (
          lead_id,
          agente_anterior_id,
          agente_nuevo_id,
          actor_tipo,
          observacion
        )
        SELECT
          u.id,
          a.agente_id,
          u.agente_id,
          'admin',
          'Responsable actualizado desde administración'
        FROM actualizado u
        JOIN anterior a ON a.id = u.id
        WHERE a.agente_id IS DISTINCT FROM u.agente_id
        RETURNING id
      ),
      actividad AS (
        INSERT INTO public.lead_actividades (
          lead_id,
          tipo,
          titulo,
          descripcion,
          estado,
          creado_por_tipo
        )
        SELECT
          u.id,
          'cambio_estado',
          'Cambio de estado',
          'Estado anterior: ' || a.estado ||
          '. Nuevo estado: ' || u.estado,
          'completada',
          'admin'
        FROM actualizado u
        JOIN anterior a ON a.id = u.id
        WHERE a.estado IS DISTINCT FROM u.estado
        RETURNING id
      )
      SELECT id FROM actualizado
    `;

    if (!resultado) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(resultado.id),
      mensaje: "Lead actualizado correctamente"
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el lead" },
      { status: 503 }
    );
  }
}
