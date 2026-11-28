BEGIN;
CREATE TABLE IF NOT EXISTS public.proyectos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 3 AND 160),
  descripcion text,
  tipo text NOT NULL DEFAULT 'residencial'
    CHECK (tipo IN ('residencial','comercial','lotizacion','otro')),
  departamento text, ciudad text, zona text, direccion text,
  estado text NOT NULL DEFAULT 'planificacion'
    CHECK (estado IN ('planificacion','en_obra','pausado','terminado','cancelado')),
  avance_porcentaje integer NOT NULL DEFAULT 0
    CHECK (avance_porcentaje BETWEEN 0 AND 100),
  presupuesto numeric NOT NULL DEFAULT 0 CHECK (presupuesto >= 0),
  moneda text NOT NULL DEFAULT 'BOB' CHECK (moneda IN ('BOB','USD')),
  fecha_inicio date, fecha_fin_estimada date, fecha_fin_real date,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proveedores (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 2 AND 160),
  tipo text NOT NULL DEFAULT 'proveedor'
    CHECK (tipo IN ('proveedor','contratista','ambos')),
  telefono text, email text, nit text, notas text,
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proyecto_etapas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proyecto_id bigint NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 2 AND 160),
  orden integer NOT NULL DEFAULT 0 CHECK (orden >= 0),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','en_curso','terminada')),
  avance_porcentaje integer NOT NULL DEFAULT 0
    CHECK (avance_porcentaje BETWEEN 0 AND 100),
  fecha_inicio date, fecha_fin date,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS proyecto_etapas_proyecto_idx
  ON public.proyecto_etapas (proyecto_id, orden);

CREATE TABLE IF NOT EXISTS public.proyecto_gastos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proyecto_id bigint NOT NULL REFERENCES public.proyectos(id) ON DELETE RESTRICT,
  etapa_id bigint REFERENCES public.proyecto_etapas(id) ON DELETE SET NULL,
  proveedor_id bigint REFERENCES public.proveedores(id) ON DELETE SET NULL,
  fecha date NOT NULL,
  categoria text NOT NULL CHECK (categoria IN
    ('materiales','mano_de_obra','subcontrato','equipo','permisos','otros')),
  concepto text NOT NULL CHECK (char_length(btrim(concepto)) BETWEEN 2 AND 180),
  monto numeric NOT NULL CHECK (monto >= 0),
  moneda text NOT NULL CHECK (moneda IN ('BOB','USD')),
  comprobante_url text,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS proyecto_gastos_proyecto_idx
  ON public.proyecto_gastos (proyecto_id, fecha DESC);

ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS proyecto_id bigint
  REFERENCES public.proyectos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS propiedades_proyecto_idx
  ON public.propiedades (proyecto_id) WHERE proyecto_id IS NOT NULL;

DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
  WHERE conrelid = 'public.clientes'::regclass
    AND pg_get_constraintdef(oid) LIKE '%roles <@%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.clientes DROP CONSTRAINT %I', c);
  END IF;
  ALTER TABLE public.clientes ADD CONSTRAINT clientes_roles_check
    CHECK (cardinality(roles) > 0 AND roles <@ ARRAY['propietario','comprador',
      'arrendatario','buscador','vendedor','otro','contratista','proveedor']::text[]);
END $$;
COMMIT;
