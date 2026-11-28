BEGIN;
ALTER TABLE public.agente_sesiones
  ALTER COLUMN agente_id TYPE bigint USING agente_id::bigint;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conname = 'agente_sesiones_agente_fk') THEN
    ALTER TABLE public.agente_sesiones
      ADD CONSTRAINT agente_sesiones_agente_fk
      FOREIGN KEY (agente_id) REFERENCES public.agentes(id)
      ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.propiedades
  ALTER COLUMN precio SET NOT NULL,
  ALTER COLUMN moneda SET NOT NULL,
  ALTER COLUMN tipo_operacion SET NOT NULL;
COMMIT;
