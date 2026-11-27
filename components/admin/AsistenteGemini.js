"use client";

import { useState } from "react";
import {
  FiZap,
  FiFileText,
  FiShare2,
  FiCamera,
  FiCopy
} from "react-icons/fi";

const acciones = [
  {
    id: "redaccion",
    nombre: "Optimizar título y descripción",
    icono: FiFileText
  },
  {
    id: "redes",
    nombre: "Crear publicaciones para redes",
    icono: FiShare2
  },
  {
    id: "fotografias",
    nombre: "Análisis de fotografías",
    icono: FiCamera
  }
];

export default function AsistenteGemini({
  propiedadId,
  modo,
  formRef
}) {
  const [cargando, setCargando] = useState(false);
  const [accion, setAccion] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function generar(tipo) {
    if (cargando) return;

    setCargando(true);
    setError("");
    setMensaje("");
    setResultado(null);
    setAccion(tipo);

    try {
      const datos = formRef.current
        ? Object.fromEntries(
            new FormData(formRef.current).entries()
          )
        : {};

      const respuesta = await fetch(
        `/api/ia/propiedades/${encodeURIComponent(propiedadId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            accion: tipo,
            modo,
            datos
          })
        }
      );

      const contenido = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          contenido.error || "No se pudo generar el contenido."
        );
      }

      setResultado(contenido.resultado);

    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "Error al conectar con Gemini."
      );
    } finally {
      setCargando(false);
    }
  }

  function aplicar(campo, valor, limite) {
    const formulario = formRef.current;

    if (!formulario || typeof valor !== "string") return;

    const control = formulario.elements.namedItem(campo);

    if (!control || typeof control.value !== "string") return;

    control.value = valor.slice(0, limite);

    setMensaje(
      "Contenido aplicado. Recuerda guardar los cambios manualmente."
    );
  }

  async function copiar(texto, nombre) {
    if (!texto) return;

    try {
      await navigator.clipboard.writeText(texto);
      setMensaje(`${nombre} copiado correctamente.`);
    } catch {
      setError("No se pudo copiar el contenido.");
    }
  }

  const boton =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50";

  return (
    <div className="mt-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-brand-50 p-4 sm:p-5">

      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-violet-600 p-3 text-white">
          <FiZap size={22} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">
              Asistente de Optimización Inmobiliaria
            </h3>

            <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700">
              IA DE OPTIMIZACIÓN
            </span>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {modo === "agente" ? "Asistente para agentes" : "Asistente para administradores"}.
            Mejora la presentación comercial de tus inmuebles con herramientas inteligentes.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {acciones.map(({ id, nombre, icono: Icono }) => (
          <button
            key={id}
            type="button"
            disabled={cargando}
            onClick={() => generar(id)}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-3 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icono size={16} />
            {nombre}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Los datos del inmueble y, cuando corresponda, sus fotografías se procesan mediante un servicio externo de inteligencia artificial. Los resultados no se guardan automáticamente.
      </p>

      {cargando && (
        <div className="mt-4 rounded-xl bg-white p-4 text-center text-sm font-semibold text-violet-700">
          <span className="animate-pulse">
            Estamos optimizando la información de tu inmueble...
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {mensaje && (
        <p className="mt-3 rounded-lg bg-brand-50 p-3 text-xs font-medium text-brand-800">
          {mensaje}
        </p>
      )}

      {resultado && accion === "redaccion" && (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">

          <div>
            <h4 className="text-xs font-bold text-violet-700">
              TÍTULO SUGERIDO
            </h4>

            <p className="mt-2 text-sm font-bold text-slate-900">
              {resultado.titulo}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={boton}
                onClick={() =>
                  aplicar("titulo", resultado.titulo, 150)
                }
              >
                Aplicar título
              </button>

              <button
                type="button"
                className={boton}
                onClick={() =>
                  copiar(resultado.titulo, "Título")
                }
              >
                <FiCopy size={14} />
                Copiar
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-violet-700">
              DESCRIPCIÓN SUGERIDA
            </h4>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {resultado.descripcion}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={boton}
                onClick={() =>
                  aplicar("descripcion", resultado.descripcion, 4000)
                }
              >
                Aplicar descripción
              </button>

              <button
                type="button"
                className={boton}
                onClick={() =>
                  copiar(resultado.descripcion, "Descripción")
                }
              >
                <FiCopy size={14} />
                Copiar
              </button>
            </div>
          </div>
        </div>
      )}

      {resultado && accion === "redes" && (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">

          <div>
            <h4 className="font-bold text-slate-900">
              Publicación para Facebook
            </h4>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {resultado.facebook}
            </p>

            <button
              type="button"
              className={`${boton} mt-2`}
              onClick={() =>
                copiar(resultado.facebook, "Facebook")
              }
            >
              <FiCopy size={14} />
              Copiar publicación
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-900">
              Publicación para Instagram
            </h4>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {resultado.instagram}
            </p>

            <button
              type="button"
              className={`${boton} mt-2`}
              onClick={() =>
                copiar(resultado.instagram, "Instagram")
              }
            >
              <FiCopy size={14} />
              Copiar publicación
            </button>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-900">
              Hashtags
            </h4>

            <p className="mt-2 text-sm text-brand-700">
              {Array.isArray(resultado.hashtags)
                ? resultado.hashtags.join(" ")
                : ""}
            </p>

            <button
              type="button"
              className={`${boton} mt-2`}
              onClick={() =>
                copiar(
                  Array.isArray(resultado.hashtags)
                    ? resultado.hashtags.join(" ")
                    : "",
                  "Hashtags"
                )
              }
            >
              <FiCopy size={14} />
              Copiar hashtags
            </button>
          </div>
        </div>
      )}

      {resultado && accion === "fotografias" && (
        <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">

          <div>
            <h4 className="font-bold text-slate-900">
              Análisis de fotografías
            </h4>

            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {resultado.analisis}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-violet-700">
              CARACTERÍSTICAS VISIBLES
            </h4>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(resultado.caracteristicas_visibles || []).map(
                (item, indice) => (
                  <li key={indice}>{item}</li>
                )
              )}
            </ul>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-violet-700">
              RECOMENDACIONES FOTOGRÁFICAS
            </h4>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(resultado.recomendaciones_fotograficas || []).map(
                (item, indice) => (
                  <li key={indice}>{item}</li>
                )
              )}
            </ul>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="font-bold text-slate-900">
              Texto comercial sugerido
            </h4>

            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {resultado.texto_comercial}
            </p>

            <button
              type="button"
              className={`${boton} mt-2`}
              onClick={() =>
                aplicar("descripcion", resultado.texto_comercial, 4000)
              }
            >
              Aplicar a descripción
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
