import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";

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

const prioridades = ["baja", "media", "alta", "urgente"];

export default async function LeadsPage({ searchParams }) {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const p = searchParams ? await searchParams : {};
  const q = typeof p.q === "string" ? p.q.trim().slice(0, 100) : "";
  const estado = Object.hasOwn(estados, p.estado) ? p.estado : "";
  const prioridad = prioridades.includes(p.prioridad) ? p.prioridad : "";
  const agenteId = typeof p.agente_id === "string" &&
    /^[1-9]\d{0,18}$/.test(p.agente_id) ? p.agente_id : "";

  const patron = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  const [leads, agentes, resumen] = await Promise.all([
    sql`
      SELECT l.id, l.nombre_contacto, l.telefono, l.email,
        l.origen, l.estado, l.prioridad, l.tipo_operacion,
        l.tipo_inmueble, l.ciudad, l.zona, l.presupuesto_min,
        l.presupuesto_max, l.moneda, l.proximo_seguimiento_en,
        l.actualizado_en, a.nombre_completo AS agente_nombre,
        (SELECT COUNT(*)::int FROM public.lead_actividades la
          WHERE la.lead_id = l.id) AS actividades
      FROM public.leads l
      LEFT JOIN public.agentes a ON a.id = l.agente_id
      WHERE (
        ${q} = '' OR l.nombre_contacto ILIKE ${patron}
        OR l.telefono ILIKE ${patron}
        OR COALESCE(l.email, '') ILIKE ${patron}
        OR COALESCE(l.ciudad, '') ILIKE ${patron}
      )
      AND (${estado} = '' OR l.estado = ${estado})
      AND (${prioridad} = '' OR l.prioridad = ${prioridad})
      AND (
        ${agenteId || null}::bigint IS NULL
        OR l.agente_id = ${agenteId || null}::bigint
      )
      ORDER BY
        CASE l.prioridad
          WHEN 'urgente' THEN 1
          WHEN 'alta' THEN 2
          WHEN 'media' THEN 3
          ELSE 4
        END,
        l.actualizado_en DESC
      LIMIT 200
    `,
    sql`
      SELECT id, nombre_completo
      FROM public.agentes
      WHERE estado = 'activo'
      ORDER BY nombre_completo
    `,
    sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE estado = 'nuevo')::int AS nuevos,
        COUNT(*) FILTER (WHERE estado = 'negociacion')::int AS negociacion,
        COUNT(*) FILTER (
          WHERE proximo_seguimiento_en < NOW()
          AND estado NOT IN ('ganado', 'perdido', 'pausado')
        )::int AS pendientes
      FROM public.leads
    `
  ]);

  const datos = resumen[0];

  return (
    <PanelShell>
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestión de Leads</h2>
            <p className="mt-2 text-sm text-slate-500">
              Captación, clasificación y seguimiento de oportunidades comerciales.
            </p>
          </div>
          <Link href="/admin/leads/nuevo"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
            + Nuevo prospecto
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total de prospectos", datos.total],
            ["Nuevos", datos.nuevos],
            ["En negociación", datos.negociacion],
            ["Seguimientos vencidos", datos.pendientes]
          ].map(([titulo, cantidad]) => (
            <article key={titulo} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{titulo}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{cantidad}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-slate-900">Buscar y filtrar prospectos</h3>

          <form method="GET" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input name="q" defaultValue={q}
              placeholder="Nombre, teléfono, correo o ciudad"
              className="rounded-xl border p-3 text-sm lg:col-span-2" />

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

            <select name="agente_id" defaultValue={agenteId} className="rounded-xl border bg-white p-3 text-sm">
              <option value="">Todos los agentes</option>
              {agentes.map(a => (
                <option key={String(a.id)} value={a.id}>{a.nombre_completo}</option>
              ))}
            </select>

            <button className="rounded-xl bg-slate-900 p-3 text-sm font-semibold text-white">
              Aplicar filtros
            </button>

            <Link href="/admin/leads"
              className="rounded-xl border p-3 text-center text-sm font-semibold text-slate-700">
              Limpiar
            </Link>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Oportunidades comerciales</h3>
            <span className="text-sm text-slate-500">{leads.length} resultados</span>
          </div>

          {leads.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">No hay prospectos registrados.</p>
              <p className="mt-2 text-sm text-slate-500">
                Registra un prospecto para comenzar la gestión comercial.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.map(l => (
                <article key={String(l.id)} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900">{l.nombre_contacto}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {l.telefono}{l.email ? ` · ${l.email}` : ""}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {[l.tipo_operacion, l.tipo_inmueble, l.ciudad, l.zona]
                          .filter(Boolean).join(" · ") || "Sin preferencias registradas"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {estados[l.estado] || l.estado}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        l.prioridad === "urgente" ? "bg-red-50 text-red-700" :
                        l.prioridad === "alta" ? "bg-orange-50 text-orange-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {l.prioridad}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span>Responsable: {l.agente_nombre || "Sin asignar"}</span>
                    <span>Origen: {l.origen}</span>
                    <span>Actividades: {l.actividades}</span>
                    <span>Moneda: {l.moneda}</span>
                    {l.presupuesto_min != null || l.presupuesto_max != null ? (
                      <span>
                        Presupuesto: {l.presupuesto_min ?? "—"} - {l.presupuesto_max ?? "—"}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
