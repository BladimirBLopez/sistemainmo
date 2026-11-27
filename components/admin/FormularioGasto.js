"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const clase = "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function FormularioGasto({ campanas, fechaActual }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;

    const formulario = evento.currentTarget;
    setGuardando(true);
    setError("");
    setMensaje("");

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
      setMensaje("Gasto registrado correctamente.");
      router.refresh();

    } catch (fallo) {
      setError(fallo.message || "Error al registrar el gasto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">

      <div>
        <label className="mb-2 block text-sm font-semibold">
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
          <label className="mb-2 block text-sm font-semibold">
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
          <label className="mb-2 block text-sm font-semibold">
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
        <label className="mb-2 block text-sm font-semibold">
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
          <label className="mb-2 block text-sm font-semibold">
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
          <label className="mb-2 block text-sm font-semibold">
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
        <label className="mb-2 block text-sm font-semibold">
          Moneda *
        </label>
        <select name="moneda" required className={clase}>
          <option value="BOB">Bolivianos (Bs)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
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

      {mensaje && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {mensaje}
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
