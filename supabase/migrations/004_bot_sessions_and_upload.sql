-- leads-gmm — Bot sessions, upload tokens, campos de internamiento
-- Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
-- Idempotente — puede ejecutarse múltiples veces sin error.

-- ============================================================================
-- LEADS: campos de internamiento y seguimiento hospitalario
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo_ingreso        text CHECK (tipo_ingreso IN ('urgencias','programado'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS es_accidente        boolean;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fecha_inicio_sintomas text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mecanismo_ingreso   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS familiar_nombre     text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS familiar_telefono   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valorado_medico_previo boolean;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS atenciones_previas_sgmm boolean;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS antecedentes_enfermedad text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS numero_episodio     text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS numero_siniestro    text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS folio_programacion  text;

-- ============================================================================
-- CAMPAÑAS: código único para QR (flujo empresa en bot)
-- ============================================================================
ALTER TABLE campanas ADD COLUMN IF NOT EXISTS codigo_unico text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_campanas_codigo ON campanas(codigo_unico) WHERE codigo_unico IS NOT NULL;

-- ============================================================================
-- WHATSAPP_SESSIONS: estado de conversación por número de teléfono
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id              serial primary key,
  telefono_hash   text not null unique,
  wa_id           text not null,
  estado          text not null default 'inicio',
  tipo_flujo      text CHECK (tipo_flujo IN ('asesor','empresa','sin_codigo')),
  datos           jsonb not null default '{}',
  codigo_referido text,
  id_vendedor     int references vendedores(id),
  id_campana      int references campanas(id),
  id_lead         bigint references leads(id),
  updated_at      timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_wa_sessions_tel ON whatsapp_sessions(telefono_hash);
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_all_wa_sessions" ON whatsapp_sessions;
CREATE POLICY "svc_all_wa_sessions" ON whatsapp_sessions TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- UPLOAD_TOKENS: links temporales de carga de documentos (48 h)
-- ============================================================================
CREATE TABLE IF NOT EXISTS upload_tokens (
  id              serial primary key,
  token           uuid not null unique default gen_random_uuid(),
  id_lead         bigint not null references leads(id) on delete cascade,
  creado_por      text,
  expires_at      timestamptz not null,
  activo          boolean not null default true,
  docs_requeridos jsonb not null default '["poliza","ine"]',
  created_at      timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_upload_tokens_lead  ON upload_tokens(id_lead);
CREATE INDEX IF NOT EXISTS idx_upload_tokens_token ON upload_tokens(token);
ALTER TABLE upload_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_all_upload_tokens" ON upload_tokens;
CREATE POLICY "svc_all_upload_tokens" ON upload_tokens TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- EMPRESAS_PROSPECTOS: empresas en proceso de prospección
-- ============================================================================
CREATE TABLE IF NOT EXISTS empresas_prospectos (
  id              serial primary key,
  nombre_empresa  text not null,
  nombre_contacto text,
  cargo           text,
  telefono        text,
  email           text,
  num_colaboradores int,
  aseguradora     text,
  id_aseguradora  int references aseguradoras(id),
  fuente          text CHECK (fuente IN ('whatsapp_bot','llamada','visita','referido','otro')),
  codigo_referido text,
  id_campana      int references campanas(id),
  estado          text not null default 'prospecto'
                  CHECK (estado IN ('prospecto','contactado','cita_agendada','campana_realizada','convertido')),
  id_agente       text,
  notas           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
ALTER TABLE empresas_prospectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "svc_all_empresas_prospectos" ON empresas_prospectos;
CREATE POLICY "svc_all_empresas_prospectos" ON empresas_prospectos TO service_role USING (true) WITH CHECK (true);
