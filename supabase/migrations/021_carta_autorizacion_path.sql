-- T-05: Almacenar el path interno del archivo en lugar de la URL firmada de larga duración.
-- carta_autorizacion_url se conserva para datos históricos (backward compat).
-- Las nuevas subidas escriben en carta_autorizacion_path; el handler genera URLs firmadas de 1h.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS carta_autorizacion_path text;
