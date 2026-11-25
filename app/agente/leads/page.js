import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";

export const dynamic = "force-dynamic";

const estados = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  calificado: "Calificado",
  visita_programada: "Visita programada",
  negociacion: "En negociación",
  ganado: "Ganado",
  perdido: "Perdido",
  pausado: "Pausado"
};

export default async function MisLeads({ searchParams }) {
  const store = await cookies();
  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  const p = searchParams ? await searchParams : {};
  const q = typeof p.q === "string" ? p.q.trim().slice(0, 100) : "";
  const estado = Object.hasOwn(estados, p.estado) ? p.estado : "";
  const prioridades = ["baja", "media", "alta", "urgente"];
  const prioridad = prioridades.includes(p.prioridad) ? p.prioridad : "";
  const patron = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  const [leads, resumen] = await Promise.all([
    sql`
      SELECT l.id, l.nombre_contacto, l.telefono, l.email,
        l.origen, l.estado, l.prioridad, l.tipo_operacion,
        l.tipo_inmueble, l.ciudad, l.zona, l.presupuesto_min,
        l.presupuesto_max, l.moneda, l.actualizado_en,
        (SELECT COUNT(*)::int FROM public.lead_actividades la
          WHERE la.lead_id = l.id) AS actividades
      FROM public.leads l
      WHERE l.agente_id = ${agente.id}
        AND (
          ${q} = '' OR l.nombre_contacto ILIKE ${patron}
          OR l.telefono ILIKE ${patron}
          OR COALESCE(l.email, '') ILIKE ${patron}
          OR COALESCE(l.ciudad, '') ILIKE ${patron}
        )
        AND (${estado} = '' OR l.estado = ${estado})
        AND (${prioridad} = '' OR l.prioridad = ${prioridad})
      ORDER BY l.actualizado_en DESC
      LIMIT 200
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'nuevo')::int AS nuevos,
        COUNT(*) FILTER (WHERE estado = 'negociacion')::int AS negociacion
      FROM public.leads
      WHERE agente_id = ${agente.id}
    `
  ]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
<h1 className="mt-2 text-2xl font-bold text-slate-900">Mis Leads</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestiona tus oportunidades comerciales asignadas.
            </p>
          </div>
          <Link href="/agente/leads/nuevo"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
            + Nuevo prospecto
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Mis prospectos", resumen[0].total],
            ["Nuevos", resumen[0].nuevos],
            ["En negociación", resumen[0].negociacion]
          ].map(([t, n]) => (
            <article key={t} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{t}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{n}</p>
            </article>
          ))}
        </section>

        <form method="GET" className="grid gap-3 rounded-2xl bg-white p-5 sm:grid-cols-4">
          <input name="q" defaultValue={q}
            placeholder="Nombre, teléfono o ciudad"
            className="rounded-xl border p-3 text-sm sm:col-span-2" />

          <select name="estado" defaultValue={estado} className="rounded-xl border bg-white p-3 text-sm">
            <option value="">Todos los estados</option>
            {Object.entries(estados).map(([v, t]) => (
              <option key={v} value={v}>{t}</option>
            ))}
          </select>

          <select name="prioridad" defaultValue={prioridad} className="rounded-xl border bg-white p-3 text-sm">
            <option value="">Todas las prioridades</option>
            {prioridades.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <button className="rounded-xl bg-slate-900 p-3 font-semibold text-white">
            Buscar
          </button>
          <Link href="/agente/leads"
            className="rounded-xl border p-3 text-center font-semibold text-slate-700">
            Limpiar
          </Link>
        </form>

        <section className="divide-y rounded-2xl bg-white p-5 shadow-sm">
          <div className="pb-4 font-bold text-slate-900">
            {leads.length} prospectos encontrados
          </div>

          {leads.map(l => (
            <article key={String(l.id)} className="py-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <Link href={`/agente/leads/${l.id}`} className="font-bold text-blue-700 hover:underline">{l.nombre_contacto}</Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {l.telefono}{l.email ? ` · ${l.email}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {[l.tipo_operacion, l.tipo_inmueble, l.ciudad, l.zona]
                      .filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="h-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {estados[l.estado] || l.estado}
                  </span>
                  <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs">
                    {l.prioridad}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Origen: {l.origen}</span>
                <span>Actividades: {l.actividades}</span>
                <span>Moneda: {l.moneda}</span>
                {l.presupuesto_max != null && (
                  <span>Presupuesto máximo: {l.presupuesto_max}</span>
                )}
              </div>
            </article>
          ))}

          {leads.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No tienes prospectos asignados o no hay resultados para estos filtros.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
