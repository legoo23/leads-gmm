-- 017: Fecha diagnóstico en leads + tabla de pólizas excedentes
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fecha_diagnostico date;

CREATE TABLE IF NOT EXISTS polizas_excedentes (
  id                    serial PRIMARY KEY,
  id_lead               bigint NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  aseguradora_nombre    text,
  tipo_plan             text,
  numero_poliza         text,
  numero_certificado    text,
  nombre_titular        text,
  vigencia_inicio       date,
  vigencia_fin          date,
  suma_asegurada        numeric(12,2),
  moneda                text NOT NULL DEFAULT 'MXN',
  deducible             numeric(10,2),
  coaseguro_pct         numeric(5,2),
  tope_coaseguro        numeric(10,2),
  periodo_espera_activo boolean,
  notas                 text,
  fecha_creacion        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE polizas_excedentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_users_polizas_excedentes" ON polizas_excedentes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
