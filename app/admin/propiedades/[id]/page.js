import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioFoto from "@/components/admin/FormularioFoto";
import BotonPortada from "@/components/admin/BotonPortada";

export const dynamic = "force-dynamic";

export default async function DetallePropiedad({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  const [propiedad] = await sql`
    SELECT id, titulo, tipo, descripcion,
           ciudad, zona, estado_publicacion
    FROM public.propiedades
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!propiedad) notFound();

  const fotos = await sql`
    SELECT id, secure_url, es_portada
    FROM public.propiedad_imagenes
    WHERE propiedad_id = ${id}
    ORDER BY es_portada DESC, orden, id
    LIMIT 30
  `;

  return (
    <PanelShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/admin/propiedades"
          className="text-sm font-medium text-blue-600"
        >
          ← Volver a propiedades
        </Link>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            {propiedad.titulo}
          </h2>

          <p className="mt-2 text-slate-500">
            {propiedad.tipo} · {propiedad.estado_publicacion}
          </p>

          <p className="mt-3 text-sm text-slate-600">
            {[propiedad.zona, propiedad.ciudad]
              .filter(Boolean).join(", ") || "Ubicación no registrada"}
          </p>

          {propiedad.descripcion && (
            <p className="mt-4 whitespace-pre-wrap text-slate-700">
              {propiedad.descripcion}
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900">
            Fotografías ({fotos.length})
          </h3>

          <FormularioFoto propiedadId={String(propiedad.id)} />

          {fotos.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Esta propiedad todavía no tiene fotografías.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {fotos.map((foto) => (
                <div key={String(foto.id)} className="relative aspect-video">
                  <Image
                    src={foto.secure_url}
                    alt={propiedad.titulo}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="rounded-xl object-cover"
                  />
                  {foto.es_portada ? (
                    <span className="absolute left-3 top-3 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                      Portada
                    </span>
                  ) : (
                    <BotonPortada
                      propiedadId={String(propiedad.id)}
                      fotoId={String(foto.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
