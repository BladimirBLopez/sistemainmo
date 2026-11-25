import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import {
  calcularCompatibilidad,
  tieneCriteriosMatching
} from "@/lib/matching-leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (!(await verificarSesion(
    request.cookies.get(COOKIE_NAME)?.value
  ))) {
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
        id,
        propiedad_id,
        tipo_operacion,
        tipo_inmueble,
        departamento,
        ciudad,
        zona,
        presupuesto_min,
        presupuesto_max,
        moneda
      FROM public.leads
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    const propiedades = await sql`
      SELECT
        p.id,
        p.titulo,
        p.tipo,
        p.tipo_operacion,
        p.precio,
        p.moneda,
        p.departamento,
        p.ciudad,
        p.zona,
        p.dormitorios,
        p.banos,
        p.parqueos,
        p.superficie_terreno_m2,
        p.superficie_construida_m2,
        foto.secure_url AS foto_url
      FROM public.propiedades p

      LEFT JOIN LATERAL (
        SELECT pi.secure_url
        FROM public.propiedad_imagenes pi
        WHERE pi.propiedad_id = p.id
        ORDER BY pi.es_portada DESC, pi.id DESC
        LIMIT 1
      ) foto ON TRUE

      WHERE p.estado_publicacion = 'publicada'
        AND p.estado_comercial = 'disponible'

      ORDER BY p.id DESC
    `;

    const resultados = propiedades
      .map(p => ({
        ...p,
        id: String(p.id),
        vinculada: String(p.id) === String(lead.propiedad_id),
        ...calcularCompatibilidad(lead, p)
      }))
      .sort((a, b) =>
        (b.compatibilidad ?? -1) -
        (a.compatibilidad ?? -1)
      );

    return NextResponse.json({
      ok: true,
      total: resultados.length,
      sin_criterios: !tieneCriteriosMatching(lead),
      resultados: resultados.slice(0, 30)
    }, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch (error) {
    console.error("Error en matching administrador:", error);

    return NextResponse.json(
      { error: "No se pudieron calcular las coincidencias" },
      { status: 503 }
    );
  }
}
