import { NextResponse } from "next/server";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
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

  if (esReverse) {
    if (
      latRaw === null ||
      lonRaw === null ||
      latRaw.trim() === "" ||
      lonRaw.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Coordenadas incompletas" },
        { status: 400 }
      );
    }

    const lat = Number(latRaw);
    const lon = Number(lonRaw);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return NextResponse.json(
        { error: "Coordenadas no válidas" },
        { status: 400 }
      );
    }
  } else if (!consulta || consulta.length < 3 || consulta.length > 100) {
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
    let url;

    if (esReverse) {
      const lat = Number(latRaw);
      const lon = Number(lonRaw);

      url = new URL(
        "https://api.geoapify.com/v1/geocode/reverse"
      );

      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));
      url.searchParams.set("format", "json");
      url.searchParams.set("lang", "es");
      url.searchParams.set("limit", "1");
      url.searchParams.set("apiKey", clave);

      const respuesta = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000)
      });

      if (!respuesta.ok) {
        return NextResponse.json(
          { error: "No se pudo reconocer el municipio mediante GPS" },
          { status: 502 }
        );
      }

      const datos = await respuesta.json();
      const lugar = datos.results?.[0];

      if (!lugar) {
        return NextResponse.json(
          { error: "No se encontró una localidad para estas coordenadas" },
          { status: 404 }
        );
      }

      const ciudad =
        lugar.city ||
        lugar.town ||
        lugar.village ||
        lugar.municipality ||
        lugar.name ||
        "";

      const departamento =
        lugar.state ||
        lugar.state_district ||
        "";

      if (!ciudad || !lugar.place_id) {
        return NextResponse.json(
          { error: "No se pudo identificar el municipio. Busca la localidad manualmente." },
          { status: 422 }
        );
      }

      return NextResponse.json(
        {
          result: {
            placeId: lugar.place_id,
            ciudad,
            departamento,
            latitud: String(lat),
            longitud: String(lon),
            etiqueta:
              lugar.formatted ||
              [ciudad, departamento, "Bolivia"]
                .filter(Boolean)
                .join(", ")
          }
        },
        {
          headers: { "Cache-Control": "no-store" }
        }
      );
    }

    // Búsqueda manual de localidades de Bolivia
    url = new URL(
      "https://api.geoapify.com/v1/geocode/autocomplete"
    );

    url.searchParams.set("text", consulta);
    url.searchParams.set("type", "city");
    url.searchParams.set("filter", "countrycode:bo");
    url.searchParams.set("lang", "es");
    url.searchParams.set("limit", "7");
    url.searchParams.set("format", "json");
    url.searchParams.set("apiKey", clave);

    const respuesta = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    if (!respuesta.ok) {
      return NextResponse.json(
        { error: "No se pudo consultar la localidad" },
        { status: 502 }
      );
    }

    const datos = await respuesta.json();

    const results = (datos.results || [])
      .map(lugar => {
        const ciudad =
          lugar.city ||
          lugar.town ||
          lugar.village ||
          lugar.municipality ||
          lugar.name ||
          "";

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
          departamento: lugar.state || "",
          latitud: String(lugar.lat),
          longitud: String(lugar.lon),
          etiqueta: lugar.formatted || ciudad
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
