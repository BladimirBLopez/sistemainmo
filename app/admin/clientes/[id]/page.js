import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
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

export default async function DetalleCliente({ params }) {
  const cookieStore = await cookies();

  if (!(await verificarSesion(cookieStore.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [cliente] = await sql`
    SELECT *
    FROM public.clientes
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!cliente) notFound();

  const propiedades = await sql`
    SELECT
      p.id, p.titulo, p.tipo, p.tipo_operacion,
      p.precio, p.moneda, cp.relacion
    FROM public.cliente_propiedades cp
    JOIN public.propiedades p ON p.id = cp.propiedad_id
    WHERE cp.cliente_id = ${id}
    ORDER BY cp.creado_en DESC
  `;

  const intereses = await sql`
    SELECT *
    FROM public.cliente_intereses
    WHERE cliente_id = ${id}
    ORDER BY creado_en DESC
  `;

  return (
    <PanelShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/clientes"
            className="text-sm font-semibold text-blue-600"
          >
            ← Volver a clientes
          </Link>

          <Link
            href={`/admin/clientes/${id}/editar`}
            className="btn-primary px-5 py-3"
          >
            Editar cliente
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            {cliente.nombre_completo}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {cliente.roles.map(rol => (
              <span
                key={rol}
                className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700"
              >
                {etiquetas[rol] || rol}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Teléfono principal</p>
              <p className="mt-1 font-semibold">{cliente.telefono}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Teléfono secundario</p>
              <p className="mt-1 font-semibold">{cliente.telefono_secundario || "No registrado"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Correo electrónico</p>
              <p className="mt-1 font-semibold">{cliente.email || "No registrado"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Documento</p>
              <p className="mt-1 font-semibold">
                {[cliente.tipo_documento, cliente.numero_documento].filter(Boolean).join(" ") || "No registrado"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Ubicación</p>
              <p className="mt-1 font-semibold">
                {[cliente.departamento, cliente.ciudad, cliente.zona]
                  .filter(Boolean).join(" · ") || "No registrada"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Estado</p>
              <p className="mt-1 font-semibold capitalize">{cliente.estado}</p>
            </div>
          </div>

          {cliente.direccion && (
            <p className="mt-5 text-sm text-slate-600">
              Dirección: {cliente.direccion}
            </p>
          )}

          {cliente.notas && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">OBSERVACIONES</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {cliente.notas}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Propiedades relacionadas
          </h3>

          {propiedades.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Todavía no existen propiedades vinculadas a este cliente.
            </p>
          ) : (
            <div className="mt-4 divide-y">
              {propiedades.map(p => (
                <Link
                  key={`${p.id}-${p.relacion}`}
                  href={`/admin/propiedades/${p.id}`}
                  className="block py-3 hover:bg-slate-50"
                >
                  <p className="font-semibold text-slate-900">{p.titulo}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {p.tipo} · {p.relacion}
                    {p.precio != null
                      ? ` · ${p.moneda === "BOB" ? "Bs" : "USD"} ${Number(p.precio).toLocaleString("es-BO")}`
                      : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Preferencias de búsqueda
          </h3>

          {intereses.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No hay preferencias de búsqueda registradas.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {intereses.map(i => (
                <div key={String(i.id)} className="rounded-xl bg-slate-50 p-4">
                  <p className="font-semibold">
                    {i.tipo_operacion || "Operación no definida"} · {i.tipo_inmueble || "Cualquier inmueble"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {[i.departamento, i.ciudad, i.zona].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
