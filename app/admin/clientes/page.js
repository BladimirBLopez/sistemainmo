import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";

export const dynamic = "force-dynamic";

const etiquetas = {
  propietario: "Propietario",
  comprador: "Comprador",
  arrendatario: "Arrendatario",
  buscador: "Buscador",
  vendedor: "Vendedor",
  otro: "Otro"
};

export default async function ClientesPage({ searchParams }) {
  const cookieStore = await cookies();

  if (!(await verificarSesion(cookieStore.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const parametros = searchParams ? await searchParams : {};
  const q = typeof parametros.q === "string"
    ? parametros.q.trim().slice(0, 100)
    : "";

  const roles = Object.keys(etiquetas);
  const rol = roles.includes(parametros.rol) ? parametros.rol : "";
  const estado = ["activo", "inactivo"].includes(parametros.estado)
    ? parametros.estado
    : "";

  const patron = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  const clientes = await sql`
    SELECT
      c.id,
      c.nombre_completo,
      c.telefono,
      c.email,
      c.roles,
      c.ciudad,
      c.estado,
      c.creado_en,
      (
        SELECT COUNT(*)::int
        FROM public.cliente_propiedades cp
        WHERE cp.cliente_id = c.id
      ) AS propiedades_vinculadas
    FROM public.clientes c
    WHERE
      (
        ${q} = ''
        OR c.nombre_completo ILIKE ${patron}
        OR c.telefono ILIKE ${patron}
        OR COALESCE(c.email, '') ILIKE ${patron}
        OR COALESCE(c.numero_documento, '') ILIKE ${patron}
      )
      AND (${rol} = '' OR ${rol} = ANY(c.roles))
      AND (${estado} = '' OR c.estado = ${estado})
    ORDER BY c.creado_en DESC
    LIMIT 200
  `;

  return (
    <PanelShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Clientes
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Propietarios, compradores y buscadores de inmuebles.
            </p>
          </div>

          <Link
            href="/admin/clientes/nuevo"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Registrar cliente
          </Link>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <form method="GET" className="grid gap-3 sm:grid-cols-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="Nombre, teléfono, correo o documento"
              className="rounded-xl border border-slate-300 p-3 text-sm sm:col-span-2"
            />

            <select
              name="rol"
              defaultValue={rol}
              className="rounded-xl border border-slate-300 bg-white p-3 text-sm"
            >
              <option value="">Todos los perfiles</option>
              {roles.map(r => (
                <option key={r} value={r}>{etiquetas[r]}</option>
              ))}
            </select>

            <select
              name="estado"
              defaultValue={estado}
              className="rounded-xl border border-slate-300 bg-white p-3 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>

            <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              Buscar clientes
            </button>

            <Link
              href="/admin/clientes"
              className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Limpiar filtros
            </Link>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              Registro de clientes
            </h3>
            <span className="text-sm text-slate-500">
              {clientes.length} resultados
            </span>
          </div>

          {clientes.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">
                No hay clientes registrados.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Los clientes aparecerán aquí cuando sean registrados desde el administrador.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {clientes.map(cliente => (
                <Link
                  key={String(cliente.id)}
                  href={`/admin/clientes/${cliente.id}`}
                  className="block rounded-xl p-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">
                        {cliente.nombre_completo}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {cliente.telefono}
                        {cliente.email ? ` · ${cliente.email}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {cliente.ciudad || "Ubicación no registrada"}
                        {" · "}
                        {cliente.propiedades_vinculadas} propiedades vinculadas
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {cliente.roles.map(r => (
                        <span
                          key={r}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        >
                          {etiquetas[r] || r}
                        </span>
                      ))}
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        cliente.estado === "activo"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {cliente.estado}
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
