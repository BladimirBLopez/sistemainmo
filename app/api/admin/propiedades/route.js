import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { validarPropiedad } from "@/lib/validacion-propiedad";

export const runtime = "nodejs";

export async function POST(request) {
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

  let datos;

  try {
    const limite = 16384;
    const lector = request.body?.getReader();

    if (!lector) {
      throw new Error("Solicitud vacia");
    }

    const partes = [];
    let total = 0;

    while (true) {
      const { done, value } = await lector.read();
      if (done) break;

      total += value.byteLength;

      if (total > limite) {
        await lector.cancel();
        return NextResponse.json(
          { error: "Solicitud demasiado grande" },
          { status: 413 }
        );
      }

      partes.push(Buffer.from(value));
    }

    datos = JSON.parse(
      Buffer.concat(partes).toString("utf8")
    );
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

  const limites = {
    titulo: 150,
    tipo: 60,
    descripcion: 4000,
    departamento: 80,
    ciudad: 100,
    zona: 120,
    direccion_privada: 300
  };

  for (const [campo, maximo] of Object.entries(limites)) {
    const valor = datos[campo];

    if (valor != null &&
        (typeof valor !== "string" || valor.length > maximo)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400 }
      );
    }
  }

  const limpiar = (campo) => datos[campo]?.trim() || null;

  const titulo = limpiar("titulo");
  const tipo = limpiar("tipo");

  if (!titulo || !tipo) {
    return NextResponse.json(
      { error: "Titulo y tipo son obligatorios" },
      { status: 400 }
    );
  }

  const tiposPermitidos = new Set([
    "Casa",
    "Departamento",
    "Terreno",
    "Local comercial",
    "Oficina",
    "Galpon",
    "Quinta",
    "Otro"
  ]);

  if (!tiposPermitidos.has(tipo)) {
    return NextResponse.json(
      { error: "Tipo de inmueble no permitido" },
      { status: 400 }
    );
  }

  const validacion = validarPropiedad.safeParse(datos);

  if (!validacion.success) {
    const campo = validacion.error.issues[0]?.path?.[0] || "datos";
    return NextResponse.json(
      { error: "Dato invalido: " + campo },
      { status: 400 }
    );
  }

  const {
    tipo_operacion: operacion,
    moneda,
    precio,
    ...caracteristicas
  } = validacion.data;

  try {
    const [propiedad] = await sql`
      INSERT INTO public.propiedades (
        titulo, tipo, descripcion, departamento,
        ciudad, zona, direccion_privada,
        tipo_operacion, precio, moneda,
        dormitorios, banos, parqueos,
        superficie_terreno_m2, superficie_construida_m2
      )
      VALUES (
        ${titulo}, ${tipo}, ${limpiar("descripcion")},
        ${limpiar("departamento")}, ${limpiar("ciudad")},
        ${limpiar("zona")}, ${limpiar("direccion_privada")},
        ${operacion}, ${precio}, ${moneda},
        ${caracteristicas.dormitorios},
        ${caracteristicas.banos},
        ${caracteristicas.parqueos},
        ${caracteristicas.superficie_terreno_m2},
        ${caracteristicas.superficie_construida_m2}
      )
      RETURNING id
    `;

    return NextResponse.json(
      { ok: true, id: String(propiedad.id) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar la propiedad" },
      { status: 503 }
    );
  }
}
