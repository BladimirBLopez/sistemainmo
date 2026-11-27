import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AGENTE_COOKIE_NAME } from "@/lib/auth-agente";
import { obtenerAgenteActivo } from "@/lib/autorizacion-agente";
import FormularioLead from "@/components/leads/FormularioLead";

export const dynamic = "force-dynamic";

export default async function NuevoLeadAgente() {
  const store = await cookies();
  const agente = await obtenerAgenteActivo(
    store.get(AGENTE_COOKIE_NAME)?.value
  );

  if (!agente) redirect("/agente/login");

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link href="/agente/leads" className="text-sm font-semibold text-brand-600">
          ← Mis Leads
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Captar prospecto</h1>
          <p className="mt-2 text-sm text-slate-500">
            Registra una nueva oportunidad comercial en tu cartera.
          </p>
        </div>
        <FormularioLead modo="agente" />
      </div>
    </main>
  );
}
