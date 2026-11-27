"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvisoCambios from "@/components/AvisoCambios";
import { toast } from "sonner";

const clase = "input";

export default function FormularioGasto({ campanas, fechaActual }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;

    const formulario = evento.currentTarget;
    setGuardando(true);
    setError("");

    try {
      const datos = Object.fromEntries(
        new FormData(formulario).entries()
      );

      const respuesta = await fetch("/api/admin/marketing/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo registrar el gasto");
      }

      formulario.reset();
      formulario.elements.fecha.value = fechaActual;
      formulario.dispatchEvent(new Event("guardado"));
      toast.success("Gasto registrado");
      router.refresh();

    } catch (fallo) {
      toast.error(fallo.message || "Error al registrar el gasto");
      setError(fallo.message || "Error al registrar el gasto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <AvisoCambios />

      <div>
        <label className="label">
          Campaña relacionada
        </label>
        <select name="campana_id" className={clase}>
          <option value="">Gasto general de marketing</option>
          {campanas.map(c => (
            <option key={String(c.id)} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            Categoría *
          </label>
          <select name="categoria" required className={clase}>
            <option value="publicidad">Publicidad</option>
            <option value="diseno">Diseño</option>
            <option value="produccion">Producción</option>
            <option value="impresion">Impresión</option>
            <option value="herramientas">Herramientas</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        <div>
          <label className="label">
            Plataforma
          </label>
          <select name="plataforma" className={clase}>
            <option value="">No especificada</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google Ads</option>
            <option value="tiktok">TikTok</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="portal">Portal inmobiliario</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">
          Concepto del gasto *
        </label>
        <input
          name="concepto"
          required
          minLength={2}
          maxLength={180}
          className={clase}
          placeholder="Ej. Publicidad Facebook campaña de captación"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">
            Fecha *
          </label>
          <input
            name="fecha"
            type="date"
            required
            defaultValue={fechaActual}
            className={clase}
          />
        </div>

        <div>
          <label className="label">
            Importe *
          </label>
          <input
            name="monto"
            type="number"
            min="0"
            step="0.01"
            required
            className={clase}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="label">
          Moneda *
        </label>
        <select name="moneda" required className={clase}>
          <option value="BOB">Bolivianos (Bs)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
      </div>

      <div>
        <label className="label">
          Enlace del comprobante
        </label>
        <input
          name="comprobante_url"
          type="url"
          maxLength={1000}
          className={clase}
          placeholder="https://..."
        />
        <p className="mt-1 text-xs text-slate-400">
          Pega el enlace del comprobante, factura o recibo.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        disabled={guardando}
        className="btn-primary w-full px-5 py-3"
      >
        {guardando ? "Guardando..." : "Registrar gasto"}
      </button>
    </form>
  );
}
