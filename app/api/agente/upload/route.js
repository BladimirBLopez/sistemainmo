import { NextResponse } from "next/server";
import { obtenerAgenteDeRequest, agenteTienePropiedad } from "@/lib/autorizacion-agente";
import { subirImagen } from "@/lib/subir-imagen";
import { cloudinary } from "@/lib/cloudinary";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

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

    const tipoContenido = request.headers.get("content-type") || "";

    if (!tipoContenido.startsWith("multipart/form-data;")) {
      return NextResponse.json(
        { error: "Se requiere formulario de imagen" },
        { status: 415 }
      );
    }

    const tamano = Number(request.headers.get("content-length") || 0);

    if (Number.isFinite(tamano) && tamano > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Solicitud demasiado grande" },
        { status: 413 }
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
        await lector.cancel().catch(() => {});
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
    const propiedadId = form.get("propiedad_id");

    if (!imagen || typeof imagen.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Imagen requerida" },
        { status: 400 }
      );
    }

    if (
      typeof propiedadId !== "string" ||
      !/^[1-9]\d{0,18}$/.test(propiedadId)
    ) {
      return NextResponse.json(
        { error: "Propiedad invalida" },
        { status: 400 }
      );
    }

    if (!(await agenteTienePropiedad(agente.id, propiedadId))) {
      return NextResponse.json(
        { error: "Propiedad no encontrada o no asignada" },
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
          SELECT
            ${propiedadId},
            ${resultado.secure_url},
            ${resultado.public_id},
            NOT EXISTS (
              SELECT 1
              FROM public.propiedad_imagenes
              WHERE propiedad_id = ${propiedadId}
            )
          WHERE EXISTS (
            SELECT 1
            FROM public.agente_propiedades
            WHERE agente_id = ${agente.id}
              AND propiedad_id = ${propiedadId}
          )
          AND EXISTS (
            SELECT 1
            FROM public.agentes
            WHERE id = ${agente.id}
              AND estado = 'activo'
          )
          RETURNING id
        `
      ]);

      const [foto] = fotosGuardadas;

      if (!foto) {
        await cloudinary.uploader.destroy(resultado.public_id).catch(() => {});
        return NextResponse.json(
          { error: "Propiedad no encontrada o no asignada" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        imagen_id: String(foto.id),
        ...resultado
      });

    } catch {
      await cloudinary.uploader.destroy(resultado.public_id).catch(() => {});

      return NextResponse.json(
        { error: "No se pudo guardar la fotografia" },
        { status: 503 }
      );
    }

  } catch (error) {
    const invalida = error instanceof Error && [
      "Imagen invalida o mayor a 3 MB",
      "Formato de imagen no permitido"
    ].includes(error.message);

    return NextResponse.json(
      {
        error: invalida
          ? error.message
          : "No se pudo subir la imagen"
      },
      { status: invalida ? 400 : 502 }
    );
  }
}
