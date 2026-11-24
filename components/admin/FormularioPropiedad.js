"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { subirFotosPropiedad } from "@/lib/subir-fotos-cliente";
import SelectorUbicacion from "@/components/admin/SelectorUbicacion";

export default function FormularioPropiedad() {
  const router = useRouter();
  const fotosRef = useRef(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [propiedadId, setPropiedadId] = useState(null);
  const pendientesRef = useRef([]);
  const [archivos, setArchivos] = useState([]);
  const [miniaturas, setMiniaturas] = useState([]);
  const [portadaIndex, setPortadaIndex] = useState(0);

  useEffect(() => {
    const urls = archivos.map(archivo =>
      URL.createObjectURL(archivo)
    );

    setMiniaturas(urls);

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [archivos]);

  async function enviar(evento) {
    evento.preventDefault();
    if (guardando) return;

    setError("");

    const formatos = new Set([
      "image/jpeg",
      "image/png",
      "image/webp"
    ]);

    const imagenesInvalidas = archivos.some(archivo =>
      !formatos.has(archivo.type) ||
      archivo.size < 1 ||
      archivo.size > 3 * 1024 * 1024
    );

    if (archivos.length > 15 || imagenesInvalidas) {
      setError(
        "Selecciona hasta 15 fotografias JPG, PNG o WebP, de maximo 3 MB cada una."
      );
      return;
    }

    setGuardando(true);

    try {
      let id = propiedadId;

      if (!id) {
        const datos = Object.fromEntries(
          new FormData(evento.currentTarget).entries()
        );

        const respuesta = await fetch("/api/admin/propiedades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.id) {
          throw new Error(resultado.error || "No se pudo guardar");
        }

        id = String(resultado.id);
        setPropiedadId(id);

        const elegidas = Array.from(
          fotosRef.current?.files || []
        );

        const portada = elegidas[portadaIndex];

        pendientesRef.current = portada
          ? [
              portada,
              ...elegidas.filter(
                (_, indice) => indice !== portadaIndex
              )
            ]
          : [];
      }

      if (pendientesRef.current.length > 0) {
        const { pendientes } = await subirFotosPropiedad(
          id,
          pendientesRef.current
        );

        pendientesRef.current = pendientes;

        if (pendientes.length > 0) {
          setError(
            `Propiedad ${id} guardada. Faltan ${pendientes.length} fotografias. Pulsa Reintentar fotos.`
          );
          return;
        }
      }

      router.push(`/admin/propiedades/${id}`);
      router.refresh();
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "Error al guardar la propiedad"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div>
        <label htmlFor="titulo" className="mb-2 block text-sm font-medium">
          Titulo de la propiedad *
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          maxLength={150}
          placeholder="Ej. Casa moderna en Equipetrol"
          className="w-full rounded-xl border border-slate-300 p-3"
        />
      </div>

      <div>
        <label htmlFor="tipo" className="mb-2 block text-sm font-medium">
          Tipo de inmueble *
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 p-3"
        >
          <option value="" disabled>Seleccionar tipo</option>
          {[
            "Casa", "Departamento", "Terreno",
            "Local comercial", "Oficina", "Galpon",
            "Quinta", "Otro"
          ].map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="tipo_operacion" className="mb-2 block text-sm font-medium">
            Operacion *
          </label>
          <select id="tipo_operacion" name="tipo_operacion" required
            defaultValue="" className="w-full rounded-xl border border-slate-300 p-3">
            <option value="" disabled>Seleccionar</option>
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </select>
        </div>

        <div>
          <label htmlFor="precio" className="mb-2 block text-sm font-medium">
            Precio *
          </label>
          <input id="precio" name="precio" type="number" required
            min="0.01" step="0.01" placeholder="Ej. 85000"
            className="w-full rounded-xl border border-slate-300 p-3" />
        </div>

        <div>
          <label htmlFor="moneda" className="mb-2 block text-sm font-medium">
            Moneda *
          </label>
          <select id="moneda" name="moneda" required
            defaultValue="" className="w-full rounded-xl border border-slate-300 p-3">
            <option value="" disabled>Seleccionar</option>
            <option value="BOB">Bs (BOB)</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-sm font-medium">
          Descripcion
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          maxLength={4000}
          placeholder="Describe las caracteristicas del inmueble"
          className="w-full rounded-xl border border-slate-300 p-3"
        />
      </div>

      <SelectorUbicacion />

      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-bold text-slate-900">
          Caracteristicas del inmueble
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["dormitorios", "Dormitorios", "1"],
            ["banos", "Baños", "1"],
            ["parqueos", "Parqueos", "1"],
            ["superficie_terreno_m2", "Terreno (m²)", "0.01"],
            ["superficie_construida_m2", "Construccion (m²)", "0.01"]
          ].map(([nombre, etiqueta, paso]) => (
            <div key={nombre}>
              <label htmlFor={nombre}
                className="mb-2 block text-sm font-medium">
                {etiqueta}
              </label>
              <input id={nombre} name={nombre}
                type="number" min="0" step={paso}
                inputMode={paso === "1" ? "numeric" : "decimal"}
                className="w-full rounded-xl border border-slate-300 p-3"
              />
            </div>
          ))}
        </div>
      </section>

      <div>
        <label
          htmlFor="fotos"
          className="mb-2 block text-sm font-medium"
        >
          Fotografias de la propiedad
        </label>
        <input
          ref={fotosRef}
          id="fotos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(evento) => {
            setArchivos(Array.from(evento.target.files || []));
            setPortadaIndex(0);
          }}
          disabled={guardando || Boolean(propiedadId)}
          className="w-full rounded-xl border border-slate-300 p-3"
        />
        <p className="mt-2 text-xs text-slate-500">
          Puedes seleccionar varias imagenes JPG, PNG o WebP.
          Maximo 3 MB por fotografia.
        </p>

        {miniaturas.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {miniaturas.map((src, indice) => (
              <label
                key={src}
                className="cursor-pointer rounded-xl border border-slate-200 p-2"
              >
                <Image
                  src={src}
                  alt={`Fotografia ${indice + 1}`}
                  width={200}
                  height={140}
                  unoptimized
                  className="h-28 w-full rounded-lg object-cover"
                />
                <span className="mt-2 flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    checked={portadaIndex === indice}
                    onChange={() => setPortadaIndex(indice)}
                    disabled={guardando || Boolean(propiedadId)}
                  />
                  Elegir portada
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        {propiedadId
          ? "Propiedad guardada. Solo faltan las fotografias pendientes."
          : "La propiedad se guardara como borrador."}
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {guardando
          ? "Procesando..."
          : propiedadId
            ? "Reintentar fotos"
            : "Guardar propiedad"}
      </button>
    </form>
  );
}
