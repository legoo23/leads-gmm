-- Campo fuente específica para trazabilidad de canal
-- Ej: Instagram, Facebook, WhatsApp personal, Recomendación de médico, etc.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS fuente_especifica text;
