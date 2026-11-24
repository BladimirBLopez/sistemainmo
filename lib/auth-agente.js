import { SignJWT, jwtVerify } from "jose";

export const AGENTE_COOKIE_NAME = "sistemainmo_agente_session";

export const AGENTE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET no configurado");
  }

  return new TextEncoder().encode(secret);
}

export async function crearSesionAgente(agenteId) {
  const id = String(agenteId);

  if (!/^[1-9]\d{0,18}$/.test(id)) {
    throw new Error("ID de agente invalido");
  }

  return new SignJWT({
    rol: "agente",
    agenteId: id
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("sistemainmo")
    .setAudience("sistemainmo-agente")
    .setSubject(id)
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verificarSesionAgente(token) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: "sistemainmo",
      audience: "sistemainmo-agente"
    });

    if (
      payload.rol !== "agente" ||
      typeof payload.agenteId !== "string" ||
      !/^[1-9]\d{0,18}$/.test(payload.agenteId) ||
      payload.sub !== payload.agenteId
    ) {
      return null;
    }

    return { id: payload.agenteId };
  } catch {
    return null;
  }
}
