"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AvisoCambios from "@/components/AvisoCambios";
import { toast } from "sonner";

const campo = "input";

export default function FormularioProyecto({ proyecto = null }) {
  const editando = Boolean(proyecto);
  const router = useRouter();
  const formRef = useRef(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modo, setModo] = useState(proyecto?.avance_modo ?? "manual");

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError("");

    try {
      const datos = Object.fromEntries(
        new FormData(evento.currentTarget).entries()
      );

      const respuesta = await fetch(
        editando ? `/api/admin/proyectos/${proyecto.id}` : "/api/admin/proyectos",
        {
          method: editando ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }
      );
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error || "No se pudo guardar");

      toast.success(editando ? "Proyecto actualizado" : "Proyecto registrado");
      formRef.current?.dispatchEvent(new Event("guardado"));
      router.push(`/admin/proyectos/${resultado.id}`);
      router.refresh();
    } catch (fallo) {
      toast.error(fallo.message || "Error al guardar");
      setError(fallo.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  const v = (k, d = "") => proyecto?.[k] ?? d;

  return (
    <form ref={formRef} onSubmit={guardar} className="space-y-6">
      <AvisoCambios />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-slate-900">Información del proyecto</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input name="nombre" required minLength={3} maxLength={160}
              defaultValue={v("nombre")} className={campo}
              placeholder="Ej. Condominio Los Pinos" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea name="descripcion" rows={4} maxLength={4000}
              defaultValue={v("descripcion")} className={campo} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tipo</label>
              <select name="tipo" defaultValue={v("tipo", "residencial")} className={campo}>
                <option value="residencial">Residencial</option>
                <option value="comercial">Comercial</option>
                <option value="lotizacion">Lotización</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select name="estado" defaultValue={v("estado", "planificacion")} className={campo}>
                <option value="planificacion">Planificación</option>
                <option value="en_obra">En obra</option>
                <option value="pausado">Pausado</option>
                <option value="terminado">Terminado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Modo de avance</label>
            <select name="avance_modo" value={modo} onChange={e => setModo(e.target.value)} className={campo}>
              <option value="manual">Manual (yo lo escribo)</option>
              <option value="auto">Automático (promedio de las etapas)</option>
            </select>
          </div>
          <div>
            <label className="label">Avance general (%)</label>
            <input name="avance_porcentaje" type="number" min="0" max="100" step="1"
              required disabled={modo === "auto"} defaultValue={v("avance_porcentaje", "0")} className={campo} />
            {modo === "auto" && (
              <>
                <input type="hidden" name="avance_porcentaje" value={v("avance_porcentaje", "0")} />
                <p className="mt-1 text-xs text-slate-500">Se calcula solo con las etapas al guardar.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-slate-900">Ubicación</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Departamento</label>
            <input name="departamento" maxLength={80} defaultValue={v("departamento")} className={campo} />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input name="ciudad" maxLength={100} defaultValue={v("ciudad")} className={campo} />
          </div>
          <div>
            <label className="label">Zona</label>
            <input name="zona" maxLength={120} defaultValue={v("zona")} className={campo} />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input name="direccion" maxLength={250} defaultValue={v("direccion")} className={campo} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-slate-900">Presupuesto y fechas</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Presupuesto *</label>
            <input name="presupuesto" type="number" required min="0"
              max="999999999999" step="0.01"
              defaultValue={v("presupuesto", "0")} className={campo} />
          </div>
          <div>
            <label className="label">Moneda</label>
            <select name="moneda" defaultValue={v("moneda", "BOB")} className={campo}>
              <option value="BOB">Bolivianos (Bs)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>
          <div>
            <label className="label">Inicio</label>
            <input name="fecha_inicio" type="date" defaultValue={v("fecha_inicio")} className={campo} />
          </div>
          <div>
            <label className="label">Fin estimado</label>
            <input name="fecha_fin_estimada" type="date" defaultValue={v("fecha_fin_estimada")} className={campo} />
          </div>
          <div>
            <label className="label">Fin real</label>
            <input name="fecha_fin_real" type="date" defaultValue={v("fecha_fin_real")} className={campo} />
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" disabled={guardando} className="btn-ghost px-5 py-3"
          onClick={() => router.push(editando ? `/admin/proyectos/${proyecto.id}` : "/admin/proyectos")}>
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="btn-primary px-6 py-3">
          {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar proyecto"}
        </button>
      </div>
    </form>
  );
}
