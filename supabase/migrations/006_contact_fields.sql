-- Campos de contacto adicionales: teléfonos y email alternativos
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS telefono_alternativo   text,
  ADD COLUMN IF NOT EXISTS telefono_alternativo_2 text,
  ADD COLUMN IF NOT EXISTS email_alternativo       text;
