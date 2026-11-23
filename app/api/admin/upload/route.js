import { NextResponse } from "next/server";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { subirImagen } from "@/lib/subir-imagen";
import { cloudinary } from "@/lib/cloudinary";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const origen = request.headers.get("origin");

  if (!origen || origen !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "Solicitud no permitida" },
      { status: 403 }
    );
  }

  const tamanoSolicitud = Number(
    request.headers.get("content-length")
  );

  if (tamanoSolicitud > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Solicitud demasiado grande" },
      { status: 413 }
    );
  }

  try {
    const tipoContenido = request.headers.get("content-type") || "";

    if (!tipoContenido.startsWith("multipart/form-data;")) {
      return NextResponse.json(
        { error: "Se requiere formulario de imagen" },
        { status: 415 }
      );
    }

    const lector = request.body?.getReader();

    if (!lector) {
      return NextResponse.json(
        { error: "Imagen requerida" },
        { status: 400 }
      );
    }

    const partes = [];
    let total = 0;

    while (true) {
      const { done, value } = await lector.read();
      if (done) break;

      total += value.byteLength;

      if (total > 4 * 1024 * 1024) {
        await lector.cancel();
        return NextResponse.json(
          { error: "Solicitud demasiado grande" },
          { status: 413 }
        );
      }

      partes.push(Buffer.from(value));
    }

    const solicitud = new Request(request.url, {
      method: "POST",
      headers: { "content-type": tipoContenido },
      body: Buffer.concat(partes)
    });

    const form = await solicitud.formData();
    const imagen = form.get("imagen");

    if (!imagen || typeof imagen.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Imagen requerida" },
        { status: 400 }
      );
    }

    const propiedadId = form.get("propiedad_id");

    if (typeof propiedadId !== "string" ||
        !/^[1-9]\d*$/.test(propiedadId)) {
      return NextResponse.json(
        { error: "Propiedad invalida" },
        { status: 400 }
      );
    }

    const [propiedad] = await sql`
      SELECT id FROM public.propiedades
      WHERE id = ${propiedadId}
      LIMIT 1
    `;

    if (!propiedad) {
      return NextResponse.json(
        { error: "Propiedad no encontrada" },
        { status: 404 }
      );
    }

    const resultado = await subirImagen(imagen);

    try {
      const [, fotosGuardadas] = await sql.transaction([
        sql`
          SELECT id
          FROM public.propiedades
          WHERE id = ${propiedadId}
          FOR UPDATE
        `,
        sql`
          INSERT INTO public.propiedad_imagenes (
            propiedad_id, secure_url, public_id, es_portada
          )
          VALUES (
            ${propiedadId},
            ${resultado.secure_url},
            ${resultado.public_id},
            NOT EXISTS (
              SELECT 1
              FROM public.propiedad_imagenes
              WHERE propiedad_id = ${propiedadId}
            )
          )
          RETURNING id
        `
      ]);

      const [foto] = fotosGuardadas;

      if (!foto) {
        throw new Error("Fotografia no registrada");
      }

      return NextResponse.json({
        ok: true,
        imagen_id: String(foto.id),
        ...resultado
      });
    } catch {
      try {
        await cloudinary.uploader.destroy(resultado.public_id);
      } catch {
        console.error("No se pudo limpiar la imagen en Cloudinary");
      }

      return NextResponse.json(
        { error: "No se pudo guardar la fotografia" },
        { status: 503 }
      );
    }
  } catch (error) {
    const imagenInvalida = error instanceof Error &&
      [
        "Imagen invalida o mayor a 3 MB",
        "Formato de imagen no permitido"
      ].includes(error.message);

    return NextResponse.json(
      {
        error: imagenInvalida
          ? error.message
          : "No se pudo subir la imagen"
      },
      { status: imagenInvalida ? 400 : 502 }
    );
  }
}
