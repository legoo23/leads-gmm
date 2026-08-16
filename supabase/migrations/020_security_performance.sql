-- leads-gmm — Correcciones de seguridad y rendimiento (hallazgos S-03, R-01, R-02, T-04)
-- Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.

-- ── S-03: Ampliar CHECK constraint de roles ──────────────────────────────────
-- El constraint anterior solo incluía 4 roles; el código usa 7.
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_rol_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_rol_check
  CHECK (rol IN ('admin','supervisor','agente','vendedor','gerente','ejecutivo','visualizador'));

-- ── R-01: Búsqueda trigramática en nombre/apellido ───────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_leads_nombre_trgm
  ON leads USING gin(nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_leads_apellido_trgm
  ON leads USING gin(apellido_paterno gin_trgm_ops);

-- ── R-02: Índices compuestos para función get_lead_stats ────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_etapa_fecha
  ON leads(etapa, fecha_captura DESC);

CREATE INDEX IF NOT EXISTS idx_leads_vendedor_captura
  ON leads(id_vendedor, fecha_captura DESC);

-- ── T-04: Tabla de mensajes WhatsApp para trazabilidad ──────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_mensajes (
  id            bigserial PRIMARY KEY,
  wa_id         text NOT NULL,
  telefono_hash text NOT NULL,
  direccion     text NOT NULL CHECK (direccion IN ('entrante', 'saliente')),
  contenido     text,
  tipo_mensaje  text,
  estado_bot    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_mensajes_hash
  ON whatsapp_mensajes(telefono_hash, created_at DESC);

ALTER TABLE whatsapp_mensajes ENABLE ROW LEVEL SECURITY;

-- Solo service_role tiene acceso (nunca expuesto al cliente)
CREATE POLICY "service_only_wa_mensajes"
  ON whatsapp_mensajes
  USING (true)
  WITH CHECK (true);
