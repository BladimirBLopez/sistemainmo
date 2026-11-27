"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiLock, FiLogIn, FiMail, FiEye, FiEyeOff, FiAlertCircle
} from "react-icons/fi";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function ingresar(evento) {
    evento.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/agente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store"
      });

      if (!respuesta.ok) {
        setError(
          respuesta.status === 429
            ? "Demasiados intentos. Intenta más tarde."
            : respuesta.status === 401
              ? "Correo o contraseña incorrectos."
              : "Servicio temporalmente no disponible."
        );
        return;
      }

      router.replace("/agente");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={ingresar} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <div className="relative">
          <FiMail
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id="email"
            type="email"
            required
            maxLength={180}
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="input py-3 pl-11"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <div className="relative">
          <FiLock
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id="password"
            type={visible ? "text" : "password"}
            required
            maxLength={256}
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            className="input py-3 pl-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {visible ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <FiAlertCircle size={18} className="shrink-0" />
          {error}
        </p>
      )}

      <button type="submit" disabled={cargando} className="btn-primary w-full py-3">
        {cargando ? "Verificando..." : (
          <><FiLogIn size={18} /> Iniciar sesión</>
        )}
      </button>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <FiLock /> Acceso exclusivo para agentes
      </p>
    </form>
  );
}
