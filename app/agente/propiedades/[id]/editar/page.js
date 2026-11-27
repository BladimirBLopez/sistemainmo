import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";
import FormularioEdicionPropiedad from "@/components/admin/FormularioEdicionPropiedad";

export const dynamic = "force-dynamic";

export default async function EditarPropiedadAgente({ params }) {
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

  const valor = v => v == null ? "" : String(v);

  const inicial = {
    id: String(p.id),
    titulo: p.titulo,
    tipo: p.tipo,
    descripcion: valor(p.descripcion),
    departamento: valor(p.departamento),
    ciudad: valor(p.ciudad),
    zona: valor(p.zona),
    direccion_privada: valor(p.direccion_privada),
    geo_place_id: valor(p.geo_place_id),
    latitud: valor(p.latitud),
    longitud: valor(p.longitud),
    estado_publicacion: p.estado_publicacion,
    estado_comercial: p.estado_comercial,
    tipo_operacion: valor(p.tipo_operacion),
    precio: valor(p.precio),
    moneda: valor(p.moneda),
    dormitorios: valor(p.dormitorios),
    banos: valor(p.banos),
    parqueos: valor(p.parqueos),
    superficie_terreno_m2: valor(p.superficie_terreno_m2),
    superficie_construida_m2: valor(p.superficie_construida_m2)
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/agente/propiedades/${id}`}
          className="mb-4 inline-block text-sm font-semibold text-brand-600"
        >
          ← Volver a la ficha
        </Link>
        <FormularioEdicionPropiedad propiedad={inicial} modo="agente" />
      </div>
    </main>
  );
}
