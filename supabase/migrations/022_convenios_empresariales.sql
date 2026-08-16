-- 022_convenios_empresariales.sql
-- Landing pages de convenio B2B por empresa: slug, logo, servicios, formulario configurable

-- ── Extender tabla empresas ────────────────────────────────────────────────────

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS slug                text UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_path           text,
  ADD COLUMN IF NOT EXISTS descripcion_landing text,
  ADD COLUMN IF NOT EXISTS vigencia_inicio     date,
  ADD COLUMN IF NOT EXISTS vigencia_fin        date,
  ADD COLUMN IF NOT EXISTS campos_formulario   jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Índice único en slug para búsqueda O(log n) desde la landing pública
CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_slug
  ON empresas(slug)
  WHERE slug IS NOT NULL;

-- ── Tabla de servicios por convenio ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS servicios_convenio (
  id              serial       PRIMARY KEY,
  id_empresa      int          NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre          text         NOT NULL,
  descripcion     text,
  icono           text,
  precio_regular  numeric(12,2),
  precio_convenio numeric(12,2),
  pct_descuento   numeric(5,2)
                  GENERATED ALWAYS AS (
                    CASE
                      WHEN precio_regular > 0 AND precio_convenio IS NOT NULL
                      THEN ROUND((1 - precio_convenio / precio_regular) * 100, 1)
                    END
                  ) STORED,
  tipo            text         NOT NULL DEFAULT 'general'
                               CHECK (tipo IN ('general', 'particular')),
  activo          boolean      NOT NULL DEFAULT true,
  orden           int          NOT NULL DEFAULT 0,
  fecha_creacion  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicios_convenio_empresa
  ON servicios_convenio(id_empresa, activo);

-- ── Extender tabla leads ───────────────────────────────────────────────────────

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS id_empresa         int REFERENCES empresas(id) ON DELETE SET NULL;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS datos_adicionales  jsonb;

-- ── RLS en servicios_convenio ──────────────────────────────────────────────────

ALTER TABLE servicios_convenio ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'servicios_convenio'
    AND policyname  = 'service_role acceso total servicios_convenio'
  ) THEN
    CREATE POLICY "service_role acceso total servicios_convenio"
      ON servicios_convenio FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'servicios_convenio'
    AND policyname  = 'auth usuarios leen servicios activos'
  ) THEN
    CREATE POLICY "auth usuarios leen servicios activos"
      ON servicios_convenio FOR SELECT
      TO authenticated USING (activo = true);
  END IF;
END $$;

-- ── Supabase Storage — bucket público para logos ───────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos-convenio',
  'logos-convenio',
  true,
  2097152,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname   = 'logos-convenio public read'
  ) THEN
    CREATE POLICY "logos-convenio public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'logos-convenio');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname   = 'logos-convenio service_role write'
  ) THEN
    CREATE POLICY "logos-convenio service_role write"
      ON storage.objects FOR INSERT
      TO service_role
      WITH CHECK (bucket_id = 'logos-convenio');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname   = 'logos-convenio service_role delete'
  ) THEN
    CREATE POLICY "logos-convenio service_role delete"
      ON storage.objects FOR DELETE
      TO service_role
      USING (bucket_id = 'logos-convenio');
  END IF;
END $$;
