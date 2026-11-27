"use client";

import { useState } from "react";

const NUMERO = "59169356292";

const PREGUNTAS = [
  { id: "p1", grupo: "Negocio", texto: "1. ¿Venden solo lo que construyen o también propiedades de terceros?", tipo: "opciones", opciones: ["Solo lo que construimos", "También de terceros", "Ambas cosas"] },
  { id: "p2", grupo: "Negocio", texto: "2. ¿Qué venden? (puede marcar varias)", tipo: "multiple", opciones: ["Casas", "Departamentos", "Lotes", "Locales", "Oficinas"] },
  { id: "p3", grupo: "Negocio", texto: "3. ¿También alquilan?", tipo: "opciones", opciones: ["Solo venta", "Venta y alquiler", "Solo alquiler"] },
  { id: "p4", grupo: "Negocio", texto: "4. ¿Tienen proyectos con varias unidades (edificio, urbanización)? ¿Cuántos activos hoy?", tipo: "texto" },
  { id: "p5", grupo: "Cobros", texto: "5. ¿Cómo cobran? (puede marcar varias)", tipo: "multiple", opciones: ["Contado", "Cuotas", "Reserva con anticipo", "Crédito bancario"] },
  { id: "p6", grupo: "Cobros", texto: "6. ¿Quiere registrar los pagos en el sistema o solo el estado (reservada, vendida)?", tipo: "opciones", opciones: ["Registrar pagos", "Solo el estado", "No estoy seguro"] },
  { id: "p7", grupo: "Agentes", texto: "7. ¿Cuántos agentes tendrá y cómo ganan comisión (fija o porcentaje)?", tipo: "texto" },
  { id: "p8", grupo: "Agentes", texto: "8. ¿Cada agente ve solo sus prospectos o todos los del equipo?", tipo: "opciones", opciones: ["Solo los suyos", "Todos los del equipo"] },
  { id: "p9", grupo: "Sistema", texto: "9. ¿Qué quiere ver primero?", tipo: "opciones", opciones: ["La web para clientes", "Los prospectos", "Las visitas", "Reportes"] },
  { id: "p10", grupo: "Sistema", texto: "10. ¿Qué usan hoy para organizarse?", tipo: "opciones", opciones: ["Excel", "WhatsApp", "Cuaderno", "Nada"] },
  { id: "p11", grupo: "Extra", texto: "11. ¿Algo más que quiera que tenga el sistema?", tipo: "texto" }
];

export default function FormularioCuestionario() {
  const [resp, setResp] = useState({});
  const [aviso, setAviso] = useState("");

  function poner(id, valor) {
    setResp(a => ({ ...a, [id]: valor }));
  }

  function alternar(id, opcion) {
    setResp(a => {
      const actual = a[id] || [];
      return {
        ...a,
        [id]: actual.includes(opcion)
          ? actual.filter(x => x !== opcion)
          : [...actual, opcion]
      };
    });
  }

  function enviar(evento) {
    evento.preventDefault();
    const sin = PREGUNTAS.filter(p => {
      const r = resp[p.id];
      return !r || (Array.isArray(r) ? r.length === 0 : !String(r).trim());
    });
    if (sin.length > 0) {
      setAviso("Faltan responder: " + sin.map(p => p.texto.split(".")[0]).join(", "));
      return;
    }
    setAviso("");
    const lineas = PREGUNTAS.map(p => {
      const r = resp[p.id];
      return p.texto + "\nR: " + (Array.isArray(r) ? r.join(", ") : String(r).trim());
    });
    const mensaje = "Cuestionario Bolivia Market\n\n" + lineas.join("\n\n");
    window.location.href =
      "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(mensaje);
  }

  return (
    <form onSubmit={enviar} className="mt-6 space-y-5">
      {PREGUNTAS.map(p => (
        <section key={p.id} className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="label">{p.texto}</p>

          {p.tipo === "texto" && (
            <textarea
              className="input"
              rows={3}
              value={resp[p.id] || ""}
              onChange={e => poner(p.id, e.target.value)}
              aria-label={p.texto}
            />
          )}

          {p.tipo === "opciones" && (
            <div className="space-y-2">
              {p.opciones.map(o => (
                <label key={o} className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={p.id}
                    checked={resp[p.id] === o}
                    onChange={() => poner(p.id, o)}
                  />
                  {o}
                </label>
              ))}
            </div>
          )}

          {p.tipo === "multiple" && (
            <div className="space-y-2">
              {p.opciones.map(o => (
                <label key={o} className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={(resp[p.id] || []).includes(o)}
                    onChange={() => alternar(p.id, o)}
                  />
                  {o}
                </label>
              ))}
            </div>
          )}
        </section>
      ))}

      {aviso && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {aviso}
        </p>
      )}

      <button type="submit" className="btn-primary w-full px-5 py-3">
        Enviar por WhatsApp
      </button>
    </form>
  );
}
