import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FiArrowLeft, FiHome } from "react-icons/fi";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import FormularioPropiedad from "@/components/admin/FormularioPropiedad";

export const dynamic = "force-dynamic";

export default async function NuevaPropiedadPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verificarSesion(token))) {
    redirect("/admin/login");
  }

  return (
    <PanelShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/admin/propiedades"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
        >
          <FiArrowLeft /> Volver a propiedades
        </Link>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FiHome size={28} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Nueva propiedad
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Registra un inmueble en el sistema.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900">
            Datos de la propiedad
          </h3>
          <div className="mt-6">
            <FormularioPropiedad />
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
