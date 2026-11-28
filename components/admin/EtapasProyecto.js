"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FormularioEtapa from "@/components/admin/FormularioEtapa";

const ETIQUETA = { pendiente: "Pendiente", en_curso: "En curso", terminada: "Terminada" };
const COLOR = {
  pendiente: "bg-slate-100 text-slate-600",
  en_curso: "bg-amber-100 text-amber-700",
  terminada: "bg-emerald-100 text-emerald-700"
};

export default function EtapasProyecto({ proyectoId, etapas = [], modo = "manual" }) {
  const router = useRouter();
  const [editando, setEditando] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [borrando, setBorrando] = useState(null);

  function terminar() {
    setEditando(null);
    setAgregando(false);
    router.refresh();
  }

  async function borrar(etapa) {
    if (borrando) return;
    if (!window.confirm(`¿Eliminar la etapa "${etapa.nombre}"?`)) return;
    setBorrando(etapa.id);
    try {
      const r = await fetch(`/api/admin/proyectos/${proyectoId}/etapas/${etapa.id}`, { method: "DELETE" });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error || "No se pudo eliminar");
      toast.success("Etapa eliminada");
      router.refresh();
    } catch (fallo) {
      toast.error(fallo.message || "Error al eliminar");
    } finally {
      setBorrando(null);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-slate-900">Etapas de obra</h3>
        {!agregando && (
          <button type="button" className="btn-primary px-4 py-2 text-sm"
            onClick={() => { setAgregando(true); setEditando(null); }}>
            + Agregar etapa
          </button>
        )}
      </div>

      {modo === "manual" && etapas.length > 0 && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          Avance manual: no se actualiza con las etapas. Cámbialo a automático en Editar proyecto.
        </p>
      )}
      {modo === "auto" && (
        <p className="mt-3 text-xs text-slate-500">
          El avance del proyecto es el promedio de las etapas.
        </p>
      )}

      {agregando && (
        <div className="mt-4">
          <FormularioEtapa proyectoId={proyectoId} alTerminar={terminar} alCancelar={() => setAgregando(false)} />
        </div>
      )}

      {etapas.length === 0 && !agregando ? (
        <p className="mt-3 text-sm text-slate-500">Aún no hay etapas. Agrega la primera (ej. Cimientos).</p>
      ) : (
        <div className="mt-4 space-y-3">
          {etapas.map(e => (
            <div key={String(e.id)}>
              {editando === e.id ? (
                <FormularioEtapa proyectoId={proyectoId} etapa={e} alTerminar={terminar} alCancelar={() => setEditando(null)} />
              ) : (
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">{e.nombre}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COLOR[e.estado]}`}>
                      {ETIQUETA[e.estado]}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gold-500" style={{ width: `${e.avance_porcentaje}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {e.avance_porcentaje}%
                    {(e.fecha_inicio || e.fecha_fin) && ` · ${e.fecha_inicio || "—"} a ${e.fecha_fin || "—"}`}
                  </p>
                  <div className="mt-3 flex gap-4 text-sm font-semibold">
                    <button type="button" className="text-brand-600"
                      onClick={() => { setEditando(e.id); setAgregando(false); }}>Editar</button>
                    <button type="button" className="text-red-600" disabled={borrando === e.id}
                      onClick={() => borrar(e)}>
                      {borrando === e.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
