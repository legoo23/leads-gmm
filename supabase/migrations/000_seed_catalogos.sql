-- leads-gmm — Datos iniciales de catálogos
-- Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.

INSERT INTO aseguradoras (nombre, nombre_corto) VALUES
  ('GNP Seguros', 'GNP'), ('AXA Seguros', 'AXA'), ('MAPFRE Seguros', 'MAPFRE'),
  ('MetLife México', 'MetLife'), ('Zurich Seguros', 'Zurich'), ('Seguros Atlas', 'Atlas'),
  ('Seguros BX+', 'BX+'), ('Cigna', 'Cigna'), ('SURA Seguros', 'SURA'),
  ('BBVA Seguros', 'BBVA Seguros'), ('Allianz México', 'Allianz'),
  ('Monterrey New York Life', 'Monterrey NYL'), ('Seguros Inbursa', 'Inbursa'),
  ('Chubb Seguros México', 'Chubb'), ('Quálitas Compañía de Seguros', 'Quálitas'),
  ('Otro', 'Otro')
ON CONFLICT DO NOTHING;

INSERT INTO niveles_comision (nombre, monto, descripcion, orden) VALUES
  ('Estándar',  500.00, 'Nivel base para vendedores nuevos',        1),
  ('Plata',     800.00, 'Vendedores con al menos 5 conversiones',   2),
  ('Oro',      1200.00, 'Vendedores con al menos 15 conversiones',  3),
  ('Élite',    1800.00, 'Vendedores top del programa de referidos', 4)
ON CONFLICT DO NOTHING;
