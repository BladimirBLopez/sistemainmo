import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";

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

  const operacion = datos.tipo_operacion;
  const moneda = datos.moneda;
  const precio = datos.precio;

  if (
    !["venta", "alquiler"].includes(operacion) ||
    !["BOB", "USD"].includes(moneda) ||
    typeof precio !== "string" ||
    !/^\d{1,12}(\.\d{1,2})?$/.test(precio) ||
    Number(precio) <= 0
  ) {
    return NextResponse.json(
      { error: "Operacion, precio o moneda invalidos" },
      { status: 400 }
    );
  }

  try {
    const [propiedad] = await sql`
      INSERT INTO public.propiedades (
        titulo, tipo, descripcion, departamento,
        ciudad, zona, direccion_privada,
        tipo_operacion, precio, moneda
      )
      VALUES (
        ${titulo}, ${tipo}, ${limpiar("descripcion")},
        ${limpiar("departamento")}, ${limpiar("ciudad")},
        ${limpiar("zona")}, ${limpiar("direccion_privada")},
        ${operacion}, ${precio}, ${moneda}
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
