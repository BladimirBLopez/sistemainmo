import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { validarEdicionPropiedad } from "@/lib/validacion-propiedad";

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

export async function PUT(request, { params }) {
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

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json(
      { error: "Se requiere JSON" },
      { status: 415 }
    );
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return NextResponse.json(
      { error: "ID invalido" },
      { status: 400 }
    );
  }

  let datos;

  try {
    const lector = request.body?.getReader();

    if (!lector) {
      return NextResponse.json(
        { error: "Solicitud vacia" },
        { status: 400 }
      );
    }

    const partes = [];
    let total = 0;

    while (true) {
      const { done, value } = await lector.read();
      if (done) break;

      total += value.byteLength;

      if (total > 16384) {
        await lector.cancel().catch(() => {});
        return NextResponse.json(
          { error: "Solicitud demasiado grande" },
          { status: 413 }
        );
      }

      partes.push(Buffer.from(value));
    }

    datos = JSON.parse(Buffer.concat(partes).toString("utf8"));
  } catch {
    return NextResponse.json(
      { error: "Datos incorrectos" },
      { status: 400 }
    );
  }

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

  try {
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
      RETURNING id
    `;

    if (!actualizada) {
      return NextResponse.json(
        { error: "Propiedad no encontrada" },
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
