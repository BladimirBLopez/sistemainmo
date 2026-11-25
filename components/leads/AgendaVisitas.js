"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const estados = {
  pendiente: "Pendiente",
  completada: "Completada",
  cancelada: "Cancelada"
};

const colores = {
  pendiente: "bg-amber-100 text-amber-800",
  completada: "bg-green-100 text-green-800",
  cancelada: "bg-slate-200 text-slate-600"
};

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function claveFecha(valor) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(valor));

  const obtener = tipo => partes.find(p => p.type === tipo)?.value;
  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
}

function fechaHora(valor) {
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(valor));
}

function hora(valor) {
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(valor));
}

export default function AgendaVisitas({
  mes,
  estado,
  modo,
  visitas,
  agentes = [],
  agenteSeleccionado = ""
}) {
  const router = useRouter();

  const [actualizando, setActualizando] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const esAdmin = modo === "admin";
  const ruta = esAdmin ? "/admin/leads" : "/agente/leads";
  const api = esAdmin ? "/api/admin/leads" : "/api/agente/leads";

  const [anio, numeroMes] = mes.split("-").map(Number);

  const cantidadDias = new Date(
    Date.UTC(anio, numeroMes, 0)
  ).getUTCDate();

  const primerDia = (
    new Date(Date.UTC(anio, numeroMes - 1, 1)).getUTCDay() + 6
  ) % 7;

  const celdas = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: cantidadDias }, (_, i) => i + 1)
  ];

  const visitasPorDia = {};

  visitas.forEach(v => {
    const clave = claveFecha(v.programado_en);
    if (!visitasPorDia[clave]) visitasPorDia[clave] = [];
    visitasPorDia[clave].push(v);
  });

  const pendientes = visitas.filter(v => v.estado === "pendiente").length;
  const completadas = visitas.filter(v => v.estado === "completada").length;
  const canceladas = visitas.filter(v => v.estado === "cancelada").length;

  const nombreMes = new Intl.DateTimeFormat("es-BO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(anio, numeroMes - 1, 1)));

  async function cambiarEstado(visita, nuevoEstado) {
    if (actualizando) return;

    try {
      setActualizando(visita.id);
      setError("");
      setMensaje("");

      const respuesta = await fetch(
        `${api}/${visita.lead_id}/actividades/${visita.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevoEstado })
        }
      );

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo actualizar la visita");
      }

      setMensaje("Visita actualizada correctamente.");
      router.refresh();

    } catch (fallo) {
      setError(fallo.message || "Error al actualizar");
    } finally {
      setActualizando("");
    }
  }

  return (
    <div className="space-y-6">

      <form
        method="GET"
        action={esAdmin ? "/admin/visitas" : "/agente/visitas"}
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm"
      >
        <label className="flex-1 min-w-36">
          <span className="mb-2 block text-xs font-semibold text-slate-500">
            MES
          </span>
          <input
            type="month"
            name="mes"
            defaultValue={mes}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
        </label>

        <label className="flex-1 min-w-36">
          <span className="mb-2 block text-xs font-semibold text-slate-500">
            ESTADO
          </span>
          <select
            name="estado"
            defaultValue={estado}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </label>

        {esAdmin && (
          <label className="flex-1 min-w-40">
            <span className="mb-2 block text-xs font-semibold text-slate-500">
              AGENTE
            </span>
            <select
              name="agente"
              defaultValue={agenteSeleccionado}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            >
              <option value="">Todos los agentes</option>
              {agentes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Filtrar
        </button>

        <Link
          href={esAdmin ? "/admin/visitas" : "/agente/visitas"}
          className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-600"
        >
          Limpiar
        </Link>
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total de visitas", visitas.length, "bg-blue-50"],
          ["Pendientes", pendientes, "bg-amber-50"],
          ["Completadas", completadas, "bg-green-50"],
          ["Canceladas", canceladas, "bg-slate-100"]
        ].map(([nombre, cantidad, fondo]) => (
          <div key={nombre} className={`${fondo} rounded-2xl p-4`}>
            <p className="text-xs font-medium text-slate-500">{nombre}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {cantidad}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold capitalize text-slate-900">
              {nombreMes}
            </h2>
            <p className="text-sm text-slate-500">
              Calendario de visitas comerciales
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            {visitas.length} visitas
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {diasSemana.map(dia => (
            <div
              key={dia}
              className="py-2 text-center text-xs font-bold text-slate-500"
            >
              {dia}
            </div>
          ))}

          {celdas.map((dia, indice) => {
            if (!dia) {
              return <div key={`v-${indice}`} className="min-h-20 rounded-lg bg-slate-50 sm:min-h-28" />;
            }

            const clave = `${mes}-${String(dia).padStart(2, "0")}`;
            const delDia = visitasPorDia[clave] || [];

            return (
              <div
                key={clave}
                className="min-h-20 rounded-lg border border-slate-100 p-1 sm:min-h-28 sm:p-2"
              >
                <span className="text-xs font-bold text-slate-700">
                  {dia}
                </span>

                <div className="mt-1 space-y-1">
                  {delDia.slice(0, 2).map(v => (
                    <Link
                      key={v.id}
                      href={`${ruta}/${v.lead_id}`}
                      title={`${hora(v.programado_en)} - ${v.contacto_nombre}`}
                      className={`block truncate rounded px-1 py-1 text-[9px] font-semibold sm:text-xs ${
                        v.estado === "pendiente"
                          ? "bg-amber-100 text-amber-800"
                          : v.estado === "completada"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {hora(v.programado_en)} {v.contacto_nombre}
                    </Link>
                  ))}

                  {delDia.length > 2 && (
                    <p className="text-[9px] text-slate-500 sm:text-xs">
                      +{delDia.length - 2} más
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Listado de visitas
        </h2>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {mensaje && (
          <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {mensaje}
          </p>
        )}

        {!visitas.length ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No hay visitas programadas para los filtros seleccionados.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {visitas.map(v => (
              <article
                key={v.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-600">
                      {fechaHora(v.programado_en)}
                    </p>
                    <h3 className="mt-1 font-bold text-slate-900">
                      {v.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {v.contacto_nombre}
                    </p>
                    <p className="text-sm text-slate-500">
                      {v.telefono || "Sin teléfono"}
                    </p>
                    {v.propiedad_titulo && (
                      <p className="mt-2 text-sm text-slate-600">
                        Propiedad: {v.propiedad_titulo}
                      </p>
                    )}
                    {esAdmin && (
                      <p className="mt-1 text-xs text-slate-500">
                        Agente: {v.agente_nombre || "Sin asignar"}
                      </p>
                    )}
                    {v.descripcion && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">
                        {v.descripcion}
                      </p>
                    )}
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colores[v.estado]}`}>
                    {estados[v.estado]}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`${ruta}/${v.lead_id}`}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700"
                  >
                    Ver ficha del lead
                  </Link>

                  {v.estado === "pendiente" ? (
                    <>
                      <button
                        type="button"
                        disabled={actualizando !== ""}
                        onClick={() => cambiarEstado(v, "completada")}
                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Completar
                      </button>
                      <button
                        type="button"
                        disabled={actualizando !== ""}
                        onClick={() => cambiarEstado(v, "cancelada")}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={actualizando !== ""}
                      onClick={() => cambiarEstado(v, "pendiente")}
                      className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
                    >
                      Reabrir visita
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
