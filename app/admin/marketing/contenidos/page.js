import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioContenido from "@/components/admin/FormularioContenido";

export const dynamic = "force-dynamic";

const estados = {
  idea: "Idea",
  pendiente: "Pendiente",
  programado: "Programado",
  publicado: "Publicado",
  cancelado: "Cancelado"
};

const plataformas = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  portal: "Portal",
  otro: "Otro"
};

const colores = {
  idea: "bg-slate-100 text-slate-700",
  pendiente: "bg-amber-100 text-amber-700",
  programado: "bg-blue-100 text-blue-700",
  publicado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700"
};

export default async function ContenidosPage({ searchParams }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const parametros = searchParams ? await searchParams : {};

  const estado = Object.hasOwn(estados, parametros.estado)
    ? parametros.estado : "";

  const plataforma = Object.hasOwn(plataformas, parametros.plataforma)
    ? parametros.plataforma : "";

  const busqueda = typeof parametros.q === "string" ? parametros.q.trim().slice(0, 100) : "";
  const campana = typeof parametros.campana === "string" && /^[1-9]\d{0,17}$/.test(parametros.campana) ? parametros.campana : "";
  const terminoBusqueda = "%" + busqueda + "%";

  const porPagina = 20;
  const paginaSolicitada = typeof parametros.pagina === 'string' && /^\d{1,6}$/.test(parametros.pagina) ? Math.max(1, Number(parametros.pagina)) : 1;

  const [campanas, conteo, resumen] = await Promise.all([
    sql`SELECT id, nombre FROM public.marketing_campanas ORDER BY creado_en DESC LIMIT 300`,
    sql`
      SELECT COUNT(*)::int AS total
      FROM public.marketing_contenidos c
      WHERE (${estado} = '' OR c.estado = ${estado})
        AND (${plataforma} = '' OR c.plataforma = ${plataforma})
        AND (${campana} = '' OR c.campana_id::text = ${campana})
        AND (${busqueda} = '' OR c.titulo ILIKE ${terminoBusqueda} OR COALESCE(c.texto_publicacion, '') ILIKE ${terminoBusqueda})
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
          (COUNT(*) FILTER (WHERE estado IN ('idea', 'pendiente')))::int AS pendientes,
        (COUNT(*) FILTER (WHERE estado = 'programado'))::int AS programados,
        (COUNT(*) FILTER (WHERE estado = 'publicado'))::int AS publicados
      FROM public.marketing_contenidos
    `
  ]);

  const totalFiltrado = Number(conteo[0]?.total || 0);
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / porPagina));
  const pagina = Math.min(paginaSolicitada, totalPaginas);
  const offset = (pagina - 1) * porPagina;

  const contenidos = await sql`
    SELECT c.id, c.titulo, c.plataforma, c.formato,
      c.texto_publicacion, c.fecha_programada, c.estado,
      c.url_publicacion, c.recurso_url,
      m.nombre AS campana_nombre,
      to_char(c.fecha_programada AT TIME ZONE 'America/La_Paz', 'DD/MM/YYYY HH24:MI') AS fecha_local
    FROM public.marketing_contenidos c
    LEFT JOIN public.marketing_campanas m ON m.id = c.campana_id
    WHERE (${estado} = '' OR c.estado = ${estado})
      AND (${plataforma} = '' OR c.plataforma = ${plataforma})
      AND (${campana} = '' OR c.campana_id::text = ${campana})
      AND (${busqueda} = '' OR c.titulo ILIKE ${terminoBusqueda} OR COALESCE(c.texto_publicacion, '') ILIKE ${terminoBusqueda})
    ORDER BY c.fecha_programada DESC NULLS LAST, c.creado_en DESC
    LIMIT ${porPagina} OFFSET ${offset}
  `;

  const totalPublicaciones = Number(resumen[0]?.total || 0);
  const pendientes = Number(resumen[0]?.pendientes || 0);
  const programados = Number(resumen[0]?.programados || 0);
  const publicados = Number(resumen[0]?.publicados || 0);

  const crearUrlPagina = numero => {
    const query = new URLSearchParams();
    if (busqueda) query.set('q', busqueda);
    if (estado) query.set('estado', estado);
    if (plataforma) query.set('plataforma', plataforma);
    if (campana) query.set('campana', campana);
    query.set('pagina', String(numero));
    return '/admin/marketing/contenidos?' + query.toString();
  };

  return (
    <PanelShell>
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <Link
            href="/admin/marketing"
            className="text-sm font-semibold text-blue-600"
          >
            ← Volver a Marketing
          </Link>

          <p className="mt-4 text-sm font-bold uppercase text-blue-600">
            Marketing empresarial
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Gestión de contenidos
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Organiza y controla las publicaciones de todas tus plataformas.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Total publicaciones", totalPublicaciones],
              ["Pendientes", pendientes],
            ["Programados", programados],
            ["Publicados", publicados]
          ].map(([nombre, valor]) => (
            <article key={nombre} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{nombre}</p>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {valor}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Nueva publicación
            </h3>

            <FormularioContenido campanas={campanas} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Publicaciones registradas
            </h3>

            <form method="GET" className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input name="q" type="search" defaultValue={busqueda} maxLength={100} placeholder="Buscar publicaciones..." className="rounded-xl border border-slate-300 bg-white p-3 text-sm" />
              <select name="campana" defaultValue={campana} className="rounded-xl border border-slate-300 bg-white p-3 text-sm">
                <option value="">Todas las campañas</option>
                {campanas.map(c => (
                  <option key={String(c.id)} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <select
                name="estado"
                defaultValue={estado}
                className="rounded-xl border border-slate-300 bg-white p-3 text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(estados).map(([v, n]) => (
                  <option key={v} value={v}>{n}</option>
                ))}
              </select>

              <select
                name="plataforma"
                defaultValue={plataforma}
                className="rounded-xl border border-slate-300 bg-white p-3 text-sm"
              >
                <option value="">Todas las plataformas</option>
                {Object.entries(plataformas).map(([v, n]) => (
                  <option key={v} value={v}>{n}</option>
                ))}
              </select>

              <button className="rounded-xl bg-slate-900 p-3 text-sm font-semibold text-white">
                Filtrar publicaciones
              </button>

              <Link
                href="/admin/marketing/contenidos"
                className="rounded-xl border border-slate-300 p-3 text-center text-sm font-semibold text-slate-700"
              >
                Limpiar filtros
              </Link>
            </form>

            <p className="mb-3 text-xs text-slate-500">
              {totalFiltrado} publicaciones encontradas · Página {pagina} de {totalPaginas}.
            </p>

            {contenidos.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-700">
                  {totalPublicaciones === 0 ? "Todavía no hay publicaciones." : "No hay publicaciones que coincidan con los filtros."}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {totalPublicaciones === 0 ? "Registra tu primer contenido para comenzar." : "Prueba cambiando los criterios de búsqueda."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {contenidos.map(c => (
                  <article key={String(c.id)} className="space-y-3 py-4">

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900">
                        <Link href={"/admin/marketing/contenidos/" + c.id}
                          className="hover:text-blue-600">
                          {c.titulo}
                        </Link>
                      </h4>

                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        colores[c.estado]
                      }`}>
                        {estados[c.estado]}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {plataformas[c.plataforma]}
                      {" · "}
                      {c.formato}
                      {" · "}
                      {c.campana_nombre || "Sin campaña"}
                    </p>

                    {c.fecha_local && (
                      <p className="text-sm font-semibold text-blue-700">
                        <span>Fecha programada: </span>
                        {c.fecha_local}
                      </p>
                    )}

                    {c.texto_publicacion && (
                      <p className="whitespace-pre-line text-sm text-slate-600">
                        {c.texto_publicacion}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4">
                      {c.recurso_url && (
                        <a
                          href={c.recurso_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Ver recurso gráfico
                        </a>
                      )}

                      {c.url_publicacion && (
                        <a
                          href={c.url_publicacion}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Ver publicación
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {totalPaginas > 1 && (
              <nav aria-label="Paginación de publicaciones" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <span className="text-sm text-slate-500">
                  Mostrando {offset + 1}–{Math.min(offset + porPagina, totalFiltrado)} de {totalFiltrado}
                </span>
                <div className="flex gap-2">
                  {pagina > 1 ? (
                    <Link href={crearUrlPagina(pagina - 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">← Anterior</Link>
                  ) : <span className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">← Anterior</span>}
                  {pagina < totalPaginas ? (
                    <Link href={crearUrlPagina(pagina + 1)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Siguiente →</Link>
                  ) : <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-400">Siguiente →</span>}
                </div>
              </nav>
            )}
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
