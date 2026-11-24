CREATE TABLE IF NOT EXISTS public.gemini_api_limites (
  perfil TEXT NOT NULL
    CHECK (perfil IN ('admin', 'agente')),

  usuario_id TEXT NOT NULL,

  solicitudes INTEGER NOT NULL DEFAULT 0
    CHECK (solicitudes >= 0),

  ventana_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT gemini_api_limites_pk
    PRIMARY KEY (perfil, usuario_id)
);

COMMENT ON TABLE public.gemini_api_limites IS
  'Control independiente de consumo de Gemini por perfil y usuario.';
