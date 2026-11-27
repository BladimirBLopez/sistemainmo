"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvisoCambios from "@/components/AvisoCambios";
import { toast } from "sonner";

const clase = "input";

export default function FormularioContenido({ campanas, contenido = null }) {
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
        contenido
          ? "/api/admin/marketing/contenidos/" + contenido.id
          : "/api/admin/marketing/contenidos",
        {
          method: contenido ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || "No se pudo guardar");
      }

      if (contenido) {
        formulario.dispatchEvent(new Event("guardado"));
        toast.success("Publicación actualizada");
        router.push("/admin/marketing/contenidos");
        router.refresh();
        return;
      }

      formulario.dispatchEvent(new Event("guardado"));
      toast.success("Publicación registrada");
      formulario.reset();
      router.refresh();

    } catch (fallo) {
      toast.error(fallo.message || "Error al registrar publicación");
      setError(fallo.message || "Error al registrar publicación");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <AvisoCambios />

      <div>
        <label className="label">
          Título de publicación *
        </label>
        <input
          name="titulo"
          required
          minLength={2}
          maxLength={180}
          defaultValue={contenido?.titulo || ""}
          className={clase}
          placeholder="Ej. Departamento en venta"
        />
      </div>

      <div>
        <label className="label">
          Campaña relacionada
        </label>
        <select name="campana_id" defaultValue={contenido?.campana_id || ""} className={clase}>
          <option value="">Contenido independiente</option>
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
            Plataforma *
          </label>
          <select name="plataforma" required defaultValue={contenido?.plataforma || "facebook"} className={clase}>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
            <option value="tiktok">TikTok</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="portal">Portal inmobiliario</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="label">
            Formato *
          </label>
          <select name="formato" defaultValue={contenido?.formato || "post"} className={clase}>
            <option value="post">Publicación</option>
            <option value="historia">Historia</option>
            <option value="reel">Reel</option>
            <option value="video">Video</option>
            <option value="carrusel">Carrusel</option>
            <option value="anuncio">Anuncio</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">
          Texto de publicación
        </label>
        <textarea
          name="texto_publicacion"
          rows={5}
          defaultValue={contenido?.texto_publicacion || ""}
          maxLength={10000}
          className={clase}
          placeholder="Escribe el contenido, descripción y hashtags..."
        />
      </div>

      <div>
        <label className="label">
          Fecha y hora programada
        </label>
        <input
          type="datetime-local"
          name="fecha_programada"
          defaultValue={contenido?.fecha_programada_local || ""}
          className={clase}
        />
      </div>

      <div>
        <label className="label">
          Estado *
        </label>
        <select name="estado" defaultValue={contenido?.estado || "idea"} className={clase}>
          <option value="idea">Idea</option>
          <option value="pendiente">Pendiente</option>
          <option value="programado">Programado</option>
          <option value="publicado">Publicado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div>
        <label className="label">
          Enlace del recurso gráfico
        </label>
        <input
          name="recurso_url"
          type="url"
          defaultValue={contenido?.recurso_url || ""}
          maxLength={1000}
          className={clase}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="label">
          Enlace de publicación
        </label>
        <input
          name="url_publicacion"
          type="url"
          defaultValue={contenido?.url_publicacion || ""}
          maxLength={1000}
          className={clase}
          placeholder="https://..."
        />
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
        {guardando ? "Guardando..." : contenido ? "Guardar cambios" : "Registrar publicación"}
      </button>
    </form>
  );
}
