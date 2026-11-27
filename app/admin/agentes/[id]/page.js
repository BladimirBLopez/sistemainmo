import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import AsignacionesAgente from "@/components/admin/AsignacionesAgente";

export const dynamic = "force-dynamic";

export default async function DetalleAgentePage({ params }) {
  const cookieStore = await cookies();

  if (!(await verificarSesion(cookieStore.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [agente] = await sql`
    SELECT id, nombre_completo, email, telefono, estado, creado_en
    FROM public.agentes
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!agente) notFound();

  const propiedades = await sql`
    SELECT p.id, p.titulo, p.tipo, p.ciudad, p.zona
    FROM public.agente_propiedades ap
    JOIN public.propiedades p ON p.id = ap.propiedad_id
    WHERE ap.agente_id = ${id}
    ORDER BY ap.asignado_en DESC
  `;

  const clientes = await sql`
    SELECT c.id, c.nombre_completo, c.telefono, c.email
    FROM public.agente_clientes ac
    JOIN public.clientes c ON c.id = ac.cliente_id
    WHERE ac.agente_id = ${id}
    ORDER BY ac.asignado_en DESC
  `;

  return (
    <PanelShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/agentes" className="text-sm font-semibold text-blue-600">
            ← Volver a agentes
          </Link>

          <Link
            href={`/admin/agentes/${id}/editar`}
            className="btn-primary px-5 py-3"
          >
            Editar agente
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {agente.nombre_completo}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{agente.email}</p>
              <p className="mt-1 text-sm text-slate-500">
                {agente.telefono || "Sin teléfono registrado"}
              </p>
            </div>

            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
              agente.estado === "activo"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}>
              {agente.estado}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Propiedades asignadas</p>
              <p className="mt-1 text-2xl font-bold">{propiedades.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Clientes asignados</p>
              <p className="mt-1 text-2xl font-bold">{clientes.length}</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900">
              Administración de asignaciones
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona las propiedades y clientes a los que tendrá acceso este agente.
            </p>
          </div>

          <AsignacionesAgente
            agenteId={String(agente.id)}
            propiedadesIniciales={propiedades.map(p => ({
              ...p,
              id: String(p.id)
            }))}
            clientesIniciales={clientes.map(c => ({
              ...c,
              id: String(c.id)
            }))}
          />
        </section>
      </div>
    </PanelShell>
  );
}
