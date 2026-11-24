import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import FormularioCliente from "@/components/admin/FormularioCliente";

export const dynamic = "force-dynamic";

export default async function NuevoClientePage() {
  const cookieStore = await cookies();

  if (!(await verificarSesion(cookieStore.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Registrar cliente
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Registra una persona y clasifica su relación con la inmobiliaria.
          </p>
        </div>

        <FormularioCliente />
      </div>
    </PanelShell>
  );
}
