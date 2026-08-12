-- 012_vendedores_fields.sql
-- Ampliar tabla vendedores con datos personales y bancarios para pago de comisiones

ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS apellido_paterno    text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS apellido_materno    text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS rfc                 text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS curp                text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS fecha_nacimiento    date;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS telefono_alternativo text;

-- Dirección
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS calle              text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS numero_exterior     text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS colonia             text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS ciudad              text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS estado              text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS codigo_postal       text;

-- Datos bancarios para pago de comisiones
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS banco               text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS titular_cuenta      text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS numero_cuenta       text;
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS clabe               text;   -- 18 dígitos CLABE
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS referencia_pago     text;

ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS notas               text;

-- Índice para búsqueda por activo
CREATE INDEX IF NOT EXISTS idx_vendedores_activo ON vendedores(activo);
