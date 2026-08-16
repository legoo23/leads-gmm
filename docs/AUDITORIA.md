# Modelo de Auditoría — iHelp Médica

> Trazabilidad completa de acciones en el sistema. Requerimiento de cumplimiento para datos médicos y financieros.

---

## ¿Por qué registrar auditoría?

1. **Datos médicos (PII sensible):** Expedientes de pacientes, pólizas GMM, estudios médicos y cartas de autorización son información protegida. La Ley Federal de Protección de Datos Personales (LFPDPPP) requiere trazabilidad de accesos y modificaciones.
2. **Datos financieros:** Las comisiones de vendedores representan obligaciones de pago. El historial de aprobaciones protege al negocio ante reclamaciones.
3. **Acceso a documentos firmados:** Toda descarga de carta de autorización debe registrarse con quién, cuándo y desde dónde.
4. **Detección de anomalías:** Picos inusuales de acceso, cambios de etapa masivos o accesos fuera de horario son señales de alerta.

---

## Esquema de la tabla `audit_log`

```sql
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  accion      text        NOT NULL,   -- 'lead_creado', 'etapa_actualizada', etc.
  tabla       text,                   -- tabla afectada
  id_registro text,                   -- PK del registro afectado
  id_usuario  uuid,                   -- usuario que realizó la acción (NULL = sistema/bot)
  ip          text,                   -- IP del request
  metadata    jsonb,                  -- datos adicionales (etapa anterior/nueva, etc.)
  created_at  timestamptz DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_audit_accion      ON audit_log(accion);
CREATE INDEX idx_audit_tabla       ON audit_log(tabla, id_registro);
CREATE INDEX idx_audit_usuario     ON audit_log(id_usuario);
CREATE INDEX idx_audit_created_at  ON audit_log(created_at DESC);
```

---

## Función de registro (`lib/audit.ts`)

```ts
// Uso estándar en Route Handlers
await logAudit({
  accion:     "etapa_actualizada",
  tabla:      "leads",
  id_registro: leadId,
  id_usuario: user.id,
  ip:         extractIP(req),
  metadata:   { etapa_anterior: "contactado", etapa_nueva: "viable" },
})
```

---

## Catálogo de acciones auditadas

### Módulo: Leads

| Acción | Cuándo se registra | Metadata relevante |
|---|---|---|
| `lead_creado` | Al crear un nuevo lead | fuente, id_vendedor, codigo_referido |
| `etapa_actualizada` | Al cambiar la etapa del pipeline | etapa_anterior, etapa_nueva |
| `lead_asignado` | Al asignar lead a un agente | id_agente_anterior, id_agente_nuevo |
| `lead_actualizado` | Al guardar cambios en el detalle | campos modificados |
| `nota_agregada` | Al agregar una nota de seguimiento | — |
| `lead_exportado` | Al exportar datos a CSV/PDF | filtros aplicados |

### Módulo: Documentos

| Acción | Cuándo se registra | Metadata relevante |
|---|---|---|
| `token_docs_generado` | Al crear el link de subida para el paciente | id_lead, expira_en |
| `documento_subido` | Al recibir un archivo del paciente | nombre_archivo, tamaño, tipo |
| `carta_autorizacion_accedida` | Al generar o acceder a la URL firmada | usuario, ip, url_generada |
| `carta_autorizacion_subida` | Al adjuntar la carta al expediente | ruta en Storage |

### Módulo: Comisiones

| Acción | Cuándo se registra | Metadata relevante |
|---|---|---|
| `comision_generada` | Al convertir un lead (etapa `ganado`) | id_vendedor, monto, id_nivel |
| `comision_aprobada` | Al que admin aprueba una comisión | id_comision, monto |
| `comision_pagada` | Al marcar como pagada | fecha_pago, método |
| `comision_cancelada` | Al cancelar una comisión | motivo |

### Módulo: Vendedores

| Acción | Cuándo se registra | Metadata relevante |
|---|---|---|
| `vendedor_creado` | Al crear un nuevo vendedor | nombre, nivel, codigo_unico |
| `vendedor_actualizado` | Al modificar datos del vendedor | campos modificados |
| `vendedor_desactivado` | Al desactivar un vendedor | — |
| `nivel_cambiado` | Al cambiar el nivel de comisión | nivel_anterior, nivel_nuevo |

### Módulo: Convenios Empresariales

| Acción | Cuándo se registra | Metadata relevante |
|---|---|---|
| `convenio_actualizado` | Al guardar cambios en la landing | slug, campos modificados |
| `servicio_convenio_creado` | Al agregar un servicio | nombre, precios |
| `servicio_convenio_actualizado` | Al editar un servicio | — |
| `servicio_convenio_eliminado` | Al eliminar un servicio | id, nombre |
| `logo_convenio_subido` | Al subir logo de empresa | ruta en Storage |
| `lead_convenio_creado` | Al enviar formulario de landing `/c/[slug]` | slug, id_empresa, fuente |

### Módulo: Admin / Seguridad

| Acción | Cuándo se registra | Metadata relevante |
|---|---|---|
| `usuario_creado` | Al crear usuario del sistema | email, rol |
| `rol_actualizado` | Al cambiar rol de un usuario | rol_anterior, rol_nuevo |
| `usuario_desactivado` | Al deshabilitar acceso | — |
| `config_actualizada` | Al modificar configuración del sistema | sección, campos |

### Sistema / WhatsApp

| Acción | Cuándo se registra | Metadata relevante |
|---|---|---|
| `whatsapp_lead_creado` | Al crear lead desde bot | numero_wa, mensaje |
| `whatsapp_mensaje_enviado` | Al enviar mensaje saliente | plantilla, destinatario |
| `webhook_firma_invalida` | Al rechazar webhook por HMAC inválido | ip, timestamp |

---

## Consultas frecuentes de auditoría

### Ver historial completo de un lead

```sql
SELECT 
  al.created_at,
  al.accion,
  al.metadata,
  al.ip,
  up.nombre AS usuario
FROM audit_log al
LEFT JOIN user_profiles up ON up.id = al.id_usuario
WHERE al.tabla = 'leads'
  AND al.id_registro = '123'
ORDER BY al.created_at DESC;
```

### Accesos a cartas de autorización del último mes

```sql
SELECT 
  al.created_at,
  al.id_registro AS id_lead,
  al.ip,
  up.nombre AS usuario,
  al.metadata->>'url_generada' AS url
FROM audit_log al
LEFT JOIN user_profiles up ON up.id = al.id_usuario
WHERE al.accion = 'carta_autorizacion_accedida'
  AND al.created_at > now() - interval '30 days'
ORDER BY al.created_at DESC;
```

### Actividad inusual — acciones fuera de horario (antes 7am o después 10pm)

```sql
SELECT 
  accion,
  id_registro,
  ip,
  created_at
FROM audit_log
WHERE EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Mexico_City') NOT BETWEEN 7 AND 22
  AND created_at > now() - interval '7 days'
ORDER BY created_at DESC;
```

### Comisiones aprobadas en el mes

```sql
SELECT 
  al.created_at AS fecha_aprobacion,
  al.id_registro AS id_comision,
  (al.metadata->>'monto')::numeric AS monto,
  up.nombre AS aprobado_por
FROM audit_log al
LEFT JOIN user_profiles up ON up.id = al.id_usuario
WHERE al.accion = 'comision_aprobada'
  AND date_trunc('month', al.created_at) = date_trunc('month', now())
ORDER BY al.created_at DESC;
```

### Top IPs con más intentos fallidos de webhook

```sql
SELECT 
  ip,
  COUNT(*) AS intentos,
  MAX(created_at) AS ultimo_intento
FROM audit_log
WHERE accion = 'webhook_firma_invalida'
  AND created_at > now() - interval '24 hours'
GROUP BY ip
ORDER BY intentos DESC
LIMIT 20;
```

---

## Retención y rotación de logs

| Tipo de registro | Retención recomendada |
|---|---|
| Acciones médicas (carta autorización, documentos) | 5 años (LFPDPPP + NOM-004) |
| Transacciones financieras (comisiones) | 5 años (SAT) |
| Accesos y sesiones generales | 1 año |
| Intentos fallidos / seguridad | 90 días |
| Actividad del bot de WhatsApp | 1 año |

> **Nota:** Implementar job de rotación para archivar registros > 1 año en Supabase Storage (NDJSON comprimido) antes de eliminar de la tabla activa. Esto evita que `audit_log` crezca indefinidamente.

---

## RLS en `audit_log`

```sql
-- Solo service_role puede insertar (lo hace el servidor, nunca el cliente)
-- Admin puede leer todos los logs
-- Agentes y supervisores NO tienen acceso directo a audit_log
-- (consultan vía Route Handler con validación de rol)

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full" ON audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_read" ON audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
```

---

## Vista de auditoría para dashboard admin

```sql
CREATE VIEW v_audit_reciente AS
SELECT
  al.id,
  al.created_at,
  al.accion,
  al.tabla,
  al.id_registro,
  al.ip,
  al.metadata,
  up.nombre AS usuario_nombre,
  up.rol   AS usuario_rol
FROM audit_log al
LEFT JOIN user_profiles up ON up.id = al.id_usuario
WHERE al.created_at > now() - interval '30 days'
ORDER BY al.created_at DESC;
```

---

## Checklist de cumplimiento

- [x] Cifrado AES-256-GCM en datos PII (teléfonos, emails, CURP)
- [x] Audit log en cada Route Handler relevante
- [x] URLs firmadas (1 hora) para cartas de autorización — acceso registrado
- [x] Tokens de un solo uso para subida de documentos por paciente
- [x] HMAC-SHA256 en webhook de WhatsApp
- [x] RLS habilitado en todas las tablas
- [x] Rate limiting en formularios públicos (5 req/10 min por IP)
- [x] Honeypot anti-bot en formularios públicos
- [ ] Política de retención y rotación de logs (pendiente implementar)
- [ ] Notificación automática al admin ante actividad anómala (pendiente)
- [ ] Exportación de audit trail en PDF firmado para solicitudes ARCO (pendiente)
- [ ] Aviso de privacidad visible y aceptación registrada por lead (parcial)
