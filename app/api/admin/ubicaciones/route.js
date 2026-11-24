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

  const consulta = new URL(request.url).searchParams.get("q")?.trim();

  if (!consulta || consulta.length < 3 || consulta.length > 100) {
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

    const respuesta = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
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
