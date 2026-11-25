import { SignJWT, jwtVerify } from "jose";
import { createHash, randomUUID } from "node:crypto";
import { sql } from "@/lib/db";

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

function hashSesion(jti) {
  return createHash("sha256")
    .update(jti, "utf8")
    .digest("hex");
}

export async function crearSesionAgente(agenteId, sessionVersion) {
  const id = String(agenteId);
  const version = String(sessionVersion);

  if (
    !/^[1-9]\d{0,18}$/.test(id) ||
    !/^[1-9]\d{0,18}$/.test(version)
  ) {
    throw new Error("Identificadores de sesion invalidos");
  }

  const jti = randomUUID();
  const jtiHash = hashSesion(jti);

  const expiraEn = new Date(
    Date.now() + AGENTE_COOKIE_OPTIONS.maxAge * 1000
  );

  const token = await new SignJWT({
    rol: "agente",
    agenteId: id,
    sessionVersion: version
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("sistemainmo")
    .setAudience("sistemainmo-agente")
    .setSubject(id)
    .setJti(jti)
    .setExpirationTime(
      Math.floor(expiraEn.getTime() / 1000)
    )
    .sign(secretKey());

  await sql`
    INSERT INTO public.agente_sesiones (
      jti_hash,
      agente_id,
      session_version,
      expira_en
    )
    VALUES (
      ${jtiHash},
      ${id},
      ${version},
      ${expiraEn}
    )
  `;

  return token;
}

export async function verificarSesionAgente(token) {
  if (!token) return null;

  let payload;

  try {
    const resultado = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      issuer: "sistemainmo",
      audience: "sistemainmo-agente"
    });

    payload = resultado.payload;
  } catch {
    return null;
  }

  if (
    payload.rol !== "agente" ||
    typeof payload.agenteId !== "string" ||
    !/^[1-9]\d{0,18}$/.test(payload.agenteId) ||
    payload.sub !== payload.agenteId ||
    typeof payload.sessionVersion !== "string" ||
    !/^[1-9]\d{0,18}$/.test(payload.sessionVersion) ||
    typeof payload.jti !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.jti)
  ) {
    return null;
  }

  const jtiHash = hashSesion(payload.jti);

  const [sesion] = await sql`
    SELECT 1
    FROM public.agente_sesiones
    WHERE jti_hash = ${jtiHash}
      AND agente_id = ${payload.agenteId}
      AND session_version = ${payload.sessionVersion}
      AND revocado_en IS NULL
      AND expira_en > NOW()
    LIMIT 1
  `;

  if (!sesion) return null;

  return {
    id: payload.agenteId,
    sessionVersion: payload.sessionVersion,
    sessionHash: jtiHash
  };
}

export async function revocarSesionAgente(token) {
  const sesion = await verificarSesionAgente(token);

  if (!sesion) return false;

  const [revocada] = await sql`
    UPDATE public.agente_sesiones
    SET revocado_en = NOW()
    WHERE jti_hash = ${sesion.sessionHash}
      AND agente_id = ${sesion.id}
      AND session_version = ${sesion.sessionVersion}
      AND revocado_en IS NULL
    RETURNING jti_hash
  `;

  return Boolean(revocada);
}
