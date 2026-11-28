"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function FormularioEtapa({ proyectoId, etapa = null, alTerminar, alCancelar }) {
  const editando = Boolean(etapa);
  const [estado, setEstado] = useState(etapa?.estado ?? "pendiente");
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;
    setGuardando(true);
    try {
      const datos = Object.fromEntries(new FormData(evento.currentTarget).entries());
      datos.estado = estado;
      if (estado === "pendiente") datos.avance_porcentaje = 0;
      if (estado === "terminada") datos.avance_porcentaje = 100;
      const base = `/api/admin/proyectos/${proyectoId}/etapas`;
      const respuesta = await fetch(editando ? `${base}/${etapa.id}` : base, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error || "No se pudo guardar");
      toast.success(editando ? "Etapa actualizada" : "Etapa registrada");
      alTerminar?.();
    } catch (fallo) {
      toast.error(fallo.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  const v = (k, d = "") => etapa?.[k] ?? d;

  return (
    <form onSubmit={guardar} className="space-y-4 rounded-xl bg-slate-50 p-4">
      <div>
        <label className="label">Nombre de la etapa *</label>
        <input name="nombre" required minLength={3} maxLength={160}
          defaultValue={v("nombre")} className="input"
          placeholder="Ej. Cimientos" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value)} className="input">
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="terminada">Terminada</option>
          </select>
        </div>
        <div>
          <label className="label">Avance (%)</label>
          <input name="avance_porcentaje" type="number" min="0" max="100" step="1"
            disabled={estado !== "en_curso"} className="input"
            defaultValue={v("avance_porcentaje", "0")} />
        </div>
        <div>
          <label className="label">Orden</label>
          <input name="orden" type="number" min="0" max="9999" step="1"
            defaultValue={v("orden", "0")} className="input" />
        </div>
        <div>
          <label className="label">Inicio</label>
          <input name="fecha_inicio" type="date" defaultValue={v("fecha_inicio")} className="input" />
        </div>
        <div>
          <label className="label">Fin</label>
          <input name="fecha_fin" type="date" defaultValue={v("fecha_fin")} className="input" />
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" disabled={guardando} onClick={alCancelar} className="btn-ghost px-5 py-3">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="btn-primary px-6 py-3">
          {guardando ? "Guardando..." : editando ? "Guardar etapa" : "Agregar etapa"}
        </button>
      </div>
    </form>
  );
}
