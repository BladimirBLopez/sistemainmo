import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verificarSesion } from "@/lib/auth";
import PanelShell from "@/components/admin/PanelShell";
import FormularioCampana from "@/components/admin/FormularioCampana";

export const dynamic = "force-dynamic";

export default async function NuevaCampanaPage() {
  const store = await cookies();

  if (!(await verificarSesion(store.get(COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  return (
    <PanelShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href="/admin/marketing"
            className="text-sm font-semibold text-brand-600"
          >
            ← Volver a Marketing
          </Link>

          <h2 className="mt-4 text-2xl font-black text-slate-900">
            Nueva campaña
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Registra y organiza una nueva campaña comercial o publicitaria.
          </p>
        </div>

        <FormularioCampana />
      </div>
    </PanelShell>
  );
}
