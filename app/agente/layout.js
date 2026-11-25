import PanelShellAgente from "@/components/agente/PanelShellAgente";

export default function AgenteLayout({ children }) {
  return (
    <PanelShellAgente>
      {children}
    </PanelShellAgente>
  );
}
