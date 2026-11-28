import { NextResponse } from "next/server";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { leerJsonLimitado } from "@/lib/autorizacion-agente";

const err = (error, status, extra = {}) =>
  NextResponse.json({ error, ...extra }, { status });

export async function leerAdminJson(request, validador, mensaje) {
  if (!(await verificarSesion(request.cookies.get(COOKIE_NAME)?.value)))
    return { respuesta: err("No autorizado", 401) };
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return { respuesta: err("Origen no permitido", 403) };
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || ""))
    return { respuesta: err("Se requiere JSON", 415) };

  const lectura = await leerJsonLimitado(request, 16384);
  if (!lectura.ok) return { respuesta: err(lectura.error, lectura.status) };

  const v = validador.safeParse(lectura.datos);
  if (!v.success)
    return { respuesta: err(mensaje, 400, { campo: v.error.issues[0]?.path?.[0] }) };

  return { datos: v.data };
}
