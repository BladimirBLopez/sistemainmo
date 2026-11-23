import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FiHome, FiImage, FiSearch } from "react-icons/fi";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PropiedadesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    redirect("/admin/login");
  }

  const propiedades = await sql`
    SELECT
      p.id, p.titulo, p.tipo, p.ciudad,
      p.zona, p.estado_publicacion,
      p.tipo_operacion, p.precio,
      p.moneda, p.estado_comercial,
      (
        SELECT i.secure_url
        FROM public.propiedad_imagenes AS i
        WHERE i.propiedad_id = p.id
          AND i.es_portada = TRUE
        LIMIT 1
      ) AS portada_url
    FROM public.propiedades AS p
    ORDER BY p.creado_en DESC
    LIMIT 100
  `;

  return (
    <PanelShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Propiedades
              </h2>
              <p className="mt-2 text-slate-500">
                Administra el inventario inmobiliario.
              </p>
            </div>

            <Link
              href="/admin/propiedades/nueva"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              + Nueva propiedad
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {propiedades.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <FiHome size={48} className="text-blue-600" />

            <h3 className="mt-5 text-xl font-semibold text-slate-900">
              Inventario de propiedades
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              {propiedades.length === 0
                ? "Todavía no hay propiedades registradas."
                : `Se cargaron ${propiedades.length} propiedades (máximo 100).`}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <FiHome /> Inmuebles
              </span>
              <span className="flex items-center gap-2">
                <FiImage /> Fotografías
              </span>
              <span className="flex items-center gap-2">
                <FiSearch /> Búsqueda
              </span>
            </div>
          </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">
                  Inventario registrado
                </h3>
                <span className="text-sm text-slate-500">
                  {propiedades.length} propiedades
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {propiedades.map((propiedad) => (
                  <article
                    key={String(propiedad.id)}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-slate-100">
                      {propiedad.portada_url ? (
                        <Image
                          src={propiedad.portada_url}
                          alt={`Portada de ${propiedad.titulo}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                          <FiHome size={40} />
                          <span className="text-xs">Sin fotografía</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <FiHome size={26} className="text-blue-600" />
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {propiedad.estado_publicacion}
                      </span>
                    </div>

                    <h4 className="mt-4 font-bold text-slate-900">
                      {propiedad.titulo}
                    </h4>

                    <p className="mt-2 text-sm capitalize text-slate-600">
                      {propiedad.tipo}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {[propiedad.zona, propiedad.ciudad]
                        .filter(Boolean)
                        .join(", ") || "Ubicación no registrada"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {propiedad.tipo_operacion === "venta"
                          ? "Venta"
                          : propiedad.tipo_operacion === "alquiler"
                            ? "Alquiler"
                            : "Sin operacion"}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                        {propiedad.estado_comercial || "Sin estado"}
                      </span>
                    </div>

                    <p className="mt-3 text-xl font-bold text-slate-900">
                      {propiedad.precio != null && propiedad.moneda
                        ? `${propiedad.moneda === "BOB" ? "Bs" : "USD"} ${Number(propiedad.precio).toLocaleString("es-BO", { maximumFractionDigits: 2 })}`
                        : "Precio no registrado"}
                    </p>

                    <Link
                      href={`/admin/propiedades/${String(propiedad.id)}`}
                      className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Ver ficha
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
