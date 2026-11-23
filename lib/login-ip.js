import { createHmac } from "node:crypto";

export function obtenerIpHash(request) {
  const ip = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]?.trim();

  if (!ip) {
    throw new Error("IP no disponible");
  }

  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET no configurado");
  }

  return createHmac("sha256", secret)
    .update(`login-ip:${ip}`)
    .digest("hex");
}
