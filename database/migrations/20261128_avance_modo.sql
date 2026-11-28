BEGIN;

ALTER TABLE public.proyectos
  ADD COLUMN IF NOT EXISTS avance_modo text NOT NULL DEFAULT 'manual';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proyectos_avance_modo_check'
  ) THEN
    ALTER TABLE public.proyectos
      ADD CONSTRAINT proyectos_avance_modo_check
      CHECK (avance_modo IN ('auto', 'manual'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS proyecto_etapas_proyecto_orden_idx
  ON public.proyecto_etapas (proyecto_id, orden, id);

COMMIT;
