"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvisoCambios from "@/components/AvisoCambios";
import { toast } from "sonner";

const clase = "input";

const campos = [
  ["alcance", "Alcance"],
  ["impresiones", "Impresiones"],
  ["clics", "Clics"],
  ["interacciones", "Interacciones"],
  ["mensajes", "Mensajes"],
  ["leads_reportados", "Leads reportados"],
  ["conversiones_reportadas", "Conversiones"]
];

export default function FormularioMetricas({
  campanaId,
  fechaActual
}) {
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

      const respuesta = await fetch(
        "/api/admin/marketing/metricas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudieron guardar las métricas."
        );
      }

      formulario.reset();

      formulario.elements.fecha.value = fechaActual;

      formulario.dispatchEvent(new Event("guardado"));
      toast.success("Rendimiento registrado");

      router.refresh();

    } catch (fallo) {
      toast.error(fallo.message || "Error al registrar métricas.");
      setError(
        fallo.message || "Error al registrar métricas."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <AvisoCambios />

      <input
        type="hidden"
        name="campana_id"
        defaultValue={campanaId}
      />

      <div>
        <label className="label">
          Fecha del reporte *
        </label>
        <input
          type="date"
          name="fecha"
          required
          defaultValue={fechaActual}
          className={clase}
        />
      </div>

      <div>
        <label className="label">
          Plataforma *
        </label>
        <select
          name="plataforma"
          required
          className={clase}
        >
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="google">Google Ads</option>
          <option value="tiktok">TikTok</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="portal">Portal inmobiliario</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {campos.map(([nombre, etiqueta]) => (
          <div key={nombre}>
            <label className="label">
              {etiqueta}
            </label>
            <input
              type="number"
              name={nombre}
              min="0"
              max="2147483647"
              step="1"
              required
              defaultValue="0"
              className={clase}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="label">
          Gasto reportado por la plataforma *
        </label>
        <input
          type="number"
          name="gasto_reportado"
          min="0"
          step="0.01"
          required
          defaultValue="0.00"
          className={clase}
        />
      </div>

      <div>
        <label className="label">
          Moneda *
        </label>
        <select
          name="moneda"
          className={clase}
          required
        >
          <option value="BOB">Bolivianos (Bs)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
      </div>

      <p className="rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
        El gasto reportado se utiliza para calcular indicadores
        publicitarios. No sustituye el registro financiero de gastos.
      </p>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="btn-primary w-full px-5 py-3"
      >
        {guardando ? "Guardando..." : "Registrar rendimiento"}
      </button>

    </form>
  );
}
