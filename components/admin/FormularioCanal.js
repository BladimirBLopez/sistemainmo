"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvisoCambios from "@/components/AvisoCambios";
import { toast } from "sonner";

const clase = "input";

export default function FormularioCanal({ campanaId }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando) return;

    setGuardando(true);
    setError("");

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

      formulario.dispatchEvent(new Event("guardado"));
      toast.success("Canal registrado");
      formulario.reset();
      router.refresh();

    } catch (fallo) {
      toast.error(fallo.message || "Error al registrar canal");
      setError(fallo.message || "Error al registrar canal");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <AvisoCambios />

      <div>
        <label className="label">
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
        <label className="label">
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
        <label className="label">
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
        <label className="label">
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

      <button
        disabled={guardando}
        className="btn-primary w-full px-5 py-3"
      >
        {guardando ? "Guardando..." : "Registrar canal"}
      </button>
    </form>
  );
}
