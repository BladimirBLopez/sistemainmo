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
      <div className="mx-auto max-w-4xl space-y-6">

        <Link
          href={`/admin/propiedades/${id}`}
          className="text-sm font-medium text-blue-600"
        >
          ← Volver a la ficha
        </Link>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Editar propiedad
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Modifica los datos, características y estados del inmueble.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Código de propiedad: {id}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <FormularioEdicionPropiedad propiedad={inicial} />
        </section>

      </div>
    </PanelShell>
  );
}
