"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiLogIn } from "react-icons/fi";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Correo electrónico
        </label>
        <input
          type="email"
          required
          maxLength={180}
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="w-full rounded-xl border-slate-300"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <input
          type="password"
          required
          maxLength={256}
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Ingresa tu contraseña"
          className="w-full rounded-xl border-slate-300"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {cargando ? "Verificando..." : (
          <><FiLogIn /> Iniciar sesión</>
        )}
      </button>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <FiLock /> Acceso exclusivo para agentes
      </p>
    </form>
  );
}
