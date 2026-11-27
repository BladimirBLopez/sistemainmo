import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioContenido from "@/components/admin/FormularioContenido";

export const dynamic = "force-dynamic";

export default async function EditarContenidoPage({ params }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,17}$/.test(String(id))) {
    notFound();
  }

  const [resultados, campanas] = await Promise.all([
    sql`
      SELECT
        id,
        campana_id,
        titulo,
        plataforma,
        formato,
        texto_publicacion,
        TO_CHAR(
          fecha_programada AT TIME ZONE 'America/La_Paz',
          'YYYY-MM-DD"T"HH24:MI'
        ) AS fecha_programada_local,
        estado,
        url_publicacion,
        recurso_url
      FROM public.marketing_contenidos
      WHERE id = ${id}::bigint
      LIMIT 1
    `,

    sql`
      SELECT id, nombre
      FROM public.marketing_campanas
      WHERE id IN (
        SELECT id
        FROM public.marketing_campanas
        ORDER BY creado_en DESC
        LIMIT 300
      )
      OR id = (
        SELECT campana_id
        FROM public.marketing_contenidos
        WHERE id = ${id}::bigint
      )
      ORDER BY creado_en DESC
    `
  ]);

  const fila = resultados[0];

  if (!fila) notFound();

  const contenido = {
    id: String(fila.id),
    campana_id: fila.campana_id
      ? String(fila.campana_id) : "",
    titulo: fila.titulo,
    plataforma: fila.plataforma,
    formato: fila.formato,
    texto_publicacion: fila.texto_publicacion || "",
    fecha_programada_local: fila.fecha_programada_local || "",
    estado: fila.estado,
    url_publicacion: fila.url_publicacion || "",
    recurso_url: fila.recurso_url || ""
  };

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-6">

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <Link
            href="/admin/marketing/contenidos"
            className="text-sm font-semibold text-brand-600"
          >
            ← Volver a contenidos
          </Link>

          <h2 className="mt-4 text-2xl font-black text-slate-900">
            Editar publicación
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Modifica la información, programación y estado de esta publicación.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <FormularioContenido
            campanas={campanas}
            contenido={contenido}
          />
        </section>

      </div>
    </PanelShell>
  );
}
