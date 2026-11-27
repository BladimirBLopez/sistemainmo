"use client";

import { useState } from "react";

const clasesInput = "input min-w-0 flex-1";

export default function AsignacionesAgente({
  agenteId,
  propiedadesIniciales,
  clientesIniciales
}) {
  const [propiedades, setPropiedades] = useState(propiedadesIniciales);
  const [clientes, setClientes] = useState(clientesIniciales);

  const [busquedaPropiedad, setBusquedaPropiedad] = useState("");
  const [busquedaCliente, setBusquedaCliente] = useState("");

  const [resultadosPropiedades, setResultadosPropiedades] = useState([]);
  const [resultadosClientes, setResultadosClientes] = useState([]);

  const [cargandoBusqueda, setCargandoBusqueda] = useState("");
  const [accion, setAccion] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function buscar(tipo, termino) {
    setCargandoBusqueda(tipo);
    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(
        `/api/admin/agentes/${agenteId}/asignaciones?tipo=${tipo}&q=${encodeURIComponent(termino.trim())}`,
        { cache: "no-store" }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo realizar la búsqueda");
      }

      if (tipo === "propiedad") {
        setResultadosPropiedades(resultado.resultados);
      } else {
        setResultadosClientes(resultado.resultados);
      }
    } catch (fallo) {
      setError(fallo.message || "Error de búsqueda");
    } finally {
      setCargandoBusqueda("");
    }
  }

  async function cambiar(tipo, item, operacion) {
    const clave = `${tipo}-${item.id}`;
    setAccion(clave);
    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(
        `/api/admin/agentes/${agenteId}/asignaciones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo,
            registroId: String(item.id),
            accion: operacion
          })
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo modificar la asignación");
      }

      const actualizar = tipo === "propiedad"
        ? setPropiedades
        : setClientes;

      const actualizarResultados = tipo === "propiedad"
        ? setResultadosPropiedades
        : setResultadosClientes;

      if (operacion === "asignar") {
        actualizar(actuales => [
          item,
          ...actuales.filter(actual => String(actual.id) !== String(item.id))
        ]);
        actualizarResultados(actuales =>
          actuales.filter(actual => String(actual.id) !== String(item.id))
        );
      } else {
        actualizar(actuales =>
          actuales.filter(actual => String(actual.id) !== String(item.id))
        );
      }

      setMensaje(resultado.mensaje);

    } catch (fallo) {
      setError(fallo.message || "No se pudo modificar la asignación");
    } finally {
      setAccion("");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {mensaje && (
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {mensaje}
        </p>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          Propiedades asignadas ({propiedades.length})
        </h3>

        <div className="mt-4 space-y-3">
          {propiedades.length === 0 ? (
            <p className="text-sm text-slate-500">
              Todavía no tiene propiedades asignadas.
            </p>
          ) : propiedades.map(item => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.titulo}</p>
                <p className="text-xs text-slate-500">
                  {[item.tipo, item.ciudad, item.zona].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(accion)}
                onClick={() => cambiar("propiedad", item, "quitar")}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            buscar("propiedad", busquedaPropiedad);
          }}
          className="mt-6 flex flex-wrap gap-2"
        >
          <input
            value={busquedaPropiedad}
            onChange={e => setBusquedaPropiedad(e.target.value)}
            className={clasesInput}
            placeholder="Buscar por título, ciudad o zona"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={cargandoBusqueda === "propiedad"}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {cargandoBusqueda === "propiedad" ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {resultadosPropiedades.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Resultados disponibles
            </p>
            {resultadosPropiedades.map(item => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-800">{item.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {[item.tipo, item.ciudad, item.zona].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={Boolean(accion)}
                  onClick={() => cambiar("propiedad", item, "asignar")}
                  className="btn-primary rounded-lg px-3 py-2 text-xs"
                >
                  Asignar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          Clientes asignados ({clientes.length})
        </h3>

        <div className="mt-4 space-y-3">
          {clientes.length === 0 ? (
            <p className="text-sm text-slate-500">
              Todavía no tiene clientes asignados.
            </p>
          ) : clientes.map(item => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.nombre_completo}</p>
                <p className="text-xs text-slate-500">
                  {[item.telefono, item.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(accion)}
                onClick={() => cambiar("cliente", item, "quitar")}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            buscar("cliente", busquedaCliente);
          }}
          className="mt-6 flex flex-wrap gap-2"
        >
          <input
            value={busquedaCliente}
            onChange={e => setBusquedaCliente(e.target.value)}
            className={clasesInput}
            placeholder="Buscar por nombre, teléfono o correo"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={cargandoBusqueda === "cliente"}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {cargandoBusqueda === "cliente" ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {resultadosClientes.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Resultados disponibles
            </p>
            {resultadosClientes.map(item => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-800">{item.nombre_completo}</p>
                  <p className="text-xs text-slate-500">
                    {[item.telefono, item.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={Boolean(accion)}
                  onClick={() => cambiar("cliente", item, "asignar")}
                  className="btn-primary rounded-lg px-3 py-2 text-xs"
                >
                  Asignar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
