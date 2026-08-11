-- leads-gmm — Políticas RLS y tabla user_profiles
-- Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
--
-- Corrección: id_agente cambiado a uuid (referencia auth.users.id)
-- Roles: admin > supervisor > agente > vendedor (solo lectura vía OTP)

-- Corrección de tipo en leads
ALTER TABLE leads DROP COLUMN IF EXISTS id_agente;
ALTER TABLE leads ADD COLUMN id_agente uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_leads_agente ON leads(id_agente);

-- user_profiles: mapea auth.uid() al rol del sistema
CREATE TABLE IF NOT EXISTS user_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rol         text NOT NULL CHECK (rol IN ('admin','supervisor','agente','vendedor')),
  id_vendedor int REFERENCES vendedores(id),
  nombre      text,
  activo      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT rol FROM user_profiles WHERE id = auth.uid() AND activo = true
$$;

CREATE OR REPLACE FUNCTION get_my_vendor_id()
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id_vendedor FROM user_profiles
  WHERE id = auth.uid() AND activo = true AND rol = 'vendedor'
$$;

-- Políticas (ver apply_migration 002 en historial de Supabase para detalle completo)
