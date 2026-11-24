"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import FormularioFoto from "./FormularioFoto";
import BotonPortada from "./BotonPortada";

export default function FichaLateral({ id, alCerrar }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const cerrarRef = useRef(null);

  useEffect(() => {
    const controlador = new AbortController();

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        const respuesta = await fetch(
          `/api/admin/propiedades/${id}`,
          { signal: controlador.signal, cache: "no-store" }
        );
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(resultado.error || "Error de consulta");
        }

        if (!controlador.signal.aborted) {
          setDatos(resultado);
        }
      } catch (fallo) {
        if (!controlador.signal.aborted) {
          setError(fallo.message || "No se pudo cargar");
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargar();
    return () => controlador.abort();
  }, [id, version]);

  useEffect(() => {
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();

    function teclado(evento) {
      if (evento.key === "Escape") alCerrar();
    }

    window.addEventListener("keydown", teclado);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", teclado);
      anterior?.focus?.();
    };
  }, [alCerrar]);

  const propiedad = datos?.propiedad;
  const fotos = datos?.fotos || [];
  const actualizar = () => setVersion(valor => valor + 1);

  const caracteristicas = propiedad ? [
    ["Dormitorios", propiedad.dormitorios, ""],
    ["Baños", propiedad.banos, ""],
    ["Parqueos", propiedad.parqueos, ""],
    ["Terreno", propiedad.superficie_terreno_m2, " m²"],
    ["Construcción", propiedad.superficie_construida_m2, " m²"]
  ].filter(([, valor]) => valor != null) : [];

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Cerrar ficha"
        onClick={alCerrar}
        className="absolute inset-0 bg-black/50"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ficha-lateral"
        className="relative ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="titulo-ficha-lateral"
            className="text-lg font-bold text-slate-900">
            Ficha del inmueble
          </h2>

          <button ref={cerrarRef} type="button"
            onClick={alCerrar}
            aria-label="Cerrar ficha lateral"
            className="rounded-lg bg-slate-100 p-2">
            <FiX size={24} />
          </button>
        </div>

        {cargando && (
          <p className="py-10 text-center text-slate-500">
            Cargando propiedad...
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {!cargando && propiedad && (
          <div className="space-y-5">
            {fotos.length > 0 && (
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={fotos[0].secure_url}
                  alt={propiedad.titulo}
                  fill
                  sizes="(max-width: 640px) 100vw, 576px"
                  className="object-cover"
                />
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {propiedad.titulo}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {[propiedad.tipo, propiedad.zona, propiedad.ciudad]
                  .filter(Boolean).join(" · ")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                {propiedad.tipo_operacion === "venta"
                  ? "Venta"
                  : propiedad.tipo_operacion === "alquiler"
                    ? "Alquiler" : "Sin operación"}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 capitalize text-emerald-700">
                {propiedad.estado_comercial}
              </span>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {propiedad.precio != null && propiedad.moneda
                ? `${propiedad.moneda === "BOB" ? "Bs" : "USD"} ${Number(propiedad.precio).toLocaleString("es-BO", { maximumFractionDigits: 2 })}`
                : "Precio no registrado"}
            </p>

            {caracteristicas.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {caracteristicas.map(([nombre, valor, unidad]) => (
                  <div key={nombre} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{nombre}</p>
                    <p className="mt-1 font-bold">
                      {Number(valor).toLocaleString("es-BO", {
                        maximumFractionDigits: 2
                      })}{unidad}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {propiedad.descripcion && (
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {propiedad.descripcion}
              </p>
            )}

            <h4 className="font-bold">Fotografías ({fotos.length})</h4>

            <div className="grid grid-cols-2 gap-3">
              {fotos.map(foto => (
                <div key={String(foto.id)}
                  className="relative aspect-video overflow-hidden rounded-xl">
                  <Image
                    src={foto.secure_url}
                    alt={propiedad.titulo}
                    fill
                    sizes="(max-width: 640px) 50vw, 280px"
                    className="object-cover"
                  />
                  {foto.es_portada ? (
                    <span className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs text-white">
                      Portada
                    </span>
                  ) : (
                    <BotonPortada
                      propiedadId={String(id)}
                      fotoId={String(foto.id)}
                      alActualizar={actualizar}
                    />
                  )}
                </div>
              ))}
            </div>

            <FormularioFoto
              propiedadId={String(id)}
              alActualizar={actualizar}
            />

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/admin/propiedades/${id}/editar`}
                className="text-sm font-semibold text-blue-600"
              >
                Editar ficha
              </Link>
              <Link
                href={`/admin/propiedades/${id}`}
                className="text-sm font-semibold text-blue-600"
              >
                Abrir página completa
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
