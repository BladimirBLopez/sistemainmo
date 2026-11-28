import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import FormularioProyecto from "@/components/admin/FormularioProyecto";

export const dynamic = "force-dynamic";

export default async function NuevoProyectoPage() {
  const store = await cookies();
  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) redirect("/admin/login");

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link href="/admin/proyectos" className="text-sm font-semibold text-brand-600">← Volver a proyectos</Link>
          <h2 className="mt-4 text-2xl font-black text-slate-900">Nuevo proyecto</h2>
        </div>
        <FormularioProyecto />
      </div>
    </PanelShell>
  );
}
