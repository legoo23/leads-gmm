-- Agrega campo en_red al catálogo de médicos para distinguir
-- médicos de nuestra red (referenciables a pacientes sin médico tratante)
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS en_red boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_medicos_en_red ON medicos(en_red) WHERE en_red = true;
