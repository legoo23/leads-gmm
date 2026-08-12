-- Campaña visible a vendedores en su portal
ALTER TABLE campanas
  ADD COLUMN IF NOT EXISTS visible_vendedores boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN campanas.visible_vendedores IS
  'TRUE = aparece en el portal del vendedor como material de apoyo';
