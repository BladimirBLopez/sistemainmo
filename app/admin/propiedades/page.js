import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FiHome, FiImage, FiSearch } from "react-icons/fi";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import TarjetaInteractiva from "@/components/admin/TarjetaInteractiva";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PropiedadesPage({ searchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    redirect("/admin/login");
  }

  const parametros = searchParams ? await searchParams : {};

  const leer = (campo) =>
    typeof parametros[campo] === "string"
      ? parametros[campo].trim()
      : "";

  const tipos = [
    "Casa", "Departamento", "Terreno",
    "Local comercial", "Oficina", "Galpon",
    "Quinta", "Otro"
  ];

  const busqueda = leer("q").slice(0, 100);
  const tipoSolicitado = leer("tipo");
  const tipo = tipos.includes(tipoSolicitado) ? tipoSolicitado : "";

  const operacionSolicitada = leer("operacion");
  const operacion = ["venta", "alquiler"].includes(operacionSolicitada)
    ? operacionSolicitada
    : "";

  const estadosConsulta = await sql`
    SELECT DISTINCT BTRIM(estado_comercial) AS estado
    FROM public.propiedades
    WHERE estado_comercial IS NOT NULL
      AND BTRIM(estado_comercial) <> ''
    ORDER BY estado
  `;

  const estados = estadosConsulta
    .map(fila => fila.estado)
    .filter(Boolean);

  const estadoSolicitado = leer("estado");
  const estado = estadoSolicitado === "__SIN_ESTADO__" ||
    estados.includes(estadoSolicitado)
      ? estadoSolicitado
      : "";

  const moneda = leer("moneda") === "USD" ? "USD" : "BOB";

  const validarPrecio = valor =>
    valor === "" || /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(valor);

  let precioMin = leer("precio_min");
  let precioMax = leer("precio_max");
  let errorFiltro = "";

  if (!validarPrecio(precioMin)) {
    precioMin = "";
    errorFiltro = "El precio minimo no tiene un formato valido.";
  }

  if (!validarPrecio(precioMax)) {
    precioMax = "";
    errorFiltro = errorFiltro ||
      "El precio maximo no tiene un formato valido.";
  }

  if (
    precioMin &&
    precioMax &&
    Number(precioMin) > Number(precioMax)
  ) {
    precioMin = "";
    precioMax = "";
    errorFiltro = "El precio minimo no puede superar el maximo.";
  }

  const hayFiltros = Boolean(
    busqueda || tipo || operacion || estado || precioMin || precioMax
  );

  const patronBusqueda =
    `%${busqueda.replace(/[\\%_]/g, "\\$&")}%`;

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
    WHERE
      (
        ${busqueda} = ''
        OR p.titulo ILIKE ${patronBusqueda}
        OR COALESCE(p.ciudad, '') ILIKE ${patronBusqueda}
        OR COALESCE(p.zona, '') ILIKE ${patronBusqueda}
      )
      AND (${tipo} = '' OR p.tipo = ${tipo})
      AND (${operacion} = '' OR p.tipo_operacion = ${operacion})
      AND (
        ${estado} = ''
        OR (
          ${estado} = '__SIN_ESTADO__'
          AND NULLIF(BTRIM(p.estado_comercial), '') IS NULL
        )
        OR BTRIM(p.estado_comercial) = ${estado}
      )
      AND (
        NULLIF(${precioMin}, '') IS NULL
        OR (
          p.moneda = ${moneda}
          AND p.precio >= NULLIF(${precioMin}, '')::numeric
        )
      )
      AND (
        NULLIF(${precioMax}, '') IS NULL
        OR (
          p.moneda = ${moneda}
          AND p.precio <= NULLIF(${precioMax}, '')::numeric
        )
      )
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

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900">
              Buscar y filtrar propiedades
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Combina los filtros para encontrar inmuebles rapidamente.
            </p>
          </div>

          <form method="GET" action="/admin/propiedades" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="sm:col-span-2">
                <label htmlFor="q" className="mb-2 block text-sm font-medium">
                  Buscar propiedad
                </label>
                <input
                  id="q"
                  name="q"
                  type="search"
                  maxLength={100}
                  defaultValue={busqueda}
                  placeholder="Titulo, ciudad o zona..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
              </div>

              <div>
                <label htmlFor="tipo" className="mb-2 block text-sm font-medium">
                  Tipo de inmueble
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  defaultValue={tipo}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                >
                  <option value="">Todos los tipos</option>
                  {tipos.map(valor => (
                    <option key={valor} value={valor}>{valor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="operacion" className="mb-2 block text-sm font-medium">
                  Operacion
                </label>
                <select
                  id="operacion"
                  name="operacion"
                  defaultValue={operacion}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                >
                  <option value="">Todas</option>
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                </select>
              </div>

              <div>
                <label htmlFor="estado" className="mb-2 block text-sm font-medium">
                  Estado comercial
                </label>
                <select
                  id="estado"
                  name="estado"
                  defaultValue={estado}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="__SIN_ESTADO__">Sin estado</option>
                  {estados.map(valor => (
                    <option key={valor} value={valor}>{valor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="precio_min" className="mb-2 block text-sm font-medium">
                  Precio minimo
                </label>
                <input
                  id="precio_min"
                  name="precio_min"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={precioMin}
                  placeholder="Ej. 50000"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
              </div>

              <div>
                <label htmlFor="precio_max" className="mb-2 block text-sm font-medium">
                  Precio maximo
                </label>
                <input
                  id="precio_max"
                  name="precio_max"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={precioMax}
                  placeholder="Ej. 200000"
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
              </div>

              <div>
                <label htmlFor="moneda" className="mb-2 block text-sm font-medium">
                  Moneda del rango
                </label>
                <select
                  id="moneda"
                  name="moneda"
                  defaultValue={moneda}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                >
                  <option value="BOB">Bolivianos (Bs)</option>
                  <option value="USD">Dolares (USD)</option>
                </select>
              </div>
            </div>

            {errorFiltro && (
              <p role="alert" className="text-sm text-red-600">
                {errorFiltro}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Buscar propiedades
              </button>
              <Link
                href="/admin/propiedades"
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpiar filtros
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {propiedades.length === 0 && !hayFiltros ? (
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
          ) : propiedades.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FiSearch size={42} className="text-slate-400" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No encontramos propiedades
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Prueba cambiando los filtros o limpiando la busqueda.
              </p>
              <Link
                href="/admin/propiedades"
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Ver todo el inventario
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {hayFiltros ? "Resultados de busqueda" : "Inventario registrado"}
                </h3>
                <span className="text-sm text-slate-500">
                  {propiedades.length} propiedades
                  {propiedades.length === 100 ? " (maximo por consulta)" : ""}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {propiedades.map((propiedad) => (
                  <TarjetaInteractiva
                    key={String(propiedad.id)}
                    id={String(propiedad.id)}
                    titulo={propiedad.titulo}
                  >
                    <article className="h-full rounded-xl border border-slate-200 p-5">
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

                    </article>
                  </TarjetaInteractiva>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
