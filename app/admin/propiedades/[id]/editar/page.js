import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import { sql } from "@/lib/db";
import PanelShell from "@/components/admin/PanelShell";
import FormularioEdicionPropiedad from "@/components/admin/FormularioEdicionPropiedad";

export const dynamic = "force-dynamic";

export default async function EditarPropiedadPage({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    redirect("/admin/login");
  }

  const { id } = await params;

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    notFound();
  }

  const [propiedad] = await sql`
    SELECT
      id, titulo, tipo, descripcion,
      departamento, ciudad, zona, direccion_privada,
      geo_place_id, latitud, longitud,
      estado_publicacion, estado_comercial,
      tipo_operacion, precio, moneda,
      dormitorios, banos, parqueos,
      superficie_terreno_m2, superficie_construida_m2
    FROM public.propiedades
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!propiedad) notFound();

  const valor = dato => dato == null ? "" : String(dato);

  const inicial = {
    id: String(propiedad.id),
    titulo: propiedad.titulo,
    tipo: propiedad.tipo,
    descripcion: valor(propiedad.descripcion),
    departamento: valor(propiedad.departamento),
    ciudad: valor(propiedad.ciudad),
    zona: valor(propiedad.zona),
    direccion_privada: valor(propiedad.direccion_privada),
    geo_place_id: valor(propiedad.geo_place_id),
    latitud: valor(propiedad.latitud),
    longitud: valor(propiedad.longitud),
    estado_publicacion: propiedad.estado_publicacion,
    estado_comercial: propiedad.estado_comercial,
    tipo_operacion: valor(propiedad.tipo_operacion),
    precio: valor(propiedad.precio),
    moneda: valor(propiedad.moneda),
    dormitorios: valor(propiedad.dormitorios),
    banos: valor(propiedad.banos),
    parqueos: valor(propiedad.parqueos),
    superficie_terreno_m2: valor(propiedad.superficie_terreno_m2),
    superficie_construida_m2: valor(propiedad.superficie_construida_m2)
  };

  return (
    <PanelShell>
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          href={`/admin/propiedades/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800"
        >
          ← Volver a la ficha del inmueble
        </Link>

        <FormularioEdicionPropiedad propiedad={inicial} />
      </div>
    </PanelShell>
  );
}
