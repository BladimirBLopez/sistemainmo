import { NextResponse } from "next/server";
import { obtenerAgenteDeRequest } from "@/lib/autorizacion-agente";
import { reservarConsultaGeoapify } from "@/lib/agente-api-limite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function texto(...valores) {
  return valores.find(
    valor => typeof valor === "string" && valor.trim()
  )?.trim() || "";
}

function obtenerMunicipio(lugar) {
  return texto(
    lugar.municipality,
    lugar.city,
    lugar.town,
    lugar.village
  );
}

function obtenerZona(lugar, ciudad, departamento) {
  const normalizar = valor =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const ciudadNormalizada = normalizar(ciudad);
  const departamentoNormalizado = normalizar(departamento);

  return [
    lugar.suburb,
    lugar.district,
    lugar.neighbourhood,
    lugar.neighborhood,
    lugar.quarter
  ].map(valor => texto(valor)).find(valor => {
    const candidato = normalizar(valor);
    return candidato &&
      candidato !== ciudadNormalizada &&
      candidato !== departamentoNormalizado;
  }) || "";
}

async function consultarGeoapify(url) {
  const respuesta = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });

  if (!respuesta.ok) {
    throw new Error("Error consultando Geoapify");
  }

  return respuesta.json();
}

export async function GET(request) {
  let agente;

  try {
    agente = await obtenerAgenteDeRequest(request);
  } catch {
    return NextResponse.json(
      { error: "No se pudo verificar la sesión" },
      { status: 503 }
    );
  }

  if (!agente) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const parametros = new URL(request.url).searchParams;
  const latRaw = parametros.get("lat");
  const lonRaw = parametros.get("lon");
  const esReverse = latRaw !== null || lonRaw !== null;
  const consulta = parametros.get("q")?.trim();

  let lat = null;
  let lon = null;

  if (esReverse) {
    if (
      latRaw === null || lonRaw === null ||
      !latRaw.trim() || !lonRaw.trim()
    ) {
      return NextResponse.json(
        { error: "Coordenadas incompletas" },
        { status: 400 }
      );
    }

    lat = Number(latRaw);
    lon = Number(lonRaw);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 || lat > 90 ||
      lon < -180 || lon > 180
    ) {
      return NextResponse.json(
        { error: "Coordenadas no válidas" },
        { status: 400 }
      );
    }
  } else if (
    !consulta || consulta.length < 3 || consulta.length > 100
  ) {
    return NextResponse.json({ results: [] });
  }

  const clave = process.env.GEOAPIFY_API_KEY;

  if (!clave) {
    return NextResponse.json(
      { error: "Servicio geográfico no configurado" },
      { status: 503 }
    );
  }

  try {
    const permitido = await reservarConsultaGeoapify(agente.id);

    if (!permitido) {
      return NextResponse.json(
        { error: "Has alcanzado el limite de 20 consultas por minuto." },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": "60"
          }
        }
      );
    }

    if (esReverse) {
      const municipioUrl = new URL(
        "https://api.geoapify.com/v1/geocode/reverse"
      );

      municipioUrl.searchParams.set("lat", String(lat));
      municipioUrl.searchParams.set("lon", String(lon));
      municipioUrl.searchParams.set("type", "city");
      municipioUrl.searchParams.set("countrycodes", "bo");
      municipioUrl.searchParams.set("lang", "es");
      municipioUrl.searchParams.set("limit", "5");
      municipioUrl.searchParams.set("format", "json");
      municipioUrl.searchParams.set("apiKey", clave);

      const zonaUrl = new URL(
        "https://api.geoapify.com/v1/geocode/reverse"
      );

      zonaUrl.searchParams.set("lat", String(lat));
      zonaUrl.searchParams.set("lon", String(lon));
      zonaUrl.searchParams.set("type", "street");
      zonaUrl.searchParams.set("countrycodes", "bo");
      zonaUrl.searchParams.set("lang", "es");
      zonaUrl.searchParams.set("limit", "3");
      zonaUrl.searchParams.set("format", "json");
      zonaUrl.searchParams.set("apiKey", clave);

      const [municipios, calles] = await Promise.all([
        consultarGeoapify(municipioUrl),
        consultarGeoapify(zonaUrl).catch(() => ({ results: [] }))
      ]);

      const lugar = (municipios.results || []).find(
        item => obtenerMunicipio(item)
      );

      if (!lugar) {
        return NextResponse.json(
          {
            error: "No se pudo identificar el municipio. Busca la localidad manualmente."
          },
          { status: 422 }
        );
      }

      const ciudad = obtenerMunicipio(lugar);
      const departamento = texto(lugar.state);

      const zona =
        (calles.results || [])
          .map(item => obtenerZona(item, ciudad, departamento))
          .find(Boolean) ||
        obtenerZona(lugar, ciudad, departamento);

      return NextResponse.json(
        {
          result: {
            placeId: lugar.place_id || "",
            ciudad,
            departamento,
            zona,
            latitud: lat.toFixed(7),
            longitud: lon.toFixed(7),
            etiqueta: [ciudad, departamento]
              .filter(Boolean).join(", ")
          }
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const url = new URL(
      "https://api.geoapify.com/v1/geocode/autocomplete"
    );

    url.searchParams.set("text", consulta);
    url.searchParams.set("type", "city");
    url.searchParams.set("filter", "countrycode:bo");
    url.searchParams.set("lang", "es");
    url.searchParams.set("limit", "7");
    url.searchParams.set("format", "json");
    url.searchParams.set("apiKey", clave);

    const datos = await consultarGeoapify(url);

    const results = (datos.results || [])
      .map(lugar => {
        const ciudad = obtenerMunicipio(lugar);
        const departamento = texto(lugar.state);
        const latitud = Number(lugar.lat);
        const longitud = Number(lugar.lon);

        if (
          !ciudad ||
          !lugar.place_id ||
          !Number.isFinite(latitud) ||
          !Number.isFinite(longitud)
        ) {
          return null;
        }

        return {
          placeId: lugar.place_id,
          ciudad,
          departamento,
          zona: obtenerZona(lugar, ciudad, departamento),
          latitud: String(latitud),
          longitud: String(longitud),
          etiqueta: [ciudad, departamento]
            .filter(Boolean).join(", ")
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "no-store" } }
    );

  } catch {
    return NextResponse.json(
      { error: "Error consultando el servicio geográfico" },
      { status: 503 }
    );
  }
}
