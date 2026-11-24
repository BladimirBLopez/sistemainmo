import { sql } from "@/lib/db";

export async function reservarIntentoAgente(ipHash) {
  const [fila] = await sql`
    INSERT INTO public.agente_login_intentos AS a
      (ip_hash, intentos, ventana_inicio, actualizado_en)
    VALUES (${ipHash}, 1, NOW(), NOW())
    ON CONFLICT (ip_hash) DO UPDATE SET
      intentos = CASE
        WHEN a.ventana_inicio <= NOW() - INTERVAL '15 minutes'
        THEN 1 ELSE a.intentos + 1
      END,
      ventana_inicio = CASE
        WHEN a.ventana_inicio <= NOW() - INTERVAL '15 minutes'
        THEN NOW() ELSE a.ventana_inicio
      END,
      bloqueado_hasta = CASE
        WHEN a.ventana_inicio <= NOW() - INTERVAL '15 minutes'
        THEN NULL
        WHEN a.intentos >= 4
        THEN NOW() + INTERVAL '15 minutes'
        ELSE NULL
      END,
      actualizado_en = NOW()
    WHERE a.bloqueado_hasta IS NULL
       OR a.bloqueado_hasta <= NOW()
    RETURNING intentos <= 5 AS permitido
  `;

  return fila?.permitido === true;
}

export async function limpiarFallosAgente(ipHash) {
  await sql`
    DELETE FROM public.agente_login_intentos
    WHERE ip_hash = ${ipHash}
  `;
}
