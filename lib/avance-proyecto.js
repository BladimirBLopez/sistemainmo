import { sql } from "@/lib/db";

export async function recalcularAvance(proyectoId) {
  await sql`
    UPDATE public.proyectos p SET
      avance_porcentaje = COALESCE((
        SELECT ROUND(AVG(e.avance_porcentaje))::int
        FROM public.proyecto_etapas e WHERE e.proyecto_id = p.id
      ), p.avance_porcentaje),
      actualizado_en = NOW()
    WHERE p.id = ${proyectoId}::bigint AND p.avance_modo = 'auto'`;
}
