-- Empresas con convenio (CRM B2B)
CREATE TABLE IF NOT EXISTS empresas (
  id                serial PRIMARY KEY,
  nombre            text NOT NULL,
  rfc               text,
  sector            text,
  ejecutivo_cuenta  text,
  telefono          text,
  email             text,
  direccion         text,
  ciudad            text,
  servicios         text,   -- descripción de servicios/coberturas contratadas
  notas             text,
  activa            boolean NOT NULL DEFAULT true,
  fecha_registro    timestamptz NOT NULL DEFAULT now()
);

-- Un contacto por empresa puede marcarse como principal
CREATE TABLE IF NOT EXISTS empresa_contactos (
  id              serial PRIMARY KEY,
  id_empresa      int NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre          text NOT NULL,
  cargo           text,
  telefono        text,
  email           text,
  whatsapp        text,
  principal       boolean NOT NULL DEFAULT false,
  notas           text,
  fecha_creacion  timestamptz NOT NULL DEFAULT now()
);

-- Eventos con QR único — cada evento tiene su código para rastrear leads
CREATE TABLE IF NOT EXISTS empresa_eventos (
  id              serial PRIMARY KEY,
  id_empresa      int NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre          text NOT NULL,
  descripcion     text,
  fecha_evento    date,
  lugar           text,
  codigo_qr       text UNIQUE NOT NULL,
  activo          boolean NOT NULL DEFAULT true,
  fecha_creacion  timestamptz NOT NULL DEFAULT now()
);

-- RLS (heredar el esquema del proyecto)
ALTER TABLE empresas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_eventos  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_users_empresas"
  ON empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_users_contactos"
  ON empresa_contactos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_users_eventos"
  ON empresa_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
