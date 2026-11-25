import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";
import {
  FiHome, FiUsers, FiTarget, FiCalendar,
  FiArrowUpRight, FiPlus, FiBriefcase
} from "react-icons/fi";

export const dynamic = "force-dynamic";

export default async function PanelAgentePage() {
  const store = await cookies();

  const sesion = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!sesion) redirect("/agente/login");

  const [agente] = await sql`
    SELECT nombre_completo, email
    FROM public.agentes
    WHERE id = ${sesion.id} AND estado = 'activo'
    LIMIT 1
  `;

  if (!agente) redirect("/agente/login");

  const [resumen] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM public.agente_propiedades
       WHERE agente_id = ${sesion.id}) AS propiedades,
      (SELECT COUNT(*)::int FROM public.agente_clientes
       WHERE agente_id = ${sesion.id}) AS clientes,
      (SELECT COUNT(*)::int FROM public.leads
       WHERE agente_id = ${sesion.id}) AS leads,
      (SELECT COUNT(*)::int FROM public.leads
       WHERE agente_id = ${sesion.id} AND estado = 'nuevo') AS leads_nuevos,
      (SELECT COUNT(*)::int
       FROM public.lead_actividades la
       JOIN public.leads l ON l.id = la.lead_id
       WHERE l.agente_id = ${sesion.id}
         AND la.tipo = 'visita'
         AND la.estado = 'pendiente'
         AND la.programado_en >= NOW()) AS visitas_pendientes
  `;

  const indicadores = [
    {
      titulo: "Propiedades",
      valor: resumen.propiedades,
      detalle: "Inmuebles asignados",
      href: "/agente/propiedades",
      accion: "Ver inventario",
      Icono: FiHome,
      color: "bg-blue-50 text-blue-700"
    },
    {
      titulo: "Clientes",
      valor: resumen.clientes,
      detalle: "Clientes asignados",
      href: "/agente/clientes",
      accion: "Ver clientes",
      Icono: FiUsers,
      color: "bg-violet-50 text-violet-700"
    },
    {
      titulo: "Prospectos",
      valor: resumen.leads,
      detalle: `${resumen.leads_nuevos} nuevos`,
      href: "/agente/leads",
      accion: "Ver prospectos",
      Icono: FiTarget,
      color: "bg-emerald-50 text-emerald-700"
    },
    {
      titulo: "Visitas pendientes",
      valor: resumen.visitas_pendientes,
      detalle: "Próximas visitas programadas",
      href: "/agente/visitas",
      accion: "Abrir agenda",
      Icono: FiCalendar,
      color: "bg-amber-50 text-amber-700"
    }
  ];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl md:p-9">
          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
                <FiBriefcase size={14} />
                ESPACIO COMERCIAL
              </div>

              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Hola, {agente.nombre_completo}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                Bienvenido a tu espacio de trabajo. Desde aquí puedes
                administrar tus propiedades, clientes, prospectos
                y actividades comerciales.
              </p>

              <p className="mt-4 text-xs text-slate-400">
                {agente.email}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link
                href="/agente/leads/nuevo"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                <FiPlus size={18} />
                Nuevo prospecto
              </Link>

              <Link
                href="/agente/visitas"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <FiCalendar size={17} />
                Consultar agenda
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Resumen de actividad
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Estado actual de tu gestión comercial.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {indicadores.map(({ titulo, valor, detalle, href, accion, Icono, color }) => (
              <Link
                key={titulo}
                href={href}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    {titulo}
                  </span>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                    <Icono size={21} />
                  </div>
                </div>

                <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
                  {valor}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {detalle}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-blue-700">
                    {accion}
                  </span>
                  <FiArrowUpRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h3 className="font-bold text-slate-900">
            Accesos rápidos
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Continúa con tus principales actividades.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href="/agente/propiedades"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50"
            >
              <FiHome className="text-blue-600" size={21} />
              <span className="text-sm font-semibold text-slate-700">
                Consultar inventario
              </span>
            </Link>

            <Link
              href="/agente/clientes"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50"
            >
              <FiUsers className="text-blue-600" size={21} />
              <span className="text-sm font-semibold text-slate-700">
                Gestionar clientes
              </span>
            </Link>

            <Link
              href="/agente/leads"
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/50"
            >
              <FiTarget className="text-blue-600" size={21} />
              <span className="text-sm font-semibold text-slate-700">
                Seguimiento comercial
              </span>
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
