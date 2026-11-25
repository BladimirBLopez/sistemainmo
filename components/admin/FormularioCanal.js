"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const clase =
  "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function FormularioCanal({ campanaId }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    const formulario = evento.currentTarget;

    try {
      const datos = Object.fromEntries(
        new FormData(formulario).entries()
      );

      const respuesta = await fetch(
        `/api/admin/marketing/${campanaId}/canales`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar");
      }

      formulario.reset();
      setMensaje("Canal registrado correctamente.");
      router.refresh();

    } catch (fallo) {
      setError(fallo.message || "Error al registrar canal");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Plataforma *
        </label>

        <select name="plataforma" required className={clase}>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="google">Google Ads</option>
          <option value="tiktok">TikTok</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="portal">Portal inmobiliario</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Identificador externo
        </label>
        <input
          name="id_externo"
          maxLength={200}
          className={clase}
          placeholder="ID de cuenta o campaña publicitaria"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          URL externa
        </label>
        <input
          name="url_externa"
          type="url"
          maxLength={1000}
          className={clase}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Estado
        </label>
        <select name="estado" className={clase}>
          <option value="activo">Activo</option>
          <option value="pausado">Pausado</option>
          <option value="finalizado">Finalizado</option>
        </select>
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
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Registrar canal"}
      </button>
    </form>
  );
}
