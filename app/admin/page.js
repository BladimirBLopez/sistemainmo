import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FiHome, FiUsers, FiTarget, FiCalendar,
  FiPlus, FiArrowRight
} from "react-icons/fi";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";

export const dynamic = "force-dynamic";

const fecha = (valor) =>
  valor
    ? new Date(valor).toLocaleString("es", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/La_Paz"
      })
    : "—";

const colorEstado = {
  nuevo: "badge-brand",
  contactado: "badge-brand",
  calificado: "badge-gold",
  negociacion: "badge-warn",
  ganado: "badge-ok",
  perdido: "badge-bad"
};

function Tarjeta({ titulo, valor, detalle, Icono, href, color }) {
  return (
    <Link
      href={href}
      className="card group flex items-start justify-between transition hover:shadow-lift"
    >
      <div>
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <p className="mt-2 font-display text-3xl font-bold text-slate-900">
          {valor}
        </p>
        <p className="mt-1 text-xs text-slate-400">{detalle}</p>
      </div>
      <span className={`rounded-xl p-3 ${color}`}>
        <Icono size={22} />
      </span>
    </Link>
  );
}

function Vacio({ texto }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
      {texto}
    </p>
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    redirect("/admin/login");
  }

  const [conteos, leadsRecientes, proximas] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*)::int FROM public.propiedades) AS propiedades,
        (SELECT COUNT(*)::int FROM public.clientes) AS clientes,
        (SELECT COUNT(*)::int FROM public.agentes
          WHERE estado = 'activo') AS agentes,
        (SELECT COUNT(*)::int FROM public.leads) AS leads,
        (SELECT COUNT(*)::int FROM public.leads
          WHERE estado = 'nuevo') AS leads_nuevos,
        (SELECT COUNT(*)::int FROM public.lead_actividades
          WHERE estado = 'pendiente'
          AND programado_en >= NOW()) AS proximas
    `,
    sql`
      SELECT id, nombre_contacto, estado, actualizado_en
      FROM public.leads
      ORDER BY actualizado_en DESC
      LIMIT 5
    `,
    sql`
      SELECT la.id, la.lead_id, la.titulo, la.programado_en,
        l.nombre_contacto
      FROM public.lead_actividades la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.estado = 'pendiente' AND la.programado_en >= NOW()
      ORDER BY la.programado_en ASC
      LIMIT 5
    `
  ]);

  const c = conteos[0];

  return (
    <PanelShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 p-6 text-white shadow-lift md:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500/20 blur-2xl" />
          <h2 className="relative font-display text-2xl font-bold">
            Bienvenido de nuevo
          </h2>
          <p className="relative mt-1 text-sm text-brand-100">
            Tienes {c.leads_nuevos} leads nuevos y {c.proximas} actividades
            programadas.
          </p>
          <div className="relative mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/propiedades/nueva"
              className="btn bg-gold-500 text-white hover:bg-gold-600"
            >
              <FiPlus /> Nueva propiedad
            </Link>
            <Link
              href="/admin/clientes/nuevo"
              className="btn border border-white/30 text-white hover:bg-white/10"
            >
              <FiPlus /> Nuevo cliente
            </Link>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tarjeta titulo="Propiedades" valor={c.propiedades}
            detalle="Registradas" Icono={FiHome}
            href="/admin/propiedades" color="bg-brand-50 text-brand-700" />
          <Tarjeta titulo="Clientes" valor={c.clientes}
            detalle={`${c.agentes} agentes activos`} Icono={FiUsers}
            href="/admin/clientes" color="bg-gold-50 text-gold-700" />
          <Tarjeta titulo="Leads" valor={c.leads}
            detalle={`${c.leads_nuevos} nuevos`} Icono={FiTarget}
            href="/admin/leads" color="bg-emerald-50 text-emerald-700" />
          <Tarjeta titulo="Actividades próximas" valor={c.proximas}
            detalle="Pendientes programadas" Icono={FiCalendar}
            href="/admin/visitas" color="bg-amber-50 text-amber-700" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Leads recientes
              </h3>
              <Link href="/admin/leads"
                className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                Ver todos <FiArrowRight />
              </Link>
            </div>
            {leadsRecientes.length === 0 ? (
              <Vacio texto="Aún no hay leads registrados." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {leadsRecientes.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/leads/${l.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {l.nombre_contacto}
                        </p>
                        <p className="text-xs text-slate-400">
                          {fecha(l.actualizado_en)}
                        </p>
                      </div>
                      <span className={colorEstado[l.estado] || "badge-brand"}>
                        {l.estado}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Próximas actividades
              </h3>
              <Link href="/admin/visitas"
                className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                Ver agenda <FiArrowRight />
              </Link>
            </div>
            {proximas.length === 0 ? (
              <Vacio texto="No hay actividades programadas." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {proximas.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/leads/${a.lead_id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {a.titulo}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {a.nombre_contacto}
                        </p>
                      </div>
                      <span className="badge-gold whitespace-nowrap">
                        {fecha(a.programado_en)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PanelShell>
  );
}
