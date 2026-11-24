import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    return NextResponse.json(
      { error: "No autorizado" }, { status: 401 }
    );
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return NextResponse.json(
      { error: "ID invalido" }, { status: 400 }
    );
  }

  try {
    const [propiedad] = await sql`
      SELECT id, titulo, tipo, descripcion,
        departamento, ciudad, zona,
        estado_publicacion, estado_comercial,
        tipo_operacion, precio, moneda,
        dormitorios, banos, parqueos,
        superficie_terreno_m2, superficie_construida_m2
      FROM public.propiedades
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!propiedad) {
      return NextResponse.json(
        { error: "Propiedad no encontrada" },
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
