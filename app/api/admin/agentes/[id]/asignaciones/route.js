import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function autorizado(request) {
  return verificarSesion(request.cookies.get(COOKIE_NAME)?.value);
}

export async function GET(request, { params }) {
  if (!(await autorizado(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo");
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  const patron = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  if (!["propiedad", "cliente"].includes(tipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  try {
    const [agente] = await sql`
      SELECT id FROM public.agentes WHERE id = ${id} LIMIT 1
    `;

    if (!agente) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    let resultados;

    if (tipo === "propiedad") {
      resultados = await sql`
        SELECT p.id, p.titulo, p.tipo, p.ciudad, p.zona
        FROM public.propiedades p
        WHERE (
          ${q} = ''
          OR p.titulo ILIKE ${patron}
          OR COALESCE(p.ciudad, '') ILIKE ${patron}
          OR COALESCE(p.zona, '') ILIKE ${patron}
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.agente_propiedades ap
          WHERE ap.agente_id = ${id}
            AND ap.propiedad_id = p.id
        )
        ORDER BY p.creado_en DESC
        LIMIT 30
      `;
    } else {
      resultados = await sql`
        SELECT c.id, c.nombre_completo, c.telefono, c.email
        FROM public.clientes c
        WHERE (
          ${q} = ''
          OR c.nombre_completo ILIKE ${patron}
          OR c.telefono ILIKE ${patron}
          OR COALESCE(c.email, '') ILIKE ${patron}
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.agente_clientes ac
          WHERE ac.agente_id = ${id}
            AND ac.cliente_id = c.id
        )
        ORDER BY c.creado_en DESC
        LIMIT 30
      `;
    }

    return NextResponse.json({
      resultados: resultados.map(item => ({
        ...item,
        id: String(item.id)
      }))
    }, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudieron buscar registros" },
      { status: 503 }
    );
  }
}

export async function POST(request, { params }) {
  if (!(await autorizado(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) {
    return NextResponse.json({ error: "Se requiere JSON" }, { status: 415 });
  }

  let lectura;

  try {
    lectura = await leerJsonLimitado(request, 4096);
  } catch {
    return NextResponse.json({ error: "Datos incorrectos" }, { status: 400 });
  }

  if (!lectura.ok) {
    return NextResponse.json({ error: lectura.error }, { status: lectura.status });
  }

  const datos = lectura.datos;

  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return NextResponse.json({ error: "Datos incorrectos" }, { status: 400 });
  }

  const { tipo, registroId, accion } = datos;

  if (
    !["propiedad", "cliente"].includes(tipo) ||
    typeof registroId !== "string" ||
    !/^[1-9]\d{0,18}$/.test(registroId) ||
    !["asignar", "quitar"].includes(accion)
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const [agente] = await sql`
      SELECT id, estado
      FROM public.agentes
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!agente) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    if (accion === "asignar" && agente.estado !== "activo") {
      return NextResponse.json(
        { error: "No puedes asignar registros a un agente inactivo" },
        { status: 409 }
      );
    }

    if (tipo === "propiedad") {
      if (accion === "asignar") {
        const [propiedad] = await sql`
          SELECT id FROM public.propiedades
          WHERE id = ${registroId}
          LIMIT 1
        `;

        if (!propiedad) {
          return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
        }

        await sql`
          INSERT INTO public.agente_propiedades (agente_id, propiedad_id)
          VALUES (${id}, ${registroId})
          ON CONFLICT (agente_id, propiedad_id) DO NOTHING
        `;
      } else {
        await sql`
          DELETE FROM public.agente_propiedades
          WHERE agente_id = ${id}
            AND propiedad_id = ${registroId}
        `;
      }
    } else {
      if (accion === "asignar") {
        const [cliente] = await sql`
          SELECT id FROM public.clientes
          WHERE id = ${registroId}
          LIMIT 1
        `;

        if (!cliente) {
          return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
        }

        await sql`
          INSERT INTO public.agente_clientes (agente_id, cliente_id)
          VALUES (${id}, ${registroId})
          ON CONFLICT (agente_id, cliente_id) DO NOTHING
        `;
      } else {
        await sql`
          DELETE FROM public.agente_clientes
          WHERE agente_id = ${id}
            AND cliente_id = ${registroId}
        `;
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje: accion === "asignar"
        ? "Asignación realizada correctamente"
        : "Asignación retirada correctamente"
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudo modificar la asignación" },
      { status: 503 }
    );
  }
}
