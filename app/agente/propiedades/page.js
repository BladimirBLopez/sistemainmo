import Link from "next/link";
import Image from "next/image";
import TarjetaInteractiva from "@/components/admin/TarjetaInteractiva";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";

export const dynamic = "force-dynamic";

export default async function MisPropiedades({ searchParams }) {
  const store = await cookies();
  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  const parametros = searchParams ? await searchParams : {};
  const q = typeof parametros.q === "string"
    ? parametros.q.trim().slice(0, 100)
    : "";

  const patron = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  const propiedades = await sql`
    SELECT
      p.id, p.titulo, p.tipo, p.ciudad, p.zona,
      p.tipo_operacion, p.precio, p.moneda,
      p.estado_publicacion, p.estado_comercial,
      (
        SELECT i.secure_url
        FROM public.propiedad_imagenes i
        WHERE i.propiedad_id = p.id
          AND i.es_portada = TRUE
        LIMIT 1
      ) AS portada_url
    FROM public.agente_propiedades ap
    JOIN public.propiedades p ON p.id = ap.propiedad_id
    WHERE ap.agente_id = ${agente.id}
      AND (
        ${q} = ''
        OR p.titulo ILIKE ${patron}
        OR COALESCE(p.ciudad, '') ILIKE ${patron}
        OR COALESCE(p.zona, '') ILIKE ${patron}
      )
    ORDER BY p.creado_en DESC
    LIMIT 100
  `;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
<h1 className="mt-2 text-2xl font-bold text-slate-900">
              Mis propiedades
            </h1>
            <p className="text-sm text-slate-500">
              Inmuebles asignados exclusivamente a tu usuario.
            </p>
          </div>
        </header>

        <form className="flex flex-wrap gap-3">
          <input
            name="q"
            defaultValue={q}
            maxLength={100}
            placeholder="Buscar por título, ciudad o zona"
            className="input min-w-0 flex-1"
          />
          <button type="submit" className="btn-primary">
            Buscar
          </button>
          <Link
            href="/agente/propiedades"
            className="btn-ghost"
          >
            Limpiar
          </Link>
        </form>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {propiedades.map(p => (
            <TarjetaInteractiva
              key={String(p.id)}
              id={String(p.id)}
              titulo={p.titulo}
              modo="agente"
              className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-video bg-slate-200">
                {p.portada_url && (
                  <Image
                    src={p.portada_url}
                    alt={p.titulo}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="space-y-2 p-5">
                <p className="text-xs font-semibold text-brand-600">
                  {p.estado_publicacion}
                </p>
                <h2 className="font-bold text-slate-900">{p.titulo}</h2>
                <p className="text-sm text-slate-500">
                  {p.tipo} · {[p.zona, p.ciudad].filter(Boolean).join(", ")}
                </p>
                <p className="font-bold text-slate-900">
                  {p.precio != null
                    ? `${p.moneda === "BOB" ? "Bs" : "USD"} ${Number(p.precio).toLocaleString("es-BO")}`
                    : "Precio no registrado"}
                </p>
                <span className="inline-block text-sm font-semibold text-brand-600">
                  Ver detalles →
                </span>
              </div>
            </TarjetaInteractiva>
          ))}
        </section>

        {propiedades.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              No tienes propiedades asignadas con esta búsqueda.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
