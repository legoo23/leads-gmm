# Guía de Despliegue — Leads GMM

> Documento técnico para configurar el sistema desde cero o actualizar un entorno existente.
> Stack: Next.js 15 · Supabase · Vercel

---

## Prerequisitos

| Herramienta | Versión mínima | Uso |
|---|---|---|
| Node.js | 22+ | Entorno de ejecución |
| npm | 10+ | Gestor de paquetes |
| Git | 2.x | Control de versiones |
| Vercel CLI | Última | Deploy y env vars |
| Cuenta Supabase | — | Base de datos y auth |
| Cuenta Vercel | — | Hosting |

```bash
# Instalar Vercel CLI
npm i -g vercel

# Verificar Node
node --version  # debe ser >= 22
```

---

## 1. Clonar y configurar local

```bash
git clone <URL_DEL_REPO> leads
cd leads
npm install
```

### 1.1 Variables de entorno locales

Crear `.env.local` en la raíz (NUNCA hacer commit de este archivo):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cifrado PII — generar UNA sola vez y nunca cambiar con datos en producción
# Generar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DATA_ENCRYPTION_KEY=<64 caracteres hexadecimales>

# Licencia del software (obtener con Alejandro Legorreta)
LICENSE_KEY=<payload_base64>.<firma_base64>

# WhatsApp Meta Cloud API
WHATSAPP_TOKEN=EAAx...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<token_secreto_propio>
WHATSAPP_APP_SECRET=<secreto_app_meta>

# App pública
NEXT_PUBLIC_APP_URL=https://tudominio.com
NEXT_PUBLIC_VENDOR_CODE_PREFIX=GMM
```

### 1.2 Verificar que el servidor corra

```bash
npm run dev
# → http://localhost:3000
```

---

## 2. Supabase — configuración inicial

### 2.1 Crear proyecto nuevo

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Nombre: `leads-gmm` (o el nombre del producto cuando esté definido)
3. Región: `us-east-1` o la más cercana a México
4. Contraseña BD: guardar en lugar seguro

### 2.2 Aplicar migraciones

Las migraciones deben aplicarse **en orden numérico**. Hay dos formas:

**Opción A — Supabase CLI (recomendado en staging/local)**
```bash
npx supabase link --project-ref XXXX
npx supabase db push
```

**Opción B — SQL Editor en dashboard (producción)**

Abrir el SQL Editor en supabase.com y ejecutar en este orden exacto:

| Orden | Archivo | Descripción |
|---|---|---|
| 1 | `000_seed_catalogos.sql` | Datos iniciales: aseguradoras, hospitales, niveles |
| 2 | `001_initial_schema.sql` | Esquema completo: tablas, índices, extensiones |
| 3 | `002_rls_policies.sql` | Row Level Security por rol |
| 4 | `003_column_fixes.sql` | Renombres de columnas _enc, cobertura_confirmada |
| 5 | `004_bot_sessions_and_upload.sql` | Sesiones bot WA, tokens de upload, empresas_prospectos |
| 6 | `006_contact_fields.sql` | Campos de contacto extendidos |
| 7 | `007_clinical_fields_and_roles.sql` | Campos clínicos y roles de usuario |
| 8 | `008_canal_fuente_especifica.sql` | Canal y fuente específica |
| 9 | `009_lead_medico_campos.sql` | Campos de médico en lead |
| 10 | `010_medicos_en_red.sql` | Flag en_red en médicos |
| 11 | `011_stats_function.sql` | Función get_lead_stats (analítica pipeline) |
| 12 | `012_vendedores_fields.sql` | Campos personales, dirección y bancarios de vendedores |
| 13 | `013_personas_vendedor_stats.sql` | Funciones get_personas_list y get_vendedor_stats |

> **Importante:** Si hay un error en una migración, resolverlo antes de continuar con la siguiente.

### 2.3 Crear el primer usuario admin

En el SQL Editor de Supabase, después de crear el usuario vía Auth:

```sql
-- Después de que el usuario haga signup en la app:
UPDATE user_profiles
SET rol = 'admin', nombre = 'Alejandro Legorreta'
WHERE id = '<UUID_DEL_USUARIO_EN_AUTH>';
```

### 2.4 Configurar Storage

Crear bucket para documentos de leads:
1. Storage → New Bucket → Nombre: `lead-docs`
2. Public: **NO** (privado)
3. Allowed MIME types: `application/pdf,image/jpeg,image/png,image/webp`
4. File size limit: `10 MB`

### 2.5 RLS — verificar políticas activas

```sql
-- Ver políticas activas en tabla leads
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;
```

---

## 3. Vercel — configuración inicial

### 3.1 Conectar repositorio

```bash
# En la carpeta del proyecto
vercel link
# Seguir el wizard: org → crear nuevo proyecto → leads-gmm
```

### 3.2 Configurar variables de entorno

Todas las variables de `.env.local` deben existir en Vercel:

```bash
# Agregar una a una (o desde el dashboard de Vercel)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATA_ENCRYPTION_KEY
vercel env add LICENSE_KEY
vercel env add WHATSAPP_TOKEN
vercel env add WHATSAPP_PHONE_NUMBER_ID
vercel env add WHATSAPP_WEBHOOK_VERIFY_TOKEN
vercel env add WHATSAPP_APP_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel env add NEXT_PUBLIC_VENDOR_CODE_PREFIX
```

> **Crítico:** `DATA_ENCRYPTION_KEY` y `SUPABASE_SERVICE_ROLE_KEY` deben ser **Production** y **Preview** — NUNCA deben quedar visibles en logs.

### 3.3 Primer deploy

```bash
git push origin master
# Vercel despliega automáticamente desde main/master
```

O manualmente:
```bash
vercel --prod
```

### 3.4 Configurar dominio personalizado

1. Vercel Dashboard → Settings → Domains
2. Add domain: `tudominio.com`
3. Copiar los registros DNS que muestra Vercel
4. En tu registrador (Namecheap/GoDaddy/Akky.mx):
   - Agregar registro CNAME: `www` → `cname.vercel-dns.com`
   - Agregar registro A: `@` → `76.76.21.21`
5. Esperar propagación DNS (5-60 minutos)

---

## 4. WhatsApp — Meta Cloud API

### 4.1 Configuración inicial (desarrollo)

1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Crear App → Business → agregar producto "WhatsApp"
3. En WhatsApp → Configuration:
   - **Webhook URL**: `https://tudominio.com/api/whatsapp/webhook`
   - **Verify Token**: el mismo valor que `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - **Suscribir campos**: `messages`

### 4.2 Token de acceso

```bash
# Token temporal de prueba (60 días) — para desarrollo
# Settings → App Settings → Access Token

# Token permanente — para producción
# 1. Crear System User en Business Manager
# 2. Asignar permisos de WhatsApp Business
# 3. Generar token permanente
```

### 4.3 Verificar webhook

```bash
curl -X GET "https://tudominio.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TU_VERIFY_TOKEN&hub.challenge=1234"
# Debe responder: 1234
```

---

## 5. Checklist post-despliegue

### Funcional
- [ ] Login con correo y contraseña funciona
- [ ] Usuario admin puede crear leads
- [ ] Auto-avance de etapas funciona (guardar nombre → pasa a "contactado")
- [ ] Búsqueda de leads filtra correctamente
- [ ] Analítica del pipeline muestra datos
- [ ] Nuevo vendedor genera código único
- [ ] QR del vendedor lleva a formulario con código prefijado

### Seguridad
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no aparece en ningún log de cliente
- [ ] `DATA_ENCRYPTION_KEY` no está en el repositorio git (revisar con `git log -p | grep DATA_ENCRYPTION`)
- [ ] RLS activo en todas las tablas (`SELECT * FROM pg_policies` → verificar cobertura)
- [ ] Webhook de WhatsApp valida firma HMAC antes de procesar
- [ ] Bucket `lead-docs` es privado (no accesible sin URL firmada)

### Rendimiento
- [ ] Lista de leads carga en < 500ms
- [ ] Sin errores en consola del browser
- [ ] TypeScript build sin errores (`npx tsc --noEmit`)

---

## 6. Actualización de migraciones

Cuando se agrega una nueva migración en desarrollo:

```bash
# 1. Crear archivo en supabase/migrations/ con nombre incremental
# Ejemplo: 014_nombre_descriptivo.sql

# 2. Probar local
npx supabase db push

# 3. Commitear
git add supabase/migrations/014_nombre_descriptivo.sql
git commit -m "db: descripción de la migración"

# 4. Aplicar en producción vía SQL Editor de Supabase
# (copiar y ejecutar el contenido del archivo)

# 5. Actualizar este documento con la nueva migración en la tabla de orden
```

> **Regla:** Nunca editar migraciones ya aplicadas. Siempre crear una nueva.

---

## 7. Rollback de emergencia

### Rollback de código (Vercel)
```bash
# Ver últimos deploys
vercel ls

# Revertir a un deploy específico
vercel rollback <DEPLOYMENT_URL>
```

### Rollback de migración SQL
Si una migración rompió algo, crear una migración inversa:
```sql
-- NNN_rollback_migración_anterior.sql
-- Aquí va el SQL para revertir los cambios
ALTER TABLE ... DROP COLUMN ...;
DROP FUNCTION IF EXISTS ...;
```

> **No tocar** `DATA_ENCRYPTION_KEY` en ningún rollback — los datos quedarían ilegibles.

---

## 8. Variables de entorno — referencia completa

| Variable | Entorno | Descripción | Sensible |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | URL del proyecto Supabase | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Clave anon pública de Supabase | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Clave de servicio con acceso total | **Sí** |
| `DATA_ENCRYPTION_KEY` | Server only | Clave AES-256 para PII — **NUNCA cambiar** | **Sí** |
| `LICENSE_KEY` | Server only | Licencia RSA firmada del software | **Sí** |
| `WHATSAPP_TOKEN` | Server only | Token de acceso Meta Cloud API | **Sí** |
| `WHATSAPP_PHONE_NUMBER_ID` | Server only | ID del número de WhatsApp en Meta | No |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Server only | Token para verificar webhook | **Sí** |
| `WHATSAPP_APP_SECRET` | Server only | Secreto HMAC para validar mensajes | **Sí** |
| `NEXT_PUBLIC_APP_URL` | All | URL base del sistema (para QRs) | No |
| `NEXT_PUBLIC_VENDOR_CODE_PREFIX` | All | Prefijo de códigos de vendedor (ej: GMM) | No |

---

## Contacto técnico

**Titular del software:** Alejandro Legorreta Barrera  
**Llave privada RSA:** `C:\Users\AlejandroLegorreta\Desktop\LEADS-GMM-PRIVATE-KEY.pem`  
(Resguardar en lugar seguro — necesaria para emitir licencias)
