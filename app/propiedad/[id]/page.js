import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatoPrecio(precio, moneda) {
  if (precio == null) return "Consultar precio";

  const valor = Number(precio);
  if (!Number.isFinite(valor)) return "Consultar precio";

  return `${moneda === "BOB" ? "Bs" : moneda || ""} ${valor.toLocaleString("es-BO", {
    maximumFractionDigits: 2
  })}`;
}

function etiquetaOperacion(valor) {
  if (valor === "venta") return "Venta";
  if (valor === "alquiler") return "Alquiler";
  if (valor === "anticretico") return "Anticrético";
  return "Operación";
}

export default async function PropiedadPublica({ params }) {
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) notFound();

  const [propiedad] = await sql`
    SELECT
      id, titulo, tipo, descripcion,
      departamento, ciudad, zona,
      tipo_operacion, precio::text AS precio, moneda,
      dormitorios, banos, parqueos,
      superficie_terreno_m2::text AS superficie_terreno_m2,
      superficie_construida_m2::text AS superficie_construida_m2,
      latitud::text AS latitud,
      longitud::text AS longitud
    FROM public.propiedades
    WHERE id = ${id}
      AND estado_publicacion = 'publicada'
      AND estado_comercial = 'disponible'
    LIMIT 1
  `;

  if (!propiedad) notFound();

  const fotos = await sql`
    SELECT id, secure_url, es_portada
    FROM public.propiedad_imagenes
    WHERE propiedad_id = ${id}
    ORDER BY es_portada DESC, orden, id
    LIMIT 30
  `;

  const ubicacion = [
    propiedad.zona,
    propiedad.ciudad,
    propiedad.departamento
  ].filter(Boolean).join(", ");

  const caracteristicas = [
    ["Dormitorios", propiedad.dormitorios, ""],
    ["Baños", propiedad.banos, ""],
    ["Parqueos", propiedad.parqueos, ""],
    ["Terreno", propiedad.superficie_terreno_m2, "m²"],
    ["Construcción", propiedad.superficie_construida_m2, "m²"]
  ].filter(([, valor]) => valor != null);

  const mapaUrl = propiedad.latitud && propiedad.longitud
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        `${propiedad.latitud},${propiedad.longitud}`
      )}`
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-black text-slate-900">
            SISTEMAINMO<span className="text-brand-600">.</span>
          </Link>

          <Link href="/" className="text-sm font-semibold text-brand-600">
            ← Volver al catálogo
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 px-5 py-8">
        <section>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-100 px-4 py-2 text-xs font-bold text-brand-700">
              {etiquetaOperacion(propiedad.tipo_operacion)}
            </span>

            <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-700">
              Disponible
            </span>

            <span className="rounded-full bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
              {propiedad.tipo}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-900 md:text-4xl">
            {propiedad.titulo}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {ubicacion || "Ubicación no registrada"}
          </p>

          <p className="mt-5 text-3xl font-black text-brand-700">
            {formatoPrecio(propiedad.precio, propiedad.moneda)}
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl">
          {fotos.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {fotos.map((foto, indice) => (
                <div
                  key={String(foto.id)}
                  className={`relative overflow-hidden rounded-xl bg-slate-200 ${
                    indice === 0
                      ? "aspect-[16/9] sm:col-span-2"
                      : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={foto.secure_url}
                    alt={`${propiedad.titulo} - fotografía ${indice + 1}`}
                    fill
                    sizes={indice === 0
                      ? "100vw"
                      : "(max-width: 640px) 100vw, 50vw"}
                    className="object-cover"
                    priority={indice === 0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
              Fotografías próximamente
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Características del inmueble
              </h2>

              {caracteristicas.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {caracteristicas.map(([etiqueta, valor, unidad]) => (
                    <div key={etiqueta} className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">{etiqueta}</p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {Number(valor).toLocaleString("es-BO", {
                          maximumFractionDigits: 2
                        })} {unidad}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No se registraron características adicionales.
                </p>
              )}
            </div>

            {propiedad.descripcion && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Descripción
                </h2>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {propiedad.descripcion}
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Ubicación
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {ubicacion || "Ubicación no registrada"}
              </p>

              {mapaUrl && (
                <a
                  href={mapaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700"
                >
                  Ver ubicación en mapa
                </a>
              )}
            </div>

            <Link
              href="/"
              className="block rounded-xl border border-slate-200 bg-white p-5 text-center text-sm font-bold text-brand-600 hover:bg-brand-50"
            >
              Explorar otras propiedades
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
