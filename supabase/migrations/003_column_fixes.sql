-- leads-gmm — Correcciones de columnas para alinear con la capa de aplicación
-- Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
--
-- Este script es idempotente — puede ejecutarse múltiples veces sin error.

-- ============================================================================
-- LEADS: columnas cifradas con sufijo _enc
-- ============================================================================

-- Renombrar columnas de datos sensibles al formato _enc (cifrados con AES-256-GCM)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'telefono'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'telefono_enc'
    )
  ) THEN
    ALTER TABLE leads RENAME COLUMN telefono TO telefono_enc;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'email'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'email_enc'
    )
  ) THEN
    ALTER TABLE leads RENAME COLUMN email TO email_enc;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'curp'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'curp_enc'
    )
  ) THEN
    ALTER TABLE leads RENAME COLUMN curp TO curp_enc;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'numero_poliza'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'numero_poliza_enc'
    )
  ) THEN
    ALTER TABLE leads RENAME COLUMN numero_poliza TO numero_poliza_enc;
  END IF;
END $$;

-- Agregar columna nombre_enc si no existe
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nombre_enc text;

-- ============================================================================
-- AUDIT_LOG: agregar columna tabla para identificar la tabla afectada
-- ============================================================================
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS tabla text;

-- ============================================================================
-- CAMPANAS: alinear nombres de columnas con la aplicación
-- ============================================================================

-- procedimiento → procedimiento_target
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campanas' AND column_name = 'procedimiento'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'campanas' AND column_name = 'procedimiento_target'
    )
  ) THEN
    ALTER TABLE campanas RENAME COLUMN procedimiento TO procedimiento_target;
  END IF;
END $$;

-- fecha_inicio → vigencia_inicio
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campanas' AND column_name = 'fecha_inicio'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'campanas' AND column_name = 'vigencia_inicio'
    )
  ) THEN
    ALTER TABLE campanas RENAME COLUMN fecha_inicio TO vigencia_inicio;
  END IF;
END $$;

-- fecha_fin → vigencia_fin
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campanas' AND column_name = 'fecha_fin'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'campanas' AND column_name = 'vigencia_fin'
    )
  ) THEN
    ALTER TABLE campanas RENAME COLUMN fecha_fin TO vigencia_fin;
  END IF;
END $$;

-- Agregar descripción y fecha_creacion si no existen
ALTER TABLE campanas ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE campanas ADD COLUMN IF NOT EXISTS fecha_creacion timestamptz NOT NULL DEFAULT now();

-- ============================================================================
-- MEDICOS: agregar campos hospital (texto) y aseguradoras_aceptadas
-- ============================================================================
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS hospital text;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS aseguradoras_aceptadas text;
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS notas text;

-- ============================================================================
-- Cobertura confirmada en leads (boolean nullable)
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cobertura_confirmada boolean;
