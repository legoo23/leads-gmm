-- PADECIMIENTOS / HISTORIA CLÍNICA
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS diagnostico_principal     text,
  ADD COLUMN IF NOT EXISTS diagnosticos_secundarios  text,
  ADD COLUMN IF NOT EXISTS cirugias_previas          boolean,
  ADD COLUMN IF NOT EXISTS cirugias_previas_desc     text,
  ADD COLUMN IF NOT EXISTS tiene_medico_tratante     boolean,
  ADD COLUMN IF NOT EXISTS medico_tratante_nombre    text,
  ADD COLUMN IF NOT EXISTS notas_clinicas            text;

-- PROCEDIMIENTO (campos faltantes)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS fecha_tentativa           date,
  ADD COLUMN IF NOT EXISTS hospital_sugerido         text,
  ADD COLUMN IF NOT EXISTS medico_asignado_nombre    text,
  ADD COLUMN IF NOT EXISTS estancia_estimada_dias    int,
  ADD COLUMN IF NOT EXISTS notas_procedimiento       text;

-- PÓLIZA GMM (campos faltantes)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tipo_plan                 text CHECK (tipo_plan IN ('individual','familiar','colectivo')),
  ADD COLUMN IF NOT EXISTS numero_certificado        text,
  ADD COLUMN IF NOT EXISTS vigencia_original_inicio  date,
  ADD COLUMN IF NOT EXISTS moneda                    text DEFAULT 'MXN',
  ADD COLUMN IF NOT EXISTS tope_coaseguro            numeric(10,2),
  ADD COLUMN IF NOT EXISTS periodo_espera_activo     boolean,
  ADD COLUMN IF NOT EXISTS nombre_titular_poliza     text;

-- COBERTURA Y EXCLUSIONES (campos faltantes)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS cubre_cirugia             boolean,
  ADD COLUMN IF NOT EXISTS requiere_preautorizacion  boolean,
  ADD COLUMN IF NOT EXISTS cubre_anestesiologo       boolean,
  ADD COLUMN IF NOT EXISTS cubre_estudios_preop      boolean,
  ADD COLUMN IF NOT EXISTS cubre_honorarios          boolean,
  ADD COLUMN IF NOT EXISTS cubre_hospitalizacion     boolean,
  ADD COLUMN IF NOT EXISTS condiciones_excluidas     text,
  ADD COLUMN IF NOT EXISTS es_preexistencia          boolean,
  ADD COLUMN IF NOT EXISTS fecha_autorizacion        date,
  ADD COLUMN IF NOT EXISTS contacto_aseguradora_nombre   text,
  ADD COLUMN IF NOT EXISTS contacto_aseguradora_telefono text,
  ADD COLUMN IF NOT EXISTS notas_validacion          text;

-- ROLES NUEVOS
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_rol_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_rol_check
  CHECK (rol IN ('admin','gerente','ejecutivo','visualizador','vendedor'));
UPDATE user_profiles SET rol = 'gerente'   WHERE rol = 'supervisor';
UPDATE user_profiles SET rol = 'ejecutivo' WHERE rol = 'agente';
