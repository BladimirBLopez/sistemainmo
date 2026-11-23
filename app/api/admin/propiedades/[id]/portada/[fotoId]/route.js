import { NextResponse } from "next/server";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request, { params }) {
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

  const { id, fotoId } = await params;
  const valido = /^[1-9]\d{0,18}$/;

  if (!valido.test(id) || !valido.test(fotoId)) {
    return NextResponse.json(
      { error: "Identificador invalido" },
      { status: 400 }
    );
  }

  try {
    const [foto] = await sql`
      SELECT id
      FROM public.propiedad_imagenes
      WHERE id = ${fotoId}
        AND propiedad_id = ${id}
      LIMIT 1
    `;

    if (!foto) {
      return NextResponse.json(
        { error: "Fotografia no encontrada" },
        { status: 404 }
      );
    }

    await sql.transaction([
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
      `,
      sql`
        UPDATE public.propiedad_imagenes
        SET es_portada = TRUE
        WHERE propiedad_id = ${id}
          AND id = ${fotoId}
      `
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo cambiar la portada" },
      { status: 503 }
    );
  }
}
