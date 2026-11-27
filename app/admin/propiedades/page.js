import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FiHome, FiSearch, FiPlus, FiMapPin, FiFilter } from "react-icons/fi";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import TarjetaInteractiva from "@/components/admin/TarjetaInteractiva";
import EstadoBadge from "@/components/EstadoBadge";
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
  const operacion = ["venta", "alquiler", "anticretico"].includes(operacionSolicitada)
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

  const etiquetaOperacion = {
    venta: "Venta",
    alquiler: "Alquiler",
    anticretico: "Anticrético"
  };

  const colorOperacion = {
    venta: "bg-brand-700 text-white",
    alquiler: "bg-gold-600 text-white",
    anticretico: "bg-slate-800 text-white"
  };

  return (
    <PanelShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Propiedades
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Administra el inventario inmobiliario.
            </p>
          </div>
          <Link
            href="/admin/propiedades/nueva"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <FiPlus size={18} /> Nueva propiedad
          </Link>
        </section>

        <section className="card">
          <div className="mb-4 flex items-center gap-2">
            <FiFilter className="text-gold-600" />
            <h3 className="font-display font-bold text-slate-900">
              Buscar y filtrar
            </h3>
          </div>

          <form method="GET" action="/admin/propiedades" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="sm:col-span-2">
                <label htmlFor="q" className="label">Buscar propiedad</label>
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="q"
                    name="q"
                    type="search"
                    maxLength={100}
                    defaultValue={busqueda}
                    placeholder="Título, ciudad o zona..."
                    className="input pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tipo" className="label">Tipo de inmueble</label>
                <select id="tipo" name="tipo" defaultValue={tipo} className="input">
                  <option value="">Todos los tipos</option>
                  {tipos.map(valor => (
                    <option key={valor} value={valor}>{valor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="operacion" className="label">Operación</label>
                <select id="operacion" name="operacion" defaultValue={operacion} className="input">
                  <option value="">Todas</option>
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="anticretico">Anticrético</option>
                </select>
              </div>

              <div>
                <label htmlFor="estado" className="label">Estado comercial</label>
                <select id="estado" name="estado" defaultValue={estado} className="input">
                  <option value="">Todos los estados</option>
                  <option value="__SIN_ESTADO__">Sin estado</option>
                  {estados.map(valor => (
                    <option key={valor} value={valor}>{valor}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="precio_min" className="label">Precio mínimo</label>
                <input id="precio_min" name="precio_min" type="number" min="0" step="0.01" defaultValue={precioMin} placeholder="Ej. 50000" className="input" />
              </div>

              <div>
                <label htmlFor="precio_max" className="label">Precio máximo</label>
                <input id="precio_max" name="precio_max" type="number" min="0" step="0.01" defaultValue={precioMax} placeholder="Ej. 200000" className="input" />
              </div>

              <div>
                <label htmlFor="moneda" className="label">Moneda del rango</label>
                <select id="moneda" name="moneda" defaultValue={moneda} className="input">
                  <option value="BOB">Bolivianos (Bs)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>
            </div>

            {errorFiltro && (
              <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorFiltro}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary inline-flex items-center gap-2">
                <FiSearch size={16} /> Buscar
              </button>
              <Link href="/admin/propiedades" className="btn-ghost">
                Limpiar filtros
              </Link>
            </div>
          </form>
        </section>

        {propiedades.length === 0 && !hayFiltros ? (
          <section className="card flex flex-col items-center py-14 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <FiHome size={30} />
            </span>
            <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
              Aún no hay propiedades
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Registra la primera para empezar a construir tu inventario.
            </p>
            <Link
              href="/admin/propiedades/nueva"
              className="btn-primary mt-6 inline-flex items-center gap-2"
            >
              <FiPlus size={18} /> Nueva propiedad
            </Link>
          </section>
        ) : propiedades.length === 0 ? (
          <section className="card flex flex-col items-center py-14 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FiSearch size={28} />
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-slate-900">
              No encontramos propiedades
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Prueba cambiando los filtros o limpiando la búsqueda.
            </p>
            <Link href="/admin/propiedades" className="btn-primary mt-6">
              Ver todo el inventario
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {hayFiltros ? "Resultados de búsqueda" : "Inventario registrado"}
              </h3>
              <span className="badge-brand">
                {propiedades.length} propiedades
                {propiedades.length === 100 ? " (máximo por consulta)" : ""}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {propiedades.map((propiedad) => (
                <TarjetaInteractiva
                  key={String(propiedad.id)}
                  id={String(propiedad.id)}
                  titulo={propiedad.titulo}
                  className="block h-full rounded-2xl"
                >
                  <article className="group h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      {propiedad.portada_url ? (
                        <Image
                          src={propiedad.portada_url}
                          alt={`Portada de ${propiedad.titulo}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
                          <FiHome size={38} />
                          <span className="text-xs text-slate-400">Sin fotografía</span>
                        </div>
                      )}
                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-soft ${
                          colorOperacion[propiedad.tipo_operacion] || "bg-slate-700 text-white"
                        }`}
                      >
                        {etiquetaOperacion[propiedad.tipo_operacion] || "Sin operación"}
                      </span>
                      {propiedad.estado_publicacion && (
                        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium capitalize text-slate-700 shadow-soft backdrop-blur">
                          {propiedad.estado_publicacion}
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="font-display text-xl font-bold text-gold-700">
                        {propiedad.precio != null && propiedad.moneda
                          ? `${propiedad.moneda === "BOB" ? "Bs" : "USD"} ${Number(propiedad.precio).toLocaleString("es-BO", { maximumFractionDigits: 2 })}`
                          : "Precio no registrado"}
                      </p>

                      <h4 className="mt-1 line-clamp-2 font-semibold text-slate-900">
                        {propiedad.titulo}
                      </h4>

                      <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <FiMapPin className="shrink-0" />
                        <span className="truncate">
                          {[propiedad.zona, propiedad.ciudad]
                            .filter(Boolean)
                            .join(", ") || "Ubicación no registrada"}
                        </span>
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        <span className="badge-brand capitalize">
                          {propiedad.tipo}
                        </span>
                        <EstadoBadge estado={propiedad.estado_comercial} />
                      </div>
                    </div>
                  </article>
                </TarjetaInteractiva>
              ))}
            </div>
          </section>
        )}
      </div>
    </PanelShell>
  );
}
