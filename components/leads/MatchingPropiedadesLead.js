"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function dinero(precio, moneda) {
  const numero = Number(precio);

  if (!Number.isFinite(numero)) return "Precio no disponible";

  return `${moneda === "BOB" ? "Bs" : "USD"} ${numero.toLocaleString(
    "es-BO",
    { maximumFractionDigits: 2 }
  )}`;
}

export default function MatchingPropiedadesLead({
  leadId,
  modo = "admin"
}) {
  const [resultados, setResultados] = useState([]);
  const [total, setTotal] = useState(0);
  const [sinCriterios, setSinCriterios] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todas");

  const endpoint = modo === "admin"
    ? `/api/admin/leads/${leadId}/matching`
    : `/api/agente/leads/${leadId}/matching`;

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(endpoint, {
          cache: "no-store"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.error || "No se pudieron cargar las coincidencias"
          );
        }

        if (!activo) return;

        setResultados(datos.resultados || []);
        setTotal(datos.total || 0);
        setSinCriterios(Boolean(datos.sin_criterios));

      } catch (fallo) {
        if (activo) {
          setError(fallo.message || "Error al cargar el Matching");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [endpoint]);

  const visibles = resultados.filter(p => {
    if (filtro === "alta") return p.compatibilidad >= 80;
    if (filtro === "media") {
      return p.compatibilidad >= 60 && p.compatibilidad < 80;
    }
    if (filtro === "baja") return p.compatibilidad < 60;
    return true;
  });

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Propiedades recomendadas
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Matching inteligente de prospectos e inmuebles
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
          {total} disponibles
        </span>
      </div>

      {sinCriterios && !cargando && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este prospecto todavía no tiene suficientes preferencias.
          Completa su operación, inmueble, ubicación o presupuesto
          para obtener una puntuación de compatibilidad.
        </div>
      )}

      {error && (
        <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Calculando coincidencias...
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">
              Mejores coincidencias
            </p>

            <select
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              aria-label="Filtrar compatibilidad"
            >
              <option value="todas">Todas</option>
              <option value="alta">Alta: 80–100%</option>
              <option value="media">Media: 60–79%</option>
              <option value="baja">Baja: menos de 60%</option>
            </select>
          </div>

          {visibles.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {error
                ? "No se pudieron mostrar las propiedades."
                : "No hay propiedades para este filtro."}
            </p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibles.map(p => {
                const color = p.compatibilidad >= 80
                  ? "bg-green-100 text-green-700"
                  : p.compatibilidad >= 60
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700";

                return (
                  <article
                    key={p.id}
                    className="overflow-hidden rounded-xl border border-slate-200"
                  >
                    {p.foto_url ? (
                      <img
                        src={p.foto_url}
                        alt={p.titulo}
                        loading="lazy"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-400">
                        Sin fotografía
                      </div>
                    )}

                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${p.compatibilidad === null ? "bg-slate-100 text-slate-600" : color}`}>
                          {p.compatibilidad === null
                            ? "Sin evaluar"
                            : `${p.compatibilidad}% compatible`}
                        </span>

                        {p.vinculada && (
                          <span className="text-xs font-bold text-blue-700">
                            Vinculada
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900">
                        {p.titulo}
                      </h4>

                      <p className="text-lg font-bold text-blue-700">
                        {dinero(p.precio, p.moneda)}
                      </p>

                      <div className="text-sm text-slate-600">
                        <p>{p.tipo} · {p.tipo_operacion}</p>
                        <p>
                          {[p.zona, p.ciudad, p.departamento]
                            .filter(Boolean)
                            .join(", ") || "Ubicación no registrada"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {p.dormitorios != null && (
                          <span>{p.dormitorios} dormitorios</span>
                        )}
                        {p.banos != null && (
                          <span>{p.banos} baños</span>
                        )}
                        {p.parqueos != null && (
                          <span>{p.parqueos} parqueos</span>
                        )}
                        {p.superficie_terreno_m2 != null && (
                          <span>{p.superficie_terreno_m2} m² terreno</span>
                        )}
                      </div>

                      {p.razones.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <p className="mb-2 text-xs font-bold text-slate-700">
                            Análisis de compatibilidad
                          </p>

                          <div className="flex flex-wrap gap-1.5">
                            {p.razones.map((razon, i) => (
                              <span
                                key={`${p.id}-${i}`}
                                className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                              >
                                {razon}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/${modo}/propiedades/${p.id}`}
                        className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Ver propiedad →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
