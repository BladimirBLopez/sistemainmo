import { sql } from "@/lib/db";

export async function reservarConsultaGeoapify(agenteId) {
  const [fila] = await sql`
    INSERT INTO public.agente_api_limites AS limite (
      agente_id,
      solicitudes,
      ventana_inicio,
      actualizado_en
    )
    VALUES (${agenteId}, 1, NOW(), NOW())
    ON CONFLICT (agente_id) DO UPDATE SET
      solicitudes = CASE
        WHEN limite.ventana_inicio <= NOW() - INTERVAL '1 minute'
        THEN 1
        ELSE limite.solicitudes + 1
      END,
      ventana_inicio = CASE
        WHEN limite.ventana_inicio <= NOW() - INTERVAL '1 minute'
        THEN NOW()
        ELSE limite.ventana_inicio
      END,
      actualizado_en = NOW()
    RETURNING solicitudes <= 20 AS permitido
  `;

  return fila?.permitido === true;
}
