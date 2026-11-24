"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FiMapPin, FiMap } from "react-icons/fi";

const MapaUbicacion = dynamic(
  () => import("./MapaUbicacion"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
        Cargando mapa...
      </div>
    )
  }
);

const claseInput =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function SelectorUbicacion({ inicial = {} }) {
  const [departamento, setDepartamento] = useState(
    inicial.departamento || ""
  );

  const [ciudad, setCiudad] = useState(
    inicial.ciudad || ""
  );

  const [zona, setZona] = useState(
    inicial.zona || ""
  );

  const [direccion, setDireccion] = useState(
    inicial.direccion_privada || ""
  );

  const [placeId, setPlaceId] = useState(
    inicial.geo_place_id || ""
  );

  const [latitud, setLatitud] = useState(
    inicial.latitud == null ? "" : String(inicial.latitud)
  );

  const [longitud, setLongitud] = useState(
    inicial.longitud == null ? "" : String(inicial.longitud)
  );

  const [busqueda, setBusqueda] = useState(
    inicial.ciudad
      ? [inicial.ciudad, inicial.departamento]
          .filter(Boolean).join(", ")
      : ""
  );

  const [seleccionada, setSeleccionada] = useState(
    Boolean(inicial.ciudad)
  );

  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [mapaAbierto, setMapaAbierto] = useState(
    Boolean(inicial.latitud && inicial.longitud)
  );

  useEffect(() => {
    const consulta = busqueda.trim();

    if (seleccionada || consulta.length < 3) {
      setResultados([]);
      setCargando(false);
      return;
    }

    const controlador = new AbortController();
    let vigente = true;

    const temporizador = setTimeout(async () => {
      setCargando(true);

      try {
        const respuesta = await fetch(
          `/api/admin/ubicaciones?q=${encodeURIComponent(consulta)}`,
          {
            signal: controlador.signal,
            cache: "no-store"
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.error || "Error buscando localidades");
        }

        if (vigente) {
          setResultados(datos.results || []);
          setError("");
        }
      } catch (fallo) {
        if (vigente && fallo.name !== "AbortError") {
          setResultados([]);
          setError(fallo.message || "No se pudo buscar la localidad");
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }, 350);

    return () => {
      vigente = false;
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [busqueda, seleccionada]);

  function seleccionar(lugar) {
    setCiudad(lugar.ciudad);
    setDepartamento(lugar.departamento);
    setPlaceId(lugar.placeId);
    setLatitud(lugar.latitud);
    setLongitud(lugar.longitud);
    setBusqueda(lugar.etiqueta);
    setSeleccionada(true);
    setResultados([]);
    setMapaAbierto(false);
    setError("");
  }

  function cambiarBusqueda(valor) {
    setBusqueda(valor);
    setSeleccionada(false);
    setCiudad("");
    setDepartamento("");
    setZona("");
    setPlaceId("");
    setLatitud("");
    setLongitud("");
    setMapaAbierto(false);
  }

  function cambiarCoordenadas(punto) {
    setLatitud(punto.lat.toFixed(7));
    setLongitud(punto.lng.toFixed(7));
  }

  const posicion =
    latitud !== "" && longitud !== ""
      ? {
          lat: Number(latitud),
          lng: Number(longitud)
        }
      : null;

  const mapaDisponible =
    seleccionada &&
    posicion &&
    Number.isFinite(posicion.lat) &&
    Number.isFinite(posicion.lng);

  return (
    <section className="space-y-5">
      <div>
        <label
          htmlFor="localidad-busqueda"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Localidad *
        </label>

        <div className="relative">
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              id="localidad-busqueda"
              type="text"
              value={busqueda}
              onChange={e => cambiarBusqueda(e.target.value)}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={resultados.length > 0}
              placeholder="Escribe una ciudad o localidad..."
              className={`${claseInput} pl-10 pr-10`}
            />

            {cargando && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600">
                Buscando...
              </span>
            )}
          </div>

          {resultados.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-[1000] mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              {resultados.map(lugar => (
                <li key={lugar.placeId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => seleccionar(lugar)}
                    className="flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left hover:bg-blue-50"
                  >
                    <span className="text-sm font-semibold text-slate-800">
                      {lugar.ciudad}
                    </span>
                    <span className="text-xs text-slate-500">
                      {lugar.etiqueta}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {seleccionada && (
          <p className="mt-2 text-xs font-medium text-emerald-700">
            Localidad seleccionada correctamente
            {departamento ? ` · ${departamento}` : ""}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}

        {!seleccionada && busqueda.trim().length > 0 &&
          busqueda.trim().length < 3 && (
            <p className="mt-2 text-xs text-slate-500">
              Escribe al menos 3 caracteres.
            </p>
          )}
      </div>

      {seleccionada && (
        <div>
          <label
            htmlFor="zona"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Zona / Barrio
          </label>

          <input
            id="zona"
            name="zona"
            value={zona}
            onChange={e => setZona(e.target.value)}
            maxLength={120}
            placeholder="Ej. Equipetrol, Las Palmas..."
            className={claseInput}
          />
        </div>
      )}

      <div>
        <label
          htmlFor="direccion_privada"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Dirección o referencia
        </label>

        <input
          id="direccion_privada"
          name="direccion_privada"
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          maxLength={300}
          placeholder="Calle, avenida o referencia del inmueble"
          className={claseInput}
        />

        <p className="mt-1 text-xs text-slate-500">
          Este dato se conserva como información privada de administración.
        </p>
      </div>

      <input type="hidden" name="departamento" value={departamento} />
      <input type="hidden" name="ciudad" value={ciudad} />
      <input type="hidden" name="geo_place_id" value={placeId} />
      <input type="hidden" name="latitud" value={latitud} />
      <input type="hidden" name="longitud" value={longitud} />

      <div className="space-y-3 rounded-xl border border-slate-200 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Ubicación en el mapa
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Marca la ubicación exacta del inmueble.
            </p>
          </div>

          <button
            type="button"
            disabled={!mapaDisponible}
            onClick={() => setMapaAbierto(v => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiMap size={15} />
            {mapaAbierto ? "Ocultar mapa" : "Ubicar en el mapa"}
          </button>
        </div>

        {mapaAbierto && mapaDisponible && (
          <>
            <MapaUbicacion
              position={posicion}
              onPositionChange={cambiarCoordenadas}
            />

            <p className="text-xs text-slate-500">
              Toca el mapa o arrastra el marcador azul para ajustar la ubicación.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <p>Latitud: <strong>{latitud}</strong></p>
              <p>Longitud: <strong>{longitud}</strong></p>
            </div>
          </>
        )}

        {!mapaDisponible && (
          <p className="text-xs text-slate-500">
            Selecciona una localidad de las sugerencias para habilitar el mapa.
          </p>
        )}
      </div>
    </section>
  );
}
