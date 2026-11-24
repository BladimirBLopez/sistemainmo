import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import FormularioAgente from "@/components/admin/FormularioAgente";

export const dynamic = "force-dynamic";

export default async function NuevoAgentePage() {
  const cookieStore = await cookies();

  if (!(await verificarSesion(cookieStore.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Registrar agente
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Crea una cuenta individual para acceder al sistema inmobiliario.
          </p>
        </div>
        <FormularioAgente />
      </div>
    </PanelShell>
  );
}
