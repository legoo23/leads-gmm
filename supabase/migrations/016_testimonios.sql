-- Testimonios visibles en la landing page pública
CREATE TABLE IF NOT EXISTS testimonios (
  id              serial PRIMARY KEY,
  nombre          text NOT NULL,          -- nombre del paciente (o alias)
  detalle         text,                   -- ej: "Colecistectomía • GNP Seguros"
  texto           text NOT NULL,          -- cuerpo del testimonio
  estrellas       smallint NOT NULL DEFAULT 5 CHECK (estrellas BETWEEN 1 AND 5),
  activo          boolean NOT NULL DEFAULT true,
  orden           int NOT NULL DEFAULT 0, -- menor = aparece primero
  fecha_creacion  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;

-- Solo usuarios autenticados pueden gestionar testimonios
CREATE POLICY "auth_users_testimonios"
  ON testimonios FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Semilla inicial con los tres testimonios del HTML original
INSERT INTO testimonios (nombre, detalle, texto, estrellas, activo, orden) VALUES
(
  'María González',
  'Colecistectomía • GNP Seguros',
  'Pensé que iba a pagar una fortuna por la cirugía. Gestionaron todo, no dejé depósito y el seguro pagó casi todo. ¡Súper recomendados!',
  5, true, 1
),
(
  'Carlos Mendoza',
  'Hernia Inguinal • AXA',
  'Me querían cobrar coaseguro doble. iHelp Medica revisó mi póliza, peleó con la aseguradora y me consiguieron el médico en red. Gracias totales.',
  5, true, 2
),
(
  'Sofía Hernández',
  'Artroscopia • MetLife',
  'La atención fue impecable. Me programaron la cirugía de rodilla en 3 días y el asesor me acompañó al hospital. No sentí el proceso administrativo.',
  5, true, 3
);
