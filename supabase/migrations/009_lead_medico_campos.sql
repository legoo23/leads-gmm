-- Campos del médico asignado al lead
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS medico_telefono      text,
  ADD COLUMN IF NOT EXISTS medico_email         text,
  ADD COLUMN IF NOT EXISTS medico_especialidad  text,
  ADD COLUMN IF NOT EXISTS medico_en_red        boolean,
  ADD COLUMN IF NOT EXISTS medico_hospitales    text;
