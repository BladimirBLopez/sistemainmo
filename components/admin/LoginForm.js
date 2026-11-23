"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiLogIn } from "react-icons/fi";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function ingresar(e) {
    e.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store"
      });

      if (!res.ok) {
        setError(res.status === 429
          ? "Demasiados intentos. Intenta más tarde."
          : res.status === 401
            ? "Credenciales incorrectas"
            : "Servicio temporalmente no disponible.");
        return;
      }

      router.replace("/admin");
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
        <label className="block mb-2 text-sm font-medium text-slate-700">
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
      <p className="flex justify-center items-center gap-2 text-xs text-slate-400">
        <FiLock /> Acceso exclusivo para administradores
      </p>
    </form>
  );
}
