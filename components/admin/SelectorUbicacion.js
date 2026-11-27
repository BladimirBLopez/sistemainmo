"use client";

import { useEffect, useRef, useState } from "react";
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

export default function SelectorUbicacion({ inicial = {}, modo = "admin" }) {
  const rutaApi = modo === "agente" ? "/api/agente/ubicaciones" : "/api/admin/ubicaciones";
  const [departamento, setDepartamento] = useState(
    inicial.departamento || ""
  );

  const [ciudad, setCiudad] = useState(inicial.ciudad || "");
  const [zona, setZona] = useState(inicial.zona || "");
  const [placeId, setPlaceId] = useState(inicial.geo_place_id || "");

  const [latitud, setLatitud] = useState(
    inicial.latitud == null ? "" : String(inicial.latitud)
  );

  const [longitud, setLongitud] = useState(
    inicial.longitud == null ? "" : String(inicial.longitud)
  );

  const [busqueda, setBusqueda] = useState(
    inicial.ciudad || ""
  );

  const [seleccionada, setSeleccionada] = useState(
    Boolean(inicial.ciudad)
  );

  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [error, setError] = useState("");

  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [listaAbierta, setListaAbierta] = useState(false);
  const [activo, setActivo] = useState(-1);
  const contenedor = useRef(null);

  // Buscar municipios y localidades
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
          `${rutaApi}?q=${encodeURIComponent(consulta)}`,
          {
            signal: controlador.signal,
            cache: "no-store"
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            datos.error || "No se pudo buscar la localidad."
          );
        }

        if (vigente) {
          setResultados(datos.results || []);
          setListaAbierta(true);
          setActivo(-1);
          setError("");
        }
      } catch (fallo) {
        if (vigente && fallo.name !== "AbortError") {
          setResultados([]);
          setError(
            fallo.message || "Error buscando la localidad."
          );
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
  }, [busqueda, seleccionada, rutaApi]);

  // Cerrar la lista al tocar fuera
  useEffect(() => {
    function fuera(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) {
        setListaAbierta(false);
      }
    }
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, []);

  function teclado(evento) {
    const visible = listaAbierta && resultados.length > 0;

    if (evento.key === "Escape") {
      setListaAbierta(false);
      setActivo(-1);
      return;
    }

    if (!visible) {
      if (evento.key === "ArrowDown" && resultados.length > 0) {
        evento.preventDefault();
        setListaAbierta(true);
        setActivo(0);
      }
      return;
    }

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setActivo(i => (i + 1) % resultados.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setActivo(i => (i <= 0 ? resultados.length - 1 : i - 1));
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      if (activo >= 0) seleccionar(resultados[activo]);
    }
  }

  // Seleccionar localidad manualmente
  function seleccionar(lugar) {
    setCiudad(lugar.ciudad);
    setDepartamento(lugar.departamento || "");
    setZona(lugar.zona || "");
    setPlaceId(lugar.placeId);

    setLatitud(String(lugar.latitud));
    setLongitud(String(lugar.longitud));

    setBusqueda(lugar.ciudad);
    setSeleccionada(true);
    setResultados([]);
    setMapaAbierto(true);
    setError("");
  }

  // Cambiar localidad
  function cambiarBusqueda(valor) {
    setBusqueda(valor);
    setSeleccionada(false);
    setCiudad("");
    setDepartamento("");
    setPlaceId("");
    setLatitud("");
    setLongitud("");
    setZona("");
    setMapaAbierto(false);
    setError("");
  }

  // Obtener GPS y reconocer automáticamente el municipio
  function usarUbicacionActual() {
    setError("");
    setResultados([]);

    if (!navigator.geolocation) {
      setError("Tu navegador no permite obtener la ubicación GPS.");
      return;
    }

    setObteniendoGps(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const parametros = new URLSearchParams({
            lat: String(coords.latitude),
            lon: String(coords.longitude)
          });

          const respuesta = await fetch(
            `${rutaApi}?${parametros}`,
            { cache: "no-store" }
          );

          const datos = await respuesta.json();

          if (!respuesta.ok || !datos.result) {
            throw new Error(
              datos.error || "No se pudo identificar el municipio."
            );
          }

          const lugar = datos.result;

          setCiudad(lugar.ciudad);
          setDepartamento(lugar.departamento || "");
          setZona(lugar.zona || "");
          setPlaceId(lugar.placeId);

          // Se conservan las coordenadas GPS originales
          setLatitud(coords.latitude.toFixed(7));
          setLongitud(coords.longitude.toFixed(7));

          setBusqueda(lugar.ciudad);
          setSeleccionada(true);
          setResultados([]);
          setMapaAbierto(true);
          setError("");

        } catch (fallo) {
          setError(
            fallo.message || "No se pudo obtener la localidad."
          );
        } finally {
          setObteniendoGps(false);
        }
      },
      fallo => {
        const mensajes = {
          1: "Debes permitir el acceso a tu ubicación.",
          2: "No se pudo determinar tu ubicación GPS.",
          3: "La solicitud GPS tardó demasiado. Inténtalo nuevamente."
        };

        setError(
          mensajes[fallo.code] || "No se pudo obtener tu ubicación."
        );

        setObteniendoGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }

  // Ajustar marcador manualmente
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
    Boolean(ciudad) &&
    posicion &&
    Number.isFinite(posicion.lat) &&
    Number.isFinite(posicion.lng);

  return (
    <section className="space-y-5">

      {/* CAMPO 1: LOCALIDAD / MUNICIPIO */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="localidad-busqueda"
            className="text-sm font-semibold text-slate-700"
          >
            Localidad / municipio *
          </label>

          <button
            type="button"
            onClick={usarUbicacionActual}
            disabled={obteniendoGps}
            className="btn-primary px-3 py-2 text-xs"
          >
            <FiMapPin size={15} />
            {obteniendoGps
              ? "Obteniendo ubicación..."
              : "Usar mi ubicación actual"}
          </button>
        </div>

        <div className="relative" ref={contenedor}>
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              id="localidad-busqueda"
              type="text"
              name="localidad_busqueda"
              value={busqueda}
              onChange={e => cambiarBusqueda(e.target.value)}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={listaAbierta && resultados.length > 0}
              onKeyDown={teclado}
              onFocus={() => setListaAbierta(true)}
              placeholder="Ej. Santa Cruz de la Sierra, Tarija..."
              className="input pl-10 pr-4"
            />

            {cargando && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-600">
                Buscando...
              </span>
            )}
          </div>

          {listaAbierta && resultados.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-[1000] mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              {resultados.map((lugar, indice) => (
                <li key={lugar.placeId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={indice === activo}
                    onClick={() => seleccionar(lugar)}
                    className={`flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left hover:bg-brand-50 ${indice === activo ? "bg-brand-50" : ""}`}
                  >
                    <span className="text-sm font-semibold text-slate-800">
                      {lugar.ciudad}
                    </span>

                    <span className="text-xs text-slate-500">
                      {lugar.departamento
                        ? "Departamento de " + lugar.departamento
                        : "Municipio de Bolivia"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {seleccionada && (
          <p className="mt-2 text-xs font-medium text-emerald-700">
            {departamento
              ? "Departamento: " + departamento
              : "Municipio seleccionado"}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}

        {!seleccionada &&
          busqueda.trim().length > 0 &&
          busqueda.trim().length < 3 && (
            <p className="mt-2 text-xs text-slate-500">
              Escribe al menos 3 caracteres.
            </p>
          )}
      </div>

      {/* CAMPO 2: ZONA / BARRIO */}
      <div>
        <label
          htmlFor="zona"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Zona, barrio o referencia (opcional)
        </label>

        <input
          id="zona"
          name="zona"
          value={zona}
          onChange={e => setZona(e.target.value)}
          maxLength={120}
          placeholder="Ej. Plan 3000, Equipetrol, frente al mercado"
          className="input"
        />

        <p className="mt-1 text-xs text-slate-500">
          Especifica el barrio o una referencia para encontrar el inmueble.
        </p>
      </div>

      {/* DATOS INTERNOS PARA LA BASE DE DATOS */}
      <input type="hidden" name="departamento" value={departamento} />
      <input type="hidden" name="ciudad" value={ciudad} />
      <input type="hidden" name="geo_place_id" value={placeId} />
      <input type="hidden" name="latitud" value={latitud} />
      <input type="hidden" name="longitud" value={longitud} />

      {/* CONSERVAR DIRECCIONES DE REGISTROS ANTIGUOS */}
      <input
        type="hidden"
        name="direccion_privada"
        value={inicial.direccion_privada || ""}
      />

      {/* MAPA */}
      <div className="space-y-3 rounded-xl border border-slate-200 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Ubicación en el mapa
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Marca la zona aproximada del inmueble.
            </p>
          </div>

          <button
            type="button"
            disabled={!mapaDisponible}
            onClick={() => setMapaAbierto(v => !v)}
            className="btn-primary px-3 py-2 text-xs"
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
              Toca el mapa o arrastra el marcador azul para ajustar
              la ubicación.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <p>
                Latitud: <strong>{latitud}</strong>
              </p>
              <p>
                Longitud: <strong>{longitud}</strong>
              </p>
            </div>
          </>
        )}

        {!mapaDisponible && (
          <p className="text-xs text-slate-500">
            Busca una localidad o utiliza tu ubicación GPS para
            habilitar el mapa.
          </p>
        )}
      </div>
    </section>
  );
}
