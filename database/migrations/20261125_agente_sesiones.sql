CREATE TABLE IF NOT EXISTS public.agente_sesiones (
  jti_hash TEXT PRIMARY KEY,
  agente_id TEXT NOT NULL,
  session_version TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_en TIMESTAMPTZ NOT NULL,
  revocado_en TIMESTAMPTZ,

  CONSTRAINT agente_sesiones_hash_valido
    CHECK (jti_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX IF NOT EXISTS agente_sesiones_agente_activa_idx
ON public.agente_sesiones (agente_id, expira_en)
WHERE revocado_en IS NULL;
