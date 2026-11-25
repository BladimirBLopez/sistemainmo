import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  obtenerAgenteDeRequest,
  agenteTienePropiedad,
  leerJsonLimitado
} from "@/lib/autorizacion-agente";
import { validarEdicionPropiedad } from "@/lib/validacion-propiedad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const agente = await obtenerAgenteDeRequest(request);

    if (!agente) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (typeof id !== "string" || !/^[1-9]\d{0,18}$/.test(id)) {
      return NextResponse.json(
        { error: "ID invalido" },
        { status: 400 }
      );
    }

    const [propiedad] = await sql`
      SELECT
        p.id, p.titulo, p.tipo, p.descripcion,
        p.departamento, p.ciudad, p.zona, p.direccion_privada,
        p.geo_place_id, p.latitud, p.longitud,
        p.estado_publicacion, p.estado_comercial,
        p.tipo_operacion, p.precio, p.moneda,
        p.dormitorios, p.banos, p.parqueos,
        p.superficie_terreno_m2, p.superficie_construida_m2
      FROM public.propiedades p
      WHERE p.id = ${id}
        AND EXISTS (
          SELECT 1
          FROM public.agente_propiedades ap
          JOIN public.agentes a ON a.id = ap.agente_id
          WHERE ap.agente_id = ${agente.id}
            AND ap.propiedad_id = p.id
            AND a.estado = 'activo'
        )
      LIMIT 1
    `;

    if (!propiedad) {
      return NextResponse.json(
        { error: "Propiedad no encontrada o no asignada" },
        { status: 404 }
      );
    }

    const fotos = await sql`
      SELECT id, secure_url, es_portada
      FROM public.propiedad_imagenes
      WHERE propiedad_id = ${id}
      ORDER BY es_portada DESC, orden, id
      LIMIT 30
    `;

    return NextResponse.json(
      { propiedad, fotos },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar la ficha" },
      { status: 503 }
    );
  }
}

export async function PUT(request, { params }) {
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

    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return NextResponse.json(
        { error: "Se requiere JSON" },
        { status: 415 }
      );
    }

    const { id } = await params;

    if (typeof id !== "string" || !/^[1-9]\d{0,18}$/.test(id)) {
      return NextResponse.json(
        { error: "ID invalido" },
        { status: 400 }
      );
    }

    if (!(await agenteTienePropiedad(agente.id, id))) {
      return NextResponse.json(
        { error: "Propiedad no encontrada o no asignada" },
        { status: 404 }
      );
    }

    const lectura = await leerJsonLimitado(request);

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

    const validacion = validarEdicionPropiedad.safeParse(datos);

    if (!validacion.success) {
      const campo = validacion.error.issues[0]?.path?.[0] || "datos";

      return NextResponse.json(
        { error: "Dato invalido: " + campo },
        { status: 400 }
      );
    }

    const p = validacion.data;

    const [actualizada] = await sql`
      UPDATE public.propiedades
      SET
        titulo = ${p.titulo},
        tipo = ${p.tipo},
        descripcion = ${p.descripcion},
        departamento = ${p.departamento},
        ciudad = ${p.ciudad},
        zona = ${p.zona},
        direccion_privada = ${p.direccion_privada},
        geo_place_id = ${p.geo_place_id},
        latitud = ${p.latitud},
        longitud = ${p.longitud},
        estado_publicacion = ${p.estado_publicacion},
        estado_comercial = ${p.estado_comercial},
        tipo_operacion = ${p.tipo_operacion},
        precio = ${p.precio},
        moneda = ${p.moneda},
        dormitorios = ${p.dormitorios},
        banos = ${p.banos},
        parqueos = ${p.parqueos},
        superficie_terreno_m2 = ${p.superficie_terreno_m2},
        superficie_construida_m2 = ${p.superficie_construida_m2},
        actualizado_en = NOW()
      WHERE id = ${id}
        AND EXISTS (
          SELECT 1
          FROM public.agente_propiedades ap
          WHERE ap.agente_id = ${agente.id}
            AND ap.propiedad_id = public.propiedades.id
        )
        AND EXISTS (
          SELECT 1
          FROM public.agentes a
          WHERE a.id = ${agente.id}
            AND a.estado = 'activo'
        )
      RETURNING id
    `;

    if (!actualizada) {
      return NextResponse.json(
        { error: "Propiedad no encontrada o no asignada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(actualizada.id),
      mensaje: "Propiedad actualizada correctamente"
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar la propiedad" },
      { status: 503 }
    );
  }
}
