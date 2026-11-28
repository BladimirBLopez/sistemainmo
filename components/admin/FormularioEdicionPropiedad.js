"use client";

import { toast } from "sonner";
import AvisoCambios from "@/components/AvisoCambios";

import { useRef, useState } from "react";
import AsistenteGemini from "@/components/admin/AsistenteGemini";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SelectorUbicacion from "@/components/admin/SelectorUbicacion";
import {
  FiHome,
  FiMapPin,
  FiGrid,
  FiSettings,
  FiSave,
  FiArrowLeft,
  FiInfo
} from "react-icons/fi";

const secciones = [
  { id: "datos", nombre: "Datos", icono: FiHome },
  { id: "ubicacion", nombre: "Ubicación", icono: FiMapPin },
  { id: "detalles", nombre: "Detalles", icono: FiGrid },
  { id: "estado", nombre: "Estado", icono: FiSettings }
];

const camposCaracteristicas = [
  ["dormitorios", "Dormitorios", "1"],
  ["banos", "Baños", "1"],
  ["parqueos", "Parqueos", "1"],
  ["superficie_terreno_m2", "Terreno (m²)", "0.01"],
  ["superficie_construida_m2", "Construcción (m²)", "0.01"]
];

const tipos = [
  "Casa", "Departamento", "Terreno",
  "Local comercial", "Oficina", "Galpon",
  "Quinta", "Otro"
];

const clases = {
  input: "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
  label: "mb-2 block text-sm font-semibold text-slate-700"
};

const seccionPorCampo = {
  titulo: "datos",
  tipo: "datos",
  tipo_operacion: "datos",
  precio: "datos",
  moneda: "datos",
  descripcion: "datos",
  departamento: "ubicacion",
  ciudad: "ubicacion",
  zona: "ubicacion",
  direccion_privada: "ubicacion",
  geo_place_id: "ubicacion",
  latitud: "ubicacion",
  longitud: "ubicacion",
  dormitorios: "detalles",
  banos: "detalles",
  parqueos: "detalles",
  superficie_terreno_m2: "detalles",
  superficie_construida_m2: "detalles",
  estado_publicacion: "estado",
  estado_comercial: "estado"
};

export default function FormularioEdicionPropiedad({ propiedad, modo = "admin", proyectos = [] }) {
  const router = useRouter();
  const formRef = useRef(null);

  const [seccion, setSeccion] = useState("datos");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando) return;

    setError("");

    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(
      new FormData(formulario).entries()
    );

    const obligatorios = [
      ["titulo", "el título", "datos"],
      ["tipo", "el tipo de inmueble", "datos"],
      ["tipo_operacion", "la operación", "datos"],
      ["precio", "el precio", "datos"],
      ["moneda", "la moneda", "datos"],
      ["estado_publicacion", "el estado de publicación", "estado"],
      ["estado_comercial", "el estado comercial", "estado"]
    ];

    for (const [campo, etiqueta, destino] of obligatorios) {
      if (!String(datos[campo] ?? "").trim()) {
        setSeccion(destino);
        setError(`Debes completar ${etiqueta}.`);
        return;
      }
    }

    if (!Number.isFinite(Number(datos.precio)) ||
        Number(datos.precio) <= 0) {
      setSeccion("datos");
      setError("Introduce un precio válido mayor que cero.");
      return;
    }

    setGuardando(true);

    try {
      const baseApi = modo === "agente" ? "/api/agente/propiedades" : "/api/admin/propiedades";

      const respuesta = await fetch(
        `${baseApi}/${propiedad.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(datos)
        }
      );

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        const coincidencia = resultado.error?.match(
          /^Dato invalido:\s*(.+)$/
        );

        if (coincidencia && seccionPorCampo[coincidencia[1]]) {
          setSeccion(seccionPorCampo[coincidencia[1]]);
        }

        throw new Error(
          resultado.error || "No se pudieron guardar los cambios."
        );
      }

      toast.success("Cambios guardados");
      formRef.current?.dispatchEvent(new Event("guardado"));
      router.replace(`${modo === "agente" ? "/agente/propiedades" : "/admin/propiedades"}?ficha=${propiedad.id}`);
      router.refresh();

    } catch (fallo) {
      toast.error(
        fallo instanceof Error
          ? fallo.message
          : "No se pudieron guardar los cambios."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={guardar}
      noValidate
      className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* ENCABEZADO */}
      <header className="border-b border-slate-100 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Editar inmueble
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Actualiza la información de tu propiedad.
            </p>
          </div>

          <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            ID #{propiedad.id}
          </span>
        </div>

        {/* NAVEGACIÓN */}
        <nav
          role="tablist"
          aria-label="Secciones de edición"
          className="mt-5 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1"
        >
          {secciones.map(({ id, nombre, icono: Icono }) => {
            const activo = seccion === id;

            return (
              <button
                key={id}
                id={`tab-${id}`}
                type="button"
                role="tab"
                aria-selected={activo}
                aria-controls={`panel-${id}`}
                onClick={() => {
                  setSeccion(id);
                  setError("");
                }}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-[11px] font-semibold transition sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${
                  activo
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icono size={17} />
                <span>{nombre}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* CONTENIDO: TODOS LOS PANELES PERMANECEN MONTADOS */}
      <div className="p-4 sm:p-6">

        {/* 1. DATOS */}
        <section
          id="panel-datos"
          role="tabpanel"
          aria-labelledby="tab-datos"
          hidden={seccion !== "datos"}
          className="space-y-5"
        >
          <div>
            <h3 className="font-bold text-slate-900">
              Información principal
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Identificación, operación y precio.
            </p>
          </div>

          <div>
            <label htmlFor="titulo" className={clases.label}>
              Nombre del inmueble *
            </label>
            <input
              id="titulo"
              name="titulo"
              required
              maxLength={150}
              defaultValue={propiedad.titulo}
              className={clases.input}
              placeholder="Ej. Casa moderna en venta"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo" className={clases.label}>
                Tipo de inmueble *
              </label>
              <select
                id="tipo"
                name="tipo"
                required
                defaultValue={propiedad.tipo}
                className={clases.input}
              >
                {tipos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tipo_operacion" className={clases.label}>
                Operación *
              </label>
              <select
                id="tipo_operacion"
                name="tipo_operacion"
                required
                defaultValue={propiedad.tipo_operacion || ""}
                className={clases.input}
              >
                <option value="" disabled>Seleccionar</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
            <option value="anticretico">Anticrético</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="precio" className={clases.label}>
                Precio *
              </label>
              <input
                id="precio"
                name="precio"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={propiedad.precio}
                className={clases.input}
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="moneda" className={clases.label}>
                Moneda *
              </label>
              <select
                id="moneda"
                name="moneda"
                required
                defaultValue={propiedad.moneda || ""}
                className={clases.input}
              >
                <option value="" disabled>Seleccionar</option>
                <option value="BOB">Bolivianos (Bs)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="descripcion" className={clases.label}>
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={5}
              maxLength={4000}
              defaultValue={propiedad.descripcion ?? ""}
              className={clases.input}
              placeholder="Describe las características y ventajas del inmueble..."
            />
          </div>

          {modo === "admin" && (
            <div>
              <label htmlFor="proyecto_id" className={clases.label}>
                Proyecto (opcional)
              </label>
              <select
                id="proyecto_id"
                name="proyecto_id"
                defaultValue={propiedad.proyecto_id || ""}
                className={clases.input}
              >
                <option value="">Sin proyecto</option>
                {proyectos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <AsistenteGemini
            propiedadId={propiedad.id}
            modo={modo}
            formRef={formRef}
          />
        </section>

        {/* 2. UBICACIÓN */}
        <section
          id="panel-ubicacion"
          role="tabpanel"
          aria-labelledby="tab-ubicacion"
          hidden={seccion !== "ubicacion"}
          className="space-y-5"
        >
          <div>
            <h3 className="font-bold text-slate-900">
              Ubicación del inmueble
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Información geográfica y dirección.
            </p>
          </div>

          <SelectorUbicacion
            inicial={{
              departamento: propiedad.departamento,
              ciudad: propiedad.ciudad,
              zona: propiedad.zona,
              direccion_privada: propiedad.direccion_privada,
              geo_place_id: propiedad.geo_place_id,
              latitud: propiedad.latitud,
              longitud: propiedad.longitud
            }}
            modo={modo}
          />
        </section>

        {/* 3. CARACTERÍSTICAS */}
        <section
          id="panel-detalles"
          role="tabpanel"
          aria-labelledby="tab-detalles"
          hidden={seccion !== "detalles"}
          className="space-y-5"
        >
          <div>
            <h3 className="font-bold text-slate-900">
              Características del inmueble
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Superficies y distribución.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {camposCaracteristicas.map(([nombre, etiqueta, paso]) => (
              <div key={nombre}>
                <label htmlFor={nombre} className={clases.label}>
                  {etiqueta}
                </label>

                <input
                  id={nombre}
                  name={nombre}
                  type="number"
                  min="0"
                  step={paso}
                  defaultValue={propiedad[nombre] ?? ""}
                  className={clases.input}
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <FiInfo className="mt-0.5 shrink-0" size={16} />
            <p>
              Las superficies se expresan en metros cuadrados.
              Puedes dejar vacíos los campos que no correspondan.
            </p>
          </div>
        </section>

        {/* 4. PUBLICACIÓN */}
        <section
          id="panel-estado"
          role="tabpanel"
          aria-labelledby="tab-estado"
          hidden={seccion !== "estado"}
          className="space-y-5"
        >
          <div>
            <h3 className="font-bold text-slate-900">
              Publicación y situación comercial
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Controla la visibilidad y disponibilidad del inmueble.
            </p>
          </div>

          <div>
            <label htmlFor="estado_publicacion" className={clases.label}>
              Estado de publicación *
            </label>
            <select
              id="estado_publicacion"
              name="estado_publicacion"
              required
              defaultValue={propiedad.estado_publicacion}
              className={clases.input}
            >
              <option value="borrador">Borrador</option>
              <option value="pendiente">Pendiente</option>
              <option value="publicada">Publicada</option>
              <option value="oculta">Oculta</option>
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Determina la situación del anuncio dentro del sistema.
            </p>
          </div>

          <div>
            <label htmlFor="estado_comercial" className={clases.label}>
              Estado comercial *
            </label>
            <select
              id="estado_comercial"
              name="estado_comercial"
              required
              defaultValue={propiedad.estado_comercial}
              className={clases.input}
            >
              <option value="disponible">Disponible</option>
              <option value="reservada">Reservada</option>
              <option value="vendida">Vendida</option>
              <option value="alquilada">Alquilada</option>
              <option value="retirada">Retirada</option>
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Indica la situación comercial real del inmueble.
            </p>
          </div>
        </section>

      </div>

      {/* GUARDADO SIEMPRE ACCESIBLE */}
      <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            href={`${modo === "agente" ? "/agente/propiedades" : "/admin/propiedades"}?ficha=${propiedad.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FiArrowLeft size={17} />
            <span>Volver</span>
          </Link>

          <button
            type="submit"
            disabled={guardando}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave size={17} />
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </footer>
      <AvisoCambios />
    </form>
  );
}
