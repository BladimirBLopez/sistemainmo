import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "sistemainmo_session";

export const COOKIE_OPTIONS = {
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

export async function crearSesion() {
  return new SignJWT({ rol: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("sistemainmo")
    .setAudience("sistemainmo-admin")
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verificarSesion(token) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: "sistemainmo",
      audience: "sistemainmo-admin"
    });
    return payload.rol === "admin";
  } catch {
    return false;
  }
}
