"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const tipos = {
  nota: "Nota",
  llamada: "Llamada",
  whatsapp: "WhatsApp",
  correo: "Correo",
  reunion: "Reunión",
  visita: "Visita",
  tarea: "Tarea",
  cambio_estado: "Cambio de estado",
  otro: "Otro"
};

const estados = {
  pendiente: "Pendiente",
  completada: "Completada",
  cancelada: "Cancelada"
};

function fecha(valor) {
  if (!valor) return "No registrada";

  const d = new Date(valor);

  return Number.isNaN(d.getTime())
    ? "No registrada"
    : d.toLocaleString("es-BO", {
        dateStyle: "medium",
        timeStyle: "short"
      });
}

export default function PanelActividadesLead({
  leadId,
  modo = "admin",
  actividades = []
}) {
  const router = useRouter();

  const [guardando, setGuardando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [estadoActividad, setEstadoActividad] = useState("completada");
  const [tipoActividad, setTipoActividad] = useState("nota");
  const [error, setError] = useState("");
  const [errorActualizacion, setErrorActualizacion] = useState("");

  const base = modo === "admin"
    ? `/api/admin/leads/${leadId}/actividades`
    : `/api/agente/leads/${leadId}/actividades`;

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;

    const formulario = e.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario).entries());

    try {
      setGuardando(true);
      setError("");

      datos.programado_en = datos.programado_en
        ? new Date(datos.programado_en).toISOString()
        : null;

      const respuesta = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo registrar la actividad");
      }

      formulario.reset();
      setEstadoActividad("completada");
      setTipoActividad("nota");
      router.refresh();

    } catch (fallo) {
      setError(fallo.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(actividadId, nuevoEstado) {
    if (actualizandoId !== null) return;

    try {
      setActualizandoId(String(actividadId));
      setErrorActualizacion("");

      const respuesta = await fetch(`${base}/${actividadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo actualizar");
      }

      router.refresh();

    } catch (fallo) {
      setErrorActualizacion(
        fallo.message || "No se pudo cambiar el estado"
      );
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div className="space-y-5">

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">
          Registrar actividad
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Documenta cada interacción y seguimiento comercial.
        </p>

        <form onSubmit={guardar} className="mt-5 space-y-4">

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Tipo de actividad
              </label>
              <select name="tipo" required value={tipoActividad} onChange={e => setTipoActividad(e.target.value)} className="w-full rounded-xl border p-3 text-sm">
                {Object.entries(tipos)
                  .filter(([v]) => v !== "cambio_estado")
                  .map(([v, t]) => (
                    <option key={v} value={v}>{t}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Estado
              </label>
              <select
                name="estado"
                value={estadoActividad}
                onChange={e => setEstadoActividad(e.target.value)}
                className="w-full rounded-xl border p-3 text-sm"
              >
                {Object.entries(estados)
                  .filter(([v]) => v !== "cancelada")
                  .map(([v, t]) => (
                    <option key={v} value={v}>{t}</option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Título de la actividad *
            </label>
            <input
              name="titulo"
              required
              minLength={2}
              maxLength={160}
              placeholder="Ej. Llamada de seguimiento"
              className="w-full rounded-xl border p-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={4}
              maxLength={3000}
              placeholder="Describe el resultado de la comunicación..."
              className="w-full rounded-xl border p-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Fecha y hora programada
            </label>
            <input
              name="programado_en"
              type="datetime-local"
              required={tipoActividad === "visita"}
              onChange={e => {
                if (e.target.value) setEstadoActividad("pendiente");
              }}
              className="w-full rounded-xl border p-3 text-sm"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={guardando}
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Registrar actividad"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-900">
            Historial comercial
          </h3>
          <span className="text-sm text-slate-500">
            {actividades.length} actividades
          </span>
        </div>

        {errorActualizacion && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {errorActualizacion}
          </p>
        )}

        {actividades.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Todavía no existen actividades registradas.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {actividades.map(a => (
              <article
                key={String(a.id)}
                className={`rounded-r-xl border-l-4 p-4 ${
                  a.estado === "pendiente"
                    ? "border-orange-400 bg-orange-50"
                    : a.estado === "cancelada"
                      ? "border-slate-400 bg-slate-50"
                      : "border-blue-500 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-xs font-bold uppercase text-blue-700">
                    {tipos[a.tipo] || a.tipo}
                  </span>
                  <span className="text-xs text-slate-500">
                    {fecha(a.creado_en)}
                  </span>
                </div>

                <h4 className="mt-2 font-bold text-slate-900">
                  {a.titulo}
                </h4>

                {a.descripcion && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {a.descripcion}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="font-semibold">
                    Estado: {estados[a.estado] || a.estado}
                  </span>

                  {a.programado_en && (
                    <span>Programada: {fecha(a.programado_en)}</span>
                  )}

                  {a.completado_en && (
                    <span>Completada: {fecha(a.completado_en)}</span>
                  )}

                  <span>
                    Registrada por: {
                      a.creado_por_tipo === "admin"
                        ? "Administrador"
                        : a.creado_por_tipo === "agente"
                          ? a.agente_nombre || "Agente"
                          : "Sistema"
                    }
                  </span>
                </div>

                {a.estado === "pendiente" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actualizandoId !== null}
                      onClick={() => cambiarEstado(a.id, "completada")}
                      className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {actualizandoId === String(a.id)
                        ? "Actualizando..."
                        : "✓ Marcar completada"}
                    </button>

                    <button
                      type="button"
                      disabled={actualizandoId !== null}
                      onClick={() => cambiarEstado(a.id, "cancelada")}
                      className="rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                    >
                      Cancelar actividad
                    </button>
                  </div>
                )}

                {(a.estado === "completada" || a.estado === "cancelada") && (
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={actualizandoId !== null}
                      onClick={() => cambiarEstado(a.id, "pendiente")}
                      className="rounded-lg border border-blue-300 px-4 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
                    >
                      Reabrir actividad
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
