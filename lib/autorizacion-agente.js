import {
  AGENTE_COOKIE_NAME,
  verificarSesionAgente
} from "@/lib/auth-agente";
import { sql } from "@/lib/db";

export async function obtenerAgenteActivo(token) {
  const sesion = await verificarSesionAgente(token);

  if (!sesion) return null;

  const [agente] = await sql`
    SELECT id
    FROM public.agentes
    WHERE id = ${sesion.id}
      AND estado = 'activo'
    LIMIT 1
  `;

  return agente ? { id: String(agente.id) } : null;
}

export async function obtenerAgenteDeRequest(request) {
  const token = request.cookies.get(
    AGENTE_COOKIE_NAME
  )?.value;

  return obtenerAgenteActivo(token);
}

export async function agenteTienePropiedad(agenteId, propiedadId) {
  const [asignacion] = await sql`
    SELECT 1
    FROM public.agente_propiedades
    WHERE agente_id = ${agenteId}
      AND propiedad_id = ${propiedadId}
    LIMIT 1
  `;

  return Boolean(asignacion);
}

export async function agenteTieneCliente(agenteId, clienteId) {
  const [asignacion] = await sql`
    SELECT 1
    FROM public.agente_clientes
    WHERE agente_id = ${agenteId}
      AND cliente_id = ${clienteId}
    LIMIT 1
  `;

  return Boolean(asignacion);
}

export async function leerJsonLimitado(request, limite = 16384) {
  const lector = request.body?.getReader();

  if (!lector) {
    return {
      ok: false,
      status: 400,
      error: "Solicitud vacia"
    };
  }

  const partes = [];
  let total = 0;

  while (true) {
    const { done, value } = await lector.read();

    if (done) break;

    total += value.byteLength;

    if (total > limite) {
      await lector.cancel().catch(() => {});

      return {
        ok: false,
        status: 413,
        error: "Solicitud demasiado grande"
      };
    }

    partes.push(Buffer.from(value));
  }

  try {
    return {
      ok: true,
      datos: JSON.parse(
        Buffer.concat(partes).toString("utf8")
      )
    };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Datos incorrectos"
    };
  }
}
