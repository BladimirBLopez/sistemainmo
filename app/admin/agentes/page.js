import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";

export const dynamic = "force-dynamic";

export default async function AgentesPage() {
  const cookieStore = await cookies();

  if (!(await verificarSesion(cookieStore.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const agentes = await sql`
    SELECT
      a.id,
      a.nombre_completo,
      a.email,
      a.telefono,
      a.estado,
      a.creado_en,
      (
        SELECT COUNT(*)::int
        FROM public.agente_propiedades ap
        WHERE ap.agente_id = a.id
      ) AS propiedades,
      (
        SELECT COUNT(*)::int
        FROM public.agente_clientes ac
        WHERE ac.agente_id = a.id
      ) AS clientes
    FROM public.agentes a
    ORDER BY a.creado_en DESC
    LIMIT 300
  `;

  return (
    <PanelShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Agentes</h2>
            <p className="mt-2 text-sm text-slate-500">
              Administra las cuentas y los recursos asignados a tus agentes.
            </p>
          </div>

          <Link
            href="/admin/agentes/nuevo"
            className="btn-primary px-5 py-3"
          >
            + Registrar agente
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Total de agentes", agentes.length],
            ["Agentes activos", agentes.filter(a => a.estado === "activo").length],
            ["Agentes inactivos", agentes.filter(a => a.estado === "inactivo").length]
          ].map(([titulo, cantidad]) => (
            <article key={titulo} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{titulo}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{cantidad}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">Registro de agentes</h3>
            <span className="text-sm text-slate-500">
              {agentes.length} resultados
            </span>
          </div>

          {agentes.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">
                Todavía no hay agentes registrados.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Registra el primer agente para habilitar su acceso al sistema.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {agentes.map(agente => (
                <Link
                  key={String(agente.id)}
                  href={`/admin/agentes/${agente.id}`}
                  className="block rounded-xl p-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">
                        {agente.nombre_completo}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {agente.email}
                        {agente.telefono ? ` · ${agente.telefono}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                        {agente.propiedades} propiedades
                      </span>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {agente.clientes} clientes
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        agente.estado === "activo"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {agente.estado}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
