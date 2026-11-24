import Link from "next/link";
import Image from "next/image";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const tipos = [
  "Casa",
  "Departamento",
  "Terreno",
  "Local comercial",
  "Oficina",
  "Galpon",
  "Quinta",
  "Otro"
];

const operaciones = [
  ["venta", "Venta"],
  ["alquiler", "Alquiler"],
  ["anticretico", "Anticrético"]
];

function etiquetaOperacion(valor) {
  return operaciones.find(([clave]) => clave === valor)?.[1] || valor;
}

function formatoPrecio(precio, moneda) {
  if (precio == null) return "Consultar precio";

  const numero = Number(precio);
  if (!Number.isFinite(numero)) return "Consultar precio";

  const valor = numero.toLocaleString("es-BO", {
    maximumFractionDigits: 2
  });

  return `${moneda === "BOB" ? "Bs" : moneda || ""} ${valor}`;
}

export default async function Home({ searchParams }) {
  const parametros = searchParams ? await searchParams : {};

  const leer = campo =>
    typeof parametros[campo] === "string"
      ? parametros[campo].trim()
      : "";

  const busqueda = leer("q").slice(0, 100);
  const operacionSolicitada = leer("operacion");
  const tipoSolicitado = leer("tipo");

  const operacion = operaciones.some(
    ([valor]) => valor === operacionSolicitada
  ) ? operacionSolicitada : "";

  const tipo = tipos.includes(tipoSolicitado)
    ? tipoSolicitado
    : "";

  const patron = `%${busqueda.replace(/[\\%_]/g, "\\$&")}%`;

  const propiedades = await sql`
    SELECT
      p.id,
      p.titulo,
      p.tipo,
      p.departamento,
      p.ciudad,
      p.zona,
      p.tipo_operacion,
      p.precio::text AS precio,
      p.moneda,
      p.dormitorios,
      p.banos,
      p.parqueos,
      (
        SELECT i.secure_url
        FROM public.propiedad_imagenes i
        WHERE i.propiedad_id = p.id
        ORDER BY i.es_portada DESC, i.orden, i.id
        LIMIT 1
      ) AS portada_url
    FROM public.propiedades p
    WHERE p.estado_publicacion = 'publicada'
      AND p.estado_comercial = 'disponible'
      AND p.tipo_operacion IN ('venta', 'alquiler', 'anticretico')
      AND (${operacion} = '' OR p.tipo_operacion = ${operacion})
      AND (${tipo} = '' OR p.tipo = ${tipo})
      AND (
        ${busqueda} = ''
        OR p.titulo ILIKE ${patron}
        OR COALESCE(p.departamento, '') ILIKE ${patron}
        OR COALESCE(p.ciudad, '') ILIKE ${patron}
        OR COALESCE(p.zona, '') ILIKE ${patron}
      )
    ORDER BY p.creado_en DESC
    LIMIT 60
  `;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
            SISTEMAINMO<span className="text-blue-600">.</span>
          </Link>

          <span className="text-sm font-medium text-slate-500">
            Mercado inmobiliario
          </span>
        </div>
      </header>

      <section className="bg-slate-950 px-5 py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Tu próximo inmueble comienza aquí
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Encuentra el lugar ideal para tu próxima etapa.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Explora propiedades para comprar, alquilar o adquirir
            mediante anticrético.
          </p>
        </div>
      </section>

      <section className="relative mx-auto -mt-6 max-w-7xl px-5">
        <form
          method="GET"
          action="/"
          className="grid gap-3 rounded-2xl bg-white p-4 shadow-xl md:grid-cols-4 md:p-5"
        >
          <input
            name="q"
            type="search"
            defaultValue={busqueda}
            placeholder="Ciudad, zona o inmueble..."
            className="rounded-xl border border-slate-200 p-3 text-sm"
          />

          <select
            name="operacion"
            defaultValue={operacion}
            className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
          >
            <option value="">Todas las operaciones</option>
            {operaciones.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>

          <select
            name="tipo"
            defaultValue={tipo}
            className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
          >
            <option value="">Todos los inmuebles</option>
            {tipos.map(valor => (
              <option key={valor} value={valor}>{valor}</option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
          >
            Buscar propiedades
          </button>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              INVENTARIO PUBLICADO
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Propiedades disponibles
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            {propiedades.length} resultados
          </p>
        </div>

        {propiedades.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <h3 className="text-xl font-bold text-slate-800">
              No hay propiedades disponibles con estos filtros.
            </h3>
            <p className="mt-3 text-sm text-slate-500">
              Las propiedades aparecerán aquí cuando sean publicadas
              desde el administrador.
            </p>
            <Link href="/" className="mt-5 inline-block font-semibold text-blue-600">
              Ver todas las propiedades
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {propiedades.map(propiedad => (
              <Link
                key={String(propiedad.id)}
                href={`/propiedad/${propiedad.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {propiedad.portada_url ? (
                    <Image
                      src={propiedad.portada_url}
                      alt={propiedad.titulo}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Sin fotografía
                    </div>
                  )}

                  <span className="absolute left-3 top-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
                    {etiquetaOperacion(propiedad.tipo_operacion)}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {propiedad.tipo}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900">
                    {propiedad.titulo}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {[propiedad.zona, propiedad.ciudad, propiedad.departamento]
                      .filter(Boolean).join(", ") || "Ubicación no registrada"}
                  </p>

                  <p className="mt-5 text-2xl font-black text-blue-700">
                    {formatoPrecio(propiedad.precio, propiedad.moneda)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    {propiedad.dormitorios != null && (
                      <span>{propiedad.dormitorios} dormitorios</span>
                    )}
                    {propiedad.banos != null && (
                      <span>{propiedad.banos} baños</span>
                    )}
                    {propiedad.parqueos != null && (
                      <span>{propiedad.parqueos} parqueos</span>
                    )}
                  </div>

                  <p className="mt-4 text-sm font-bold text-blue-600">
                    Ver propiedad →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
        Sistemainmo · Plataforma inmobiliaria
      </footer>
    </main>
  );
}
