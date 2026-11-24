import { sql } from "@/lib/db";

const LIMITES = {
  admin: 10,
  agente: 5
};

export async function reservarConsultaGemini(perfil, usuarioId) {
  const limite = LIMITES[perfil];
  const id = String(usuarioId ?? "");

  if (!limite) {
    throw new Error("Perfil Gemini no válido");
  }

  if (
    (perfil === "admin" && id !== "admin") ||
    (perfil === "agente" && !/^[1-9]\d{0,18}$/.test(id))
  ) {
    throw new Error("Identificador de usuario no válido");
  }

  const [fila] = await sql`
    INSERT INTO public.gemini_api_limites AS g (
      perfil,
      usuario_id,
      solicitudes,
      ventana_inicio,
      actualizado_en
    )
    VALUES (
      ${perfil},
      ${id},
      1,
      NOW(),
      NOW()
    )
    ON CONFLICT (perfil, usuario_id) DO UPDATE SET
      solicitudes = CASE
        WHEN g.ventana_inicio <= NOW() - INTERVAL '1 minute'
          THEN 1
        WHEN g.solicitudes <= ${limite}
          THEN g.solicitudes + 1
        ELSE g.solicitudes
      END,

      ventana_inicio = CASE
        WHEN g.ventana_inicio <= NOW() - INTERVAL '1 minute'
          THEN NOW()
        ELSE g.ventana_inicio
      END,

      actualizado_en = NOW()

    RETURNING
      solicitudes <= ${limite} AS permitido,

      GREATEST(
        1,
        CEIL(
          EXTRACT(
            EPOCH FROM (
              ventana_inicio + INTERVAL '1 minute' - NOW()
            )
          )
        )::INTEGER
      ) AS retry_after
  `;

  return {
    permitido: fila?.permitido === true,
    retryAfter: Number(fila?.retry_after) || 60
  };
}
