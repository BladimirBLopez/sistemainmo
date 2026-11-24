import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";
import BotonSalir from "@/components/agente/BotonSalir";

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
       WHERE agente_id = ${sesion.id} AND estado = 'nuevo') AS leads_nuevos
  `;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-5 text-white">
        <div>
          <h1 className="text-xl font-bold">Sistema Inmobiliario</h1>
          <p className="mt-1 text-sm text-slate-300">Panel de agente</p>
        </div>
        <BotonSalir />
      </header>

      <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Bienvenido, {agente.nombre_completo}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{agente.email}</p>
          <p className="mt-3 text-sm text-slate-600">
            Gestiona exclusivamente las propiedades, clientes y prospectos asignados a tu usuario.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/agente/propiedades"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm text-slate-500">Propiedades asignadas</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{resumen.propiedades}</p>
            <p className="mt-3 text-sm font-semibold text-blue-600">Gestionar propiedades →</p>
          </Link>

          <Link href="/agente/clientes"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm text-slate-500">Clientes asignados</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{resumen.clientes}</p>
            <p className="mt-3 text-sm font-semibold text-blue-600">Gestionar clientes →</p>
          </Link>

          <Link href="/agente/leads"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
            <p className="text-sm text-slate-500">Mis oportunidades comerciales</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{resumen.leads}</p>
            <p className="mt-1 text-xs text-slate-500">{resumen.leads_nuevos} prospectos nuevos</p>
            <p className="mt-3 text-sm font-semibold text-blue-600">Gestionar Leads →</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
