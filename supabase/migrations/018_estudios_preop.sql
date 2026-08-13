-- 018: Estudios preoperatorios por lead (uno a uno)
CREATE TABLE IF NOT EXISTS estudios_preop (
  id              serial PRIMARY KEY,
  id_lead         bigint NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  nombre          text NOT NULL,
  tiene_fisico    text NOT NULL DEFAULT 'pendiente'
                    CHECK (tiene_fisico IN ('pendiente', 'si', 'digital', 'no')),
  fecha_creacion  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE estudios_preop ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_users_estudios_preop" ON estudios_preop
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
