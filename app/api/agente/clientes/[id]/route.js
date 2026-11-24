import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  obtenerAgenteDeRequest,
  agenteTieneCliente,
  leerJsonLimitado
} from "@/lib/autorizacion-agente";
import { validarCliente } from "@/lib/validacion-cliente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    if (!(await agenteTieneCliente(agente.id, id))) {
      return NextResponse.json(
        { error: "Cliente no encontrado o no asignado" },
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

    const validacion = validarCliente.safeParse(datos);

    if (!validacion.success) {
      const campo = validacion.error.issues[0]?.path?.[0] || "datos";

      return NextResponse.json(
        { error: "Dato invalido: " + campo },
        { status: 400 }
      );
    }

    const p = validacion.data;

    const [cliente] = await sql`
      UPDATE public.clientes
      SET
        nombre_completo = ${p.nombre_completo},
        telefono = ${p.telefono},
        telefono_secundario = ${p.telefono_secundario},
        email = ${p.email},
        tipo_documento = ${p.tipo_documento},
        numero_documento = ${p.numero_documento},
        roles = ${p.roles},
        departamento = ${p.departamento},
        ciudad = ${p.ciudad},
        zona = ${p.zona},
        direccion = ${p.direccion},
        notas = ${p.notas},
        estado = ${p.estado},
        actualizado_en = NOW()
      WHERE id = ${id}
        AND EXISTS (
          SELECT 1
          FROM public.agente_clientes ac
          WHERE ac.agente_id = ${agente.id}
            AND ac.cliente_id = public.clientes.id
        )
        AND EXISTS (
          SELECT 1
          FROM public.agentes a
          WHERE a.id = ${agente.id}
            AND a.estado = 'activo'
        )
      RETURNING id
    `;

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado o no asignado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(cliente.id),
      mensaje: "Cliente actualizado correctamente"
    });

  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el cliente" },
      { status: 503 }
    );
  }
}
