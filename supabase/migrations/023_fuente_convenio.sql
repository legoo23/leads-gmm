-- Agregar 'convenio' como valor válido en leads.fuente
-- (leads desde landing de convenio empresarial /c/[slug])

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_fuente_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_fuente_check
  CHECK (fuente IN ('whatsapp_bot','qr','formulario','llamada','referido','convenio'));
