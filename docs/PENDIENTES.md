# Pendientes y Mejoras — iHelp Médica

> Backlog ordenado por prioridad. Actualizado al 2026-08-16.

---

## Estado del sistema hoy

| Módulo | Estado |
|---|---|
| Pipeline de leads (lista + filtros) | ✅ Completo |
| Formulario de lead completo (7 secciones) | ✅ Completo |
| Sistema de vendedores + QR + comisiones | ✅ Completo |
| Portal de vendedores (OTP) | ✅ Completo |
| Bot de WhatsApp (captura básica) | ✅ Completo |
| Catálogo de médicos (16k+) | ✅ Completo |
| Módulo de empresas + convenios con landing | ✅ Completo |
| Hub de documentos (subida por token) | ✅ Completo |
| Carta de autorización (URL firmada + audit) | ✅ Completo |
| CAPTCHA matemático en canvas | ✅ Completo |
| Cifrado PII + licencia RSA + audit log | ✅ Completo |
| Seguridad: HMAC, rate limit, honeypot | ✅ Completo |
| Backup automático de BD + cifrado de secretos | ✅ Completo |
| Atribución `?ref=` en landing principal | ✅ Completo |

---

## Pendientes — Alta prioridad

### P-01 — Kanban visual del pipeline
**Qué:** Vista de tablero con columnas por etapa (drag & drop para mover leads).
**Por qué:** Los agentes en campo prefieren vista visual para el seguimiento diario. La vista lista existe pero el Kanban mejora la experiencia.
**Archivos:** `app/(auth)/leads/page.tsx` — agregar toggle vista lista/kanban.

### P-02 — Número de WhatsApp de producción
**Qué:** Registrar el número real de la empresa en Meta Business Manager.
**Por qué:** Actualmente el bot solo funciona con el número de prueba (máx 5 contactos). Sin esto, el bot no puede operar en producción.
**Pendiente externo:** Verificación de empresa en Meta + aprobación de plantillas de mensajes.

### P-03 — Usuarios agentes en Supabase Auth
**Qué:** Crear los usuarios de los agentes en Supabase Auth y asignarles el rol en `user_profiles`.
**Por qué:** Sin usuarios reales, los agentes no pueden iniciar sesión. La estructura está lista en DB.
**Acción:** Admin entra a `/admin/usuarios` → crear usuario → asignar rol `agente`.

### P-04 — Vincular vendedor OTP con `user_profiles`
**Qué:** Cuando el admin crea un vendedor, crear también el registro en `user_profiles` con `rol = 'vendedor'` para que el layout del portal funcione.
**Por qué:** Actualmente, el portal del vendedor puede fallar si no existe el perfil en `user_profiles`.
**Archivo:** `app/api/vendedores/route.ts` — agregar insert en `user_profiles` al crear vendedor.

### P-05 — Registrar dominio + configurar DNS en Vercel
**Qué:** Registrar `ihelpmedica.mx` y apuntar DNS a Vercel para activar HTTPS en producción.
**Por qué:** El sistema está desplegado en Vercel pero sin dominio propio todavía.
**Acción:** Registrar en Akky.mx o Namecheap → agregar dominio en Vercel → configurar registros A/CNAME.

---

## Pendientes — Media prioridad

### P-06 — Cambiar contraseña del admin inicial
**Qué:** La contraseña temporal `LeadsGMM2026!` debe cambiarse antes de producción real.
**Acción:** Admin → Supabase Dashboard → Auth → Users → cambiar contraseña.

### P-07 — Catálogo de campañas con los 19 temas del manual
**Qué:** UI para crear campañas con materiales descargables (flyer, texto WhatsApp, texto redes) asociados a los 19 temas del manual de negocio.
**Por qué:** Los vendedores necesitan materiales listos para compartir en sus redes.
**Archivos:** `app/(auth)/marketing/campanas/` — página nueva.

### P-08 — Completar importación masiva de médicos (batches 21-51)
**Qué:** Los primeros 20 batches de médicos ya están en la BD. Faltan los restantes del catálogo.
**Acción:** Ejecutar el script PowerShell de importación con los CSVs pendientes.

### P-09 — Aviso de privacidad completo + registro de aceptación
**Qué:** Mostrar el aviso de privacidad completo y registrar que el paciente lo aceptó (timestamp + IP) en la tabla de leads.
**Por qué:** Requerimiento LFPDPPP — la aceptación debe ser verificable.
**Archivos:** `app/r/[codigo]/CaptureClient.tsx`, `app/c/[slug]/ConvenioClient.tsx` — ya tienen checkbox; falta guardar el timestamp en el lead.

### P-10 — Bucket privado `lead-docs` en Supabase Storage
**Qué:** Crear el bucket para estudios médicos subidos por pacientes (diferente al bucket `logos-convenio` que es público).
**Por qué:** Los estudios médicos son PII sensible y no deben ser de acceso público.
**Acción:** Crear bucket privado `lead-docs` en Supabase → ajustar políticas RLS de Storage.

### P-11 — Política de retención y rotación de audit_log
**Qué:** Job automático que archive registros de `audit_log` mayores a 1 año en Supabase Storage (NDJSON comprimido) y los elimine de la tabla activa.
**Por qué:** Sin rotación, la tabla crece indefinidamente y degrada el rendimiento de queries de auditoría.

---

## Pendientes — Baja prioridad

### P-12 — Notificación al agente de nuevo lead (WhatsApp o email)
**Qué:** Cuando llega un lead nuevo (por QR, bot o formulario), enviar notificación automática al agente de guardia.
**Por qué:** Actualmente el agente tiene que revisar la lista manualmente para ver leads nuevos.

### P-13 — Exportación de reportes a PDF (liquidaciones de comisiones)
**Qué:** Desde la vista de comisiones, generar un PDF con el resumen de comisiones del mes por vendedor.
**Por qué:** El proceso de pago actual es manual. Un PDF firmado facilita la liquidación.
**Lib:** `jspdf` + `jspdf-autotable` ya está en el stack.

### P-14 — Notificación automática ante actividad anómala
**Qué:** Alerta al admin (WhatsApp o email) cuando se detecte: >10 intentos fallidos de webhook en 1h, acceso a carta de autorización fuera de horario, cambio masivo de etapas en < 5 min.
**Por qué:** Detección proactiva de intentos de acceso no autorizado o errores operativos.

### P-15 — Vista Kanban para call center (cola de atención)
**Qué:** Vista de columnas para el hub de call center mostrando leads en cola por agente.

### P-16 — Integración con calendario para programación de cirugías
**Qué:** Cuando un lead pasa a etapa "Programado", abrir un picker de fecha/hora y crear el evento en Google Calendar o similar.
**Por qué:** Hoy la fecha se captura como campo de texto libre en el formulario.

---

## Mejoras técnicas

### T-01 — Función SQL para dashboard de analítica (RPC)
**Qué:** Consolidar las queries de KPIs del dashboard en una función SQL RPC para reducir roundtrips.
**Cuándo:** Cuando el dashboard de admin empiece a tener muchas tarjetas de métricas.

### T-02 — Paginación con cursor en lugar de offset
**Qué:** Las listas de leads usan `range(offset, limit)` (offset-based). Para datasets grandes, cursor-based es más eficiente.
**Cuándo:** Cuando la tabla `leads` supere los 10,000 registros.

### T-03 — Cache de catálogos con ISR o revalidate
**Qué:** Los catálogos de procedimientos, aseguradoras y estados mexicanos son estáticos. Cachear con `revalidate: 3600`.
**Archivos:** Routes de catálogos en `/api/catalogos/`.

### T-04 — Tipado completo generado desde Supabase
**Qué:** Regenerar `types/supabase.ts` con el schema actualizado (incluyendo las nuevas tablas de convenios).
**Comando:** `supabase gen types typescript --project-id ljiqzsdcnxchckkhruol`

### T-05 — Tests de integración para el pipeline de comisiones
**Qué:** Test que valide que al cambiar etapa a `ganado` se crea correctamente el registro en `comisiones` con el monto del nivel actual.
**Por qué:** El flujo financiero debe ser resistente a regresiones.

### T-06 — Migrar a `vercel.ts` desde `vercel.json`
**Qué:** Usar la nueva configuración tipada de Vercel (`@vercel/config/v1`) para reemplazar `vercel.json`.
**Cuándo:** En el siguiente ciclo de mantenimiento de infraestructura.

---

## Posibles mejoras de producto

### UX-01 — Búsqueda global con atajo de teclado
**Qué:** `Cmd+K` / `Ctrl+K` abre una paleta de búsqueda global (leads, pacientes, médicos, vendedores).
**Impacto:** Los agentes que gestionan muchos leads se benefician enormemente de una búsqueda rápida.

### UX-02 — Timeline de actividad en el detalle del lead
**Qué:** En lugar de mostrar solo la etapa actual, mostrar una línea de tiempo visual con cada cambio de etapa, nota y documento subido.
**Impacto:** Mejor contexto para agentes que toman un lead de un compañero.

### UX-03 — Preview de la landing de convenio desde el admin
**Qué:** Botón "Ver preview" en el tab "Landing QR" que abra un iframe o nueva pestaña con la landing del convenio.
**Impacto:** El admin puede verificar cómo se ve la landing antes de distribuir el QR.

### UX-04 — Deduplicación visual en captura de lead
**Qué:** Cuando el agente captura un teléfono ya registrado en el sistema, mostrar una alerta con el lead existente.
**Impacto:** Evita duplicados y ayuda al agente a retomar el expediente correcto.

### UX-05 — Dashboard de vendedor con gráfica de tendencia
**Qué:** En el portal del vendedor, mostrar una gráfica de barras con leads por mes de los últimos 6 meses.
**Lib:** `recharts` ya está en el stack.

### NEG-01 — Programa de referidos multinivel (opcional)
**Qué:** Permitir que un vendedor refiera a otro vendedor, y ganar un porcentaje de las comisiones del referido.
**Impacto:** Crecimiento orgánico de la red de vendedores.
**Consideración:** Aumenta la complejidad del cálculo de comisiones considerablemente.

### NEG-02 — Integración con aseguradoras vía API
**Qué:** Conectar con APIs de GNP, AXA u otras aseguradoras para consultar vigencia de póliza automáticamente.
**Impacto:** Reduce el tiempo de validación de 48-72h a minutos.
**Consideración:** Requiere acuerdos comerciales con cada aseguradora.

### NEG-03 — Módulo de facturación de honorarios
**Qué:** Generar CFDI de los honorarios del servicio de gestión una vez que el procedimiento se confirma.
**Consideración:** Requiere integración con un PAC (Proveedor Autorizado de Certificación del SAT).

---

## Próximo sprint sugerido

Considerando el estado actual y el valor de negocio:

1. **P-01** Kanban visual — impacto inmediato en productividad del equipo
2. **P-04** Vincular vendedor OTP con `user_profiles` — bloquea el portal de vendedores
3. **P-07** Campañas con materiales — activa el canal de vendedores al 100%
4. **UX-03** Preview de landing en admin — calidad de vida para configuración de convenios
5. **T-04** Regenerar tipos de Supabase — deuda técnica menor, 5 minutos de trabajo
