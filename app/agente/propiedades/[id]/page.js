import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";
import FormularioFoto from "@/components/admin/FormularioFoto";
import BotonPortada from "@/components/admin/BotonPortada";

export const dynamic = "force-dynamic";

export default async function FichaPropiedadAgente({ params }) {
  const store = await cookies();
  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  const { id } = await params;
  if (!/^[1-9]\d{0,18}$/.test(id)) notFound();

  const [p] = await sql`
    SELECT p.*
    FROM public.propiedades p
    WHERE p.id = ${id}
      AND EXISTS (
        SELECT 1
        FROM public.agente_propiedades ap
        WHERE ap.agente_id = ${agente.id}
          AND ap.propiedad_id = p.id
      )
    LIMIT 1
  `;

  if (!p) notFound();

  const fotos = await sql`
    SELECT id, secure_url, es_portada
    FROM public.propiedad_imagenes
    WHERE propiedad_id = ${id}
    ORDER BY es_portada DESC, orden, id
    LIMIT 30
  `;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/agente/propiedades" className="text-sm font-semibold text-blue-600">
            ← Mis propiedades
          </Link>
          <Link
            href={`/agente/propiedades/${id}/editar`}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Editar propiedad
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{p.titulo}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {p.tipo} · {p.estado_publicacion}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {[p.departamento, p.ciudad, p.zona].filter(Boolean).join(" · ")}
          </p>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {p.precio != null
              ? `${p.moneda === "BOB" ? "Bs" : "USD"} ${Number(p.precio).toLocaleString("es-BO")}`
              : "Precio no registrado"}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Dormitorios", p.dormitorios],
              ["Baños", p.banos],
              ["Parqueos", p.parqueos],
              ["Terreno", p.superficie_terreno_m2],
              ["Construcción", p.superficie_construida_m2]
            ].filter(([, v]) => v != null).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 font-bold">{String(value)}</p>
              </div>
            ))}
          </div>

          {p.descripcion && (
            <p className="mt-5 whitespace-pre-wrap text-sm text-slate-700">
              {p.descripcion}
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Fotografías ({fotos.length})</h2>

          <FormularioFoto propiedadId={String(p.id)} modo="agente" />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {fotos.map(foto => (
              <div key={String(foto.id)} className="relative aspect-video">
                <Image
                  src={foto.secure_url}
                  alt={p.titulo}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="rounded-xl object-cover"
                />

                {foto.es_portada ? (
                  <span className="absolute left-3 top-3 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Portada
                  </span>
                ) : (
                  <BotonPortada
                    propiedadId={String(p.id)}
                    fotoId={String(foto.id)}
                    modo="agente"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
