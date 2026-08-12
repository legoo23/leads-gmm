# Sistema de Gestión de Leads — Procedimientos Quirúrgicos con Seguro GMM

> Documento vivo del proyecto. Nombre del producto y dominio pendientes de definir.
> Stack: **Next.js 15 App Router · TypeScript · Tailwind CSS v4 · Supabase · Vercel**

---

## 1. Propósito del proyecto

Sistema dedicado a **capturar, calificar y convertir leads de personas interesadas en procedimientos quirúrgicos cubiertos por Seguro de Gastos Médicos Mayores (GMM)**.

El diferenciador central es un **sistema de distribución por vendedores**: se generan códigos únicos y QRs personalizados por vendedor. Los vendedores los distribuyen en sus propias redes (redes sociales, WhatsApp, contactos). Cada lead que llega con el código de un vendedor queda vinculado a él y genera una comisión fija si se convierte.

### Flujo de negocio

```
Campaña / QR del vendedor → Lead llega (código referido embebido)
  → Bot de WhatsApp captura datos básicos → Cola de revisión del agente
  → Contacto inicial → Identificación de padecimiento y procedimiento
  → Identificación del seguro GMM → Validación de cobertura
  → Viabilidad confirmada → Programación del procedimiento
  → Conversión → Comisión fija al vendedor (según su nivel)
```

---

## 2. Identidad del proyecto

- **Nombre del producto:** Pendiente de definir (sin relación con ninguna marca hospitalaria)
- **Dominio:** Pendiente — nuevo, nombre completamente independiente
- **GitHub:** Repo nuevo (privado)
- **Deploy:** Vercel (Fluid Compute, Node.js 24)
- **Base de datos:** Supabase — proyecto nuevo, independiente de cualquier otro sistema
- **Código de vendedor:** Formato `[PREFIX]-XXXXX` donde PREFIX se define con el nombre del producto

---

## 3. Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 15 App Router | RSC + Route Handlers — Vercel-native |
| Lenguaje | TypeScript 5.x strict | `strict: true` |
| Estilos | Tailwind CSS v4 | `@tailwindcss/postcss` en Next.js |
| Iconos | lucide-react | |
| Gráficas | recharts | Dashboards de comisiones y conversiones |
| DB + Auth | Supabase | RLS en todas las tablas; Supabase Auth SSR |
| Auth vendedores | Supabase Auth OTP | Login con teléfono/email → código de un solo uso |
| WhatsApp | Meta Cloud API directa | Sin BSP intermediario (360dialog, Twilio, etc.) |
| QR | `react-qr-code` | Generación client-side; exportable SVG/PNG |
| Storage | Supabase Storage | Cartas de autorización, estudios, materiales de campaña |
| PDF | jspdf + jspdf-autotable | Liquidaciones de comisiones, reportes |
| Deploy | Vercel | Fluid Compute — HTTPS automático vía Let's Encrypt |
| CI/CD | GitHub Actions | Lint + typecheck en cada PR |

---

## 4. Módulos del sistema

### 4.1 Leads Hub — Pipeline GMM Cirugía
Etapas específicas para cirugía con seguro:

| Etapa | Key | Descripción | SLA |
|---|---|---|---|
| Nuevo | `nuevo` | Llegó por QR, WhatsApp o formulario | Contactar en < 2 h |
| Contactado | `contactado` | Primer contacto real con el paciente | — |
| Necesidad Identificada | `necesidad_identificada` | Se conoce el procedimiento quirúrgico requerido | Completar sección Padecimientos |
| Seguro Identificado | `seguro_identificado` | Aseguradora + póliza capturados | Completar sección Póliza GMM |
| En Validación | `en_validacion` | Verificando cobertura con la aseguradora | 48–72 h hábiles |
| Viable | `viable` | Aseguradora confirmó cobertura | — |
| Programado | `programado` | Fecha, médico y hospital asignados | — |
| **Ganado** | `ganado` | ✅ Procedimiento confirmado → activa comisión | — |
| **No Viable** | `no_viable` | ❌ Seguro rechazó o no cubre | — |
| **Perdido** | `perdido` | ❌ Sin interés / sin respuesta | — |

**Decisión de arquitectura:** La etapa activa se guarda en la columna SQL `etapa` del lead (no en `notas` como en sistemas previos), lo que permite filtrar directamente por etapa en queries.

### 4.2 Personas Hub
Expediente unificado del paciente/contacto.
- Deduplicación en cascada: CURP → teléfono → email
- Un paciente puede tener N leads a lo largo del tiempo
- Búsqueda por nombre, teléfono, email, CURP

### 4.3 Marketing Hub — Campañas + Vendedores + Comisiones
**El módulo diferenciador del sistema.**

**Gestión de vendedores:**
- Solo el administrador crea vendedores (no hay auto-registro público)
- Cada vendedor tiene: nombre, teléfono, email, nivel de comisión, código único, QR descargable
- Dashboard del vendedor: leads traídos, en pipeline, convertidos, comisiones

**Sistema de niveles de comisión:**
- Tabla `niveles_comision` configurable desde el Admin Hub
- Cada nivel tiene un monto fijo de comisión (ej: Nivel 1 = $500, Nivel 2 = $800, Nivel 3 = $1,200)
- El administrador asigna el nivel al vendedor y puede modificarlo
- Al convertirse un lead → se genera `comision` con el monto fijo del nivel actual del vendedor

**Campañas y materiales:**
- Crear campañas con nombre, procedimiento target y vigencia
- Cargar materiales (flyer, texto para WhatsApp, texto para redes)
- Descargar material ya generado con QR personalizado del vendedor

### 4.4 Médicos Hub
Catálogo interno de médicos para análisis y asignación.
- **Los médicos NO tienen acceso al sistema**
- Solo registro interno: especialidad, hospital donde opera, aseguradoras aceptadas
- Se vinculan al lead en la etapa "Programado"
- Dashboard: procedimientos asignados, médicos más activos

### 4.5 Empresas Hub
Aseguradoras y empresas con convenio.
- Aseguradoras: nombre, contacto de enlace, coberturas frecuentes, proceso de autorización
- Empresas convenio: datos fiscales, ejecutivo de cuenta

### 4.6 Call Center Hub
Panel para agentes de seguimiento.
- Cola de leads en estado `nuevo` o sin agente asignado
- Guión de calificación por etapa del pipeline
- Registro de llamada y resultado
- Asignación de leads entre agentes

### 4.7 Administrador Hub
- Gestión de usuarios y roles (admin / supervisor / agente)
- **Gestión de vendedores** (crear, editar, cambiar nivel, desactivar)
- **Configuración de niveles de comisión** (nombre del nivel, monto fijo)
- Catálogos: procedimientos quirúrgicos, aseguradoras, hospitales
- Reportes globales: conversión, productividad por agente, comisiones totales
- Configuración del bot de WhatsApp (plantillas, flujos)

---

## 5. Sistema de vendedores — detalle técnico

### Auth del portal de vendedores (OTP)
Los vendedores NO tienen contraseña. El login funciona así:
1. El admin crea al vendedor con nombre, teléfono y email
2. El vendedor abre la URL del portal e ingresa su número de teléfono
3. El sistema envía un OTP de 6 dígitos por WhatsApp **o** email (a elección)
4. El vendedor ingresa el código → recibe un **token JWT de corta duración** (ej: 30 min)
5. El token se renueva automáticamente en cada sesión activa
6. El vendedor ve su dashboard: leads, pipeline, comisiones

**Implementación en Supabase Auth:** usar `signInWithOtp({ phone })` o `signInWithOtp({ email })`. El OTP es nativo de Supabase, sin código custom.

**Importante:** La vista del vendedor es de solo lectura — puede ver sus leads y comisiones pero no editar datos.

### Niveles de comisión
```sql
niveles_comision (
  id        serial pk,
  nombre    text not null,          -- 'Nivel 1', 'Bronce', 'Estándar', etc.
  monto     numeric(10,2) not null, -- comisión fija en MXN por conversión
  descripcion text,
  activo    boolean default true,
  orden     int                     -- para display en UI
)
```

### Flujo de comisión
```
Lead → etapa 'ganado' 
  → trigger SQL (o Route Handler) crea registro en `comisiones`
  → estado inicial: 'pendiente'
  → Admin revisa y aprueba → estado: 'aprobada'
  → Se procesa pago fuera del sistema → Admin marca: 'pagada'
```

### URL del QR
```
https://tudominio.com/r/[CODIGO-VENDEDOR]
```
Al abrir, el formulario de captura recibe el código como query param y lo almacena oculto.

---

## 6. Integración WhatsApp — Meta Cloud API directa

Sin BSP intermediario. Se usa la API de Meta directamente.

### Flujo del bot
1. Paciente escribe al número de WhatsApp del negocio
2. El webhook POST llega a `/api/whatsapp/webhook` (Route Handler Next.js)
3. El bot captura nombre, teléfono, procedimiento de interés, aseguradora
4. **Se crea el lead en estado `nuevo` con `fuente = 'whatsapp_bot'` y se coloca en cola de revisión** — el agente lo confirma antes de procesarlo como lead real
5. El agente recibe notificación (WhatsApp o email) de nuevo lead en cola

### Seguridad del webhook
```ts
// Validar firma HMAC-SHA256 de Meta antes de procesar CUALQUIER mensaje
const sig = req.headers['x-hub-signature-256']
const hash = crypto.createHmac('sha256', process.env.WHATSAPP_APP_SECRET!)
  .update(rawBody).digest('hex')
if (`sha256=${hash}` !== sig) return NextResponse.json({}, { status: 403 })
```

### Variables de entorno WhatsApp
```bash
WHATSAPP_TOKEN=EAAx...                    # Token de acceso de larga duración
WHATSAPP_PHONE_NUMBER_ID=1234567890       # ID del número registrado en Meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=secreto    # Token para verificar el webhook en Meta
WHATSAPP_APP_SECRET=abcdef...            # Para validar firma HMAC de mensajes entrantes
```

---

## 7. Formulario de captura — secciones y campos

### Sección 1: Datos de Contacto (obligatorio desde captura inicial)
- Nombre, apellido paterno, apellido materno
- Teléfono (10 dígitos, validado), teléfono alternativo
- Email, fecha de nacimiento
- Estado/ciudad, CURP (opcional)
- Prioridad: baja / media / alta / urgente

### Sección 2: Padecimientos e Historia Clínica
- Diagnóstico principal (catálogo + texto libre)
- Diagnósticos secundarios / comorbilidades (tags múltiples)
- Cirugías previas (toggle + descripción)
- ¿Tiene médico tratante? (toggle + nombre)
- Notas clínicas adicionales

### Sección 3: Procedimiento Quirúrgico
- Tipo de procedimiento (catálogo)
- Categoría quirúrgica
- Urgencia: electiva / programada / urgente
- Fecha tentativa deseada
- Hospital sugerido, médico asignado
- Código de procedimiento (CIE-9 / CPT) — requerido por aseguradoras
- Costo estimado, estancia hospitalaria estimada
- Notas del procedimiento

### Sección 4: Estudios Preoperatorios
- Lista de estudios requeridos para el procedimiento
- Estado por estudio: realizado / pendiente / requerido por seguro
- Upload de resultados (PDF/imagen, Supabase Storage)

### Sección 5: Póliza de Seguro GMM
- Aseguradora (catálogo), tipo de plan (individual / familiar / colectivo)
- Número de póliza, número de certificado
- Vigencia inicio / vigencia fin
- Fecha de inicio de vigencia original (para calcular períodos de espera)
- Suma asegurada, moneda
- Deducible (por evento)
- Coaseguro (%), tope de coaseguro
- Período de espera: activo / cumplido
- Nombre del titular de la póliza

### Sección 6: Cobertura y Exclusiones
- ¿Cubre cirugías? / ¿Requiere pre-autorización?
- ¿Cubre anestesiólogo? / ¿Cubre estudios preop.?
- ¿Cubre honorarios médicos? / ¿Cubre hospitalización?
- Lista de enfermedades/condiciones excluidas (tags)
- ¿El procedimiento aplica a una preexistencia?
- Número de autorización
- Fecha de autorización
- **Upload de carta de autorización** (PDF → Supabase Storage)
- Contacto en la aseguradora (nombre + teléfono)
- Notas de la validación

### Sección 7: Canal y Vendedor Referidor
- Canal de adquisición (WhatsApp, formulario web, referido, redes sociales, llamada)
- Código referido (capturado automáticamente desde URL del QR — hidden field)
- Vendedor resuelto del código (read-only, informativo)
- Fuente específica (Instagram, WhatsApp personal, recomendación directa, etc.)

---

## 8. Modelo de datos principal

### `leads`
```sql
id                  bigserial pk
folio               text unique           -- formato a definir con el nombre del producto
id_persona          uuid fk personas
id_vendedor         int fk vendedores     -- NULL si llegó sin código
id_campana          int fk campanas
codigo_referido     text                  -- código en bruto capturado
fuente              text                  -- 'whatsapp_bot' | 'qr' | 'formulario' | 'llamada'
en_cola_revision    boolean default false -- TRUE cuando viene del bot de WA
-- Paciente
nombre              text not null
apellido_paterno    text
apellido_materno    text
telefono            text    -- 10 dígitos, normalizado
email               text
fecha_nacimiento    date
curp                text
estado_ciudad       text
prioridad           text    -- 'baja'|'media'|'alta'|'urgente'
-- Procedimiento
procedimiento       text
categoria_quirurgica text
codigo_procedimiento text   -- CIE-9 / CPT
urgencia            text   -- 'electiva'|'programada'|'urgente'
costo_estimado      numeric(12,2)
-- Seguro
id_aseguradora      int fk aseguradoras
numero_poliza       text
vigencia_inicio     date
vigencia_fin        date
suma_asegurada      numeric(12,2)
deducible           numeric(10,2)
coaseguro_pct       numeric(5,2)
tope_coaseguro      numeric(10,2)
cobertura_confirmada boolean
numero_autorizacion text
carta_autorizacion_url text  -- URL en Supabase Storage
-- Asignación
id_agente           int fk agentes
id_medico           int fk medicos
id_hospital         int fk hospitales
-- Pipeline
etapa               text   -- key de ETAPAS_PIPELINE_GMM
estado              text   -- 'activo'|'convertido'|'perdido'
-- Timestamps y notas
notas               text
fecha_captura       timestamptz default now()
fecha_contacto      timestamptz
fecha_conversion    timestamptz
```

### `vendedores`
```sql
id              serial pk
nombre          text not null
telefono        text
email           text
id_nivel        int fk niveles_comision
codigo_unico    text unique not null
activo          boolean default true
fecha_registro  timestamptz default now()
```

### `niveles_comision`
```sql
id          serial pk
nombre      text not null      -- 'Estándar', 'Premium', 'Elite', etc.
monto       numeric(10,2)      -- monto fijo MXN por conversión
descripcion text
activo      boolean default true
orden       int
```

### `comisiones`
```sql
id                  serial pk
id_lead             int fk leads
id_vendedor         int fk vendedores
id_nivel_snapshot   int fk niveles_comision  -- nivel al momento de la conversión
monto               numeric(10,2)             -- copiado del nivel al convertir
estado              text  -- 'pendiente'|'aprobada'|'pagada'|'cancelada'
fecha_conversion    timestamptz
fecha_aprobacion    timestamptz
fecha_pago          timestamptz
notas               text
```

---

## 9. Variables de entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cifrado PII — AES-256-GCM — NUNCA cambiar con datos en producción
# Generar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DATA_ENCRYPTION_KEY=<64 caracteres hexadecimales>

# Licencia del software — RSA-SHA256
LICENSE_KEY=<payloadB64>.<firmaB64>

# WhatsApp — Meta Cloud API directa
WHATSAPP_TOKEN=EAAx...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_WEBHOOK_VERIFY_TOKEN=mi_token_secreto
WHATSAPP_APP_SECRET=firma_hmac_secret

# App
NEXT_PUBLIC_APP_URL=https://tudominio.com       # para generar URLs de QR
NEXT_PUBLIC_VENDOR_CODE_PREFIX=GMM              # prefix de códigos de vendedor
```

**Variables de solo servidor (nunca en `NEXT_PUBLIC_*`):**
`SUPABASE_SERVICE_ROLE_KEY`, `DATA_ENCRYPTION_KEY`, `LICENSE_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

---

## 10. Patrones de código

### Supabase SSR (Next.js)
```ts
// lib/supabase/server.ts — Server Components y Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    }
  )
}

// lib/supabase/client.ts — Client Components
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### OTP login para vendedores
```ts
// El vendedor ingresa teléfono o email → Supabase envía OTP
const { error } = await supabase.auth.signInWithOtp({
  phone: '+521234567890',  // formato E.164
  options: { channel: 'whatsapp' }  // o 'sms'
})
// Verificar OTP:
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+521234567890',
  token: '123456',
  type: 'sms',
})
```

### Normalización de datos (invariante del sistema)
```ts
export const normalizePhone = (p: unknown): string => {
  const digits = String(p ?? '').replace(/\D/g, '')
  return digits.length === 10 ? digits : ''
  // Si no son 10 dígitos exactos → string vacío (nunca truncar)
}
export const normalizeEmail = (e: unknown): string =>
  String(e ?? '').trim().toLowerCase()
```

### Generación de código de vendedor
```ts
// Sin prefix de marca — el prefix se define cuando se tenga el nombre del producto
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O/0/I/1 para evitar confusión
export function generateVendorCode(prefix: string, length = 6): string {
  const random = Array.from({ length }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
  return `${prefix}-${random}`
}
```

### UI — colores del sistema
- Fondo general: `#F0F4F8` (azul-gris frío)
- Superficie: `#FFFFFF`
- Acento principal: a definir con el nombre/identidad del producto
- Etapas positivas (ganado): `#059669` bg `#ECFDF5`
- Etapas negativas (perdido/no viable): `#DC2626` bg `#FEF2F2`
- Etapas neutras/intermedias: paleta propia por etapa (ver `constants/lead-etapas.ts`)

### Roles de usuario (Supabase RLS)
| Rol | Acceso |
|---|---|
| `admin` | Todo — sin restricciones |
| `supervisor` | Lee y escribe todos los leads; no configura sistema |
| `agente` | Solo ve/edita sus leads asignados + nuevos sin asignar |
| `vendedor` | Solo lectura de sus propios leads y comisiones vía OTP |

---

## 11. Estructura de carpetas

```
/
├── app/
│   ├── (auth)/                     # Layout protegido — agentes y admin
│   │   ├── layout.tsx
│   │   ├── leads/                  # Leads Hub
│   │   │   ├── page.tsx            # Lista / Kanban del pipeline
│   │   │   ├── nuevo/page.tsx
│   │   │   ├── [id]/page.tsx       # Detalle del lead + formulario completo
│   │   │   ├── seguimiento/page.tsx
│   │   │   ├── reportes/page.tsx
│   │   │   └── busqueda/page.tsx
│   │   ├── personas/
│   │   ├── marketing/
│   │   │   ├── page.tsx
│   │   │   ├── vendedores/
│   │   │   ├── campanas/
│   │   │   └── comisiones/
│   │   ├── medicos/
│   │   ├── empresas/
│   │   ├── callcenter/
│   │   └── admin/
│   ├── (vendedor)/                 # Portal de vendedores — OTP auth
│   │   ├── layout.tsx
│   │   └── mi-panel/page.tsx       # Dashboard del vendedor (solo lectura)
│   ├── api/
│   │   ├── leads/route.ts
│   │   ├── leads/[id]/route.ts
│   │   ├── leads/[id]/etapa/route.ts
│   │   ├── vendedores/route.ts
│   │   ├── comisiones/route.ts
│   │   └── whatsapp/webhook/route.ts
│   ├── r/[codigo]/page.tsx         # Landing de captura pública con código referido
│   ├── login/page.tsx
│   └── layout.tsx
├── components/
│   ├── leads/
│   ├── marketing/
│   ├── callcenter/
│   └── ui/
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── supabase/middleware.ts
│   ├── whatsapp.ts                 # Wrapper Meta Cloud API
│   └── utils.ts
├── constants/
│   ├── lead-etapas.ts              # Pipeline GMM — etapas y colores
│   ├── procedimientos.ts           # Catálogo de procedimientos quirúrgicos
│   ├── aseguradoras.ts             # Aseguradoras frecuentes
│   └── geo-mx.ts                   # Estados MX
├── types/supabase.ts
├── middleware.ts                    # Supabase auth refresh
└── supabase/
    └── migrations/                  # Migraciones SQL versionadas
```

---

## 12. Deploy

### Vercel
- Framework: **Next.js**
- Node.js runtime — Fluid Compute (no edge functions)
- HTTPS automático via Let's Encrypt — no se compra certificado SSL por separado
- Dominio propio: registrar en Namecheap/GoDaddy/Akky.mx → apuntar DNS a Vercel
- `main` → producción | `dev` → preview URL automática

### Supabase
- Proyecto **nuevo** e independiente
- RLS habilitado en todas las tablas
- Migraciones en `/supabase/migrations/` — versionadas en el repo
- `service_role` key solo en Route Handlers del servidor, nunca en el cliente
- Supabase Storage: bucket privado para cartas de autorización y estudios

### WhatsApp
- Meta Cloud API directa — webhook en `/api/whatsapp/webhook`
- **Modo desarrollo:** número de prueba de Meta, hasta 5 números para testear
- **Producción:** número real registrado, plantillas aprobadas, empresa verificada en Meta

---

## 13. Historial de decisiones

| Fecha | Decisión | Razón |
|---|---|---|
| 2026-08-10 | Next.js 15 App Router (no Vite+Express) | Vercel-native; sin servidor separado |
| 2026-08-10 | Supabase Auth OTP para vendedores | Sin contraseña; token siempre nuevo; más seguro para vista externa |
| 2026-08-10 | Solo admin crea vendedores | Evitar spam de cuentas; control total del programa de referidos |
| 2026-08-10 | Comisiones fijas por nivel de vendedor | Simplifica cálculo; el admin controla los montos por nivel desde el panel |
| 2026-08-10 | Bot de WA crea lead en cola de revisión | El agente confirma antes de procesar; evita leads basura del bot |
| 2026-08-10 | Meta Cloud API directa (sin BSP) | Sin costo de intermediario; control total del webhook |
| 2026-08-10 | Médicos = catálogo interno sin acceso | No son usuarios del sistema; solo datos para asignación y análisis |
| 2026-08-10 | Carta de autorización → Supabase Storage | PDF subible; URL almacenada en columna `carta_autorizacion_url` del lead |
| 2026-08-10 | Etapa activa en columna `etapa` (no en campo `notas`) | Permite filtrar SQL directamente; no es un workaround como en sistemas previos |
| 2026-08-10 | Snapshot del nivel de comisión al convertir | Preserva el monto histórico aunque el nivel cambie después |
| 2026-08-12 | Cifrado AES-256-GCM para campos PII | Protección de datos médicos y personales en reposo; requiere `DATA_ENCRYPTION_KEY` |
| 2026-08-12 | Licencia RSA-SHA256 en Route Handlers | Protección del software; `assertLicense()` como primera línea de cada endpoint |
| 2026-08-12 | ShellClient como wrapper del layout | `layout.tsx` debe ser Server Component para auth; estado del sidebar vive en un Client Component separado |
| 2026-08-12 | Dual-view responsive (tarjetas móvil + tabla desktop) | Agentes trabajan en campo con celulares/tablets; las tablas no son usables en pantallas < 640px |
| 2026-08-12 | Modal sheet pattern en móvil | `items-end sm:items-center` + `rounded-t-2xl sm:rounded-2xl` + `max-h-[92dvh]` para comportamiento nativo iOS/Android |
| 2026-08-12 | Filtros colapsables en móvil con indicador de activos | Sin espacio para filtros siempre visibles en 375px; el indicador "●" avisa que hay filtros aplicados |
| 2026-08-12 | Funciones SQL para analítica (RPC) | CTEs + FILTER aggregates son más eficientes que múltiples queries desde el cliente |
| 2026-08-12 | `save()` en LeadDetail excluye `etapa`/`estado` del payload | Activa el auto-avance de etapas; incluirlos anularía la lógica de avance |
| 2026-08-12 | Conteo separado de data query | `count: "exact"` en queries con JOINs es lento; dos queries paralelas + `head: true` es más eficiente |
| 2026-08-12 | Todo texto en mayúsculas en DB | Uniformidad visual; búsquedas case-insensitive más simples; aplicado en API antes de guardar |

---

## 15. Diseño responsivo — convenciones

### Breakpoints del sistema

| Tailwind | px | Uso |
|---|---|---|
| (base) | 0+ | Móvil — tarjetas, drawer, filtros colapsables |
| `sm:` | 640+ | Tablet — tablas visibles, filtros siempre abiertos |
| `md:` | 768+ | Grid 2→4 columnas en KPIs y analítica |
| `lg:` | 1024+ | Desktop — sidebar fija siempre visible |

### Componentes responsivos clave

**Sidebar:** `hidden lg:flex` (desktop fija) + `lg:hidden fixed` (móvil drawer con slide-in)
**Topbar:** `justify-between` con botón hamburger `lg:hidden`
**ShellClient:** maneja estado `sidebarOpen`, backdrop y cierre automático al navegar
**Modal:** sheet desde abajo en móvil (`items-end`), centrado en desktop (`sm:items-center`)

### Patrón dual-view (estándar en todas las páginas de lista)

```tsx
{/* Tarjetas — solo en móvil */}
<div className="sm:hidden space-y-2">{/* card por item */}</div>

{/* Tabla — tablet y desktop */}
<div className="hidden sm:block overflow-hidden rounded-xl border">
  <div className="overflow-x-auto">
    <table>{/* ... */}</table>
  </div>
</div>
```

### Texto adaptativo en botones

```tsx
<span className="hidden sm:inline">Nuevo lead</span>
<span className="sm:hidden">Nuevo</span>
```

---

## 16. Seguridad — resumen ejecutivo

Ver `docs/DESARROLLO.md` y memoria `security_model.md` para detalle completo.

**Reglas que no se negocian:**
1. `assertLicense()` — primera línea de cada Route Handler
2. `SUPABASE_SERVICE_ROLE_KEY` — solo en servidor, nunca en cliente
3. `DATA_ENCRYPTION_KEY` — no cambiar con datos en producción, backup obligatorio
4. Webhook WhatsApp — validar HMAC-SHA256 antes de procesar cualquier body
5. RLS activo en todas las tablas — nunca deshabilitar
6. `LEADS-GMM-PRIVATE-KEY.pem` — fuera del repositorio, en Desktop

**Archivos de referencia:**
- `lib/crypto.ts` — `encryptField`, `decryptField`, `hashField`, `maskField`
- `lib/license.ts` — `assertLicense`, `checkLicense`
- `lib/audit.ts` — `logAudit`, `sanitizeLimit`, `API_MAX_RECORDS`

---

## 17. Documentación operativa

| Documento | Ubicación | Contenido |
|---|---|---|
| Esta guía | `CLAUDE.md` | Arquitectura, decisiones, patrones para sesiones de IA |
| Guía de despliegue | `docs/DESPLIEGUE.md` | Setup completo: Supabase, Vercel, WhatsApp, checklist |
| Guía de desarrollo | `docs/DESARROLLO.md` | Convenciones, patrones de código, SQL, git flow |

---

## 14. Preguntas pendientes (mínimas)

- [ ] **Nombre del producto / dominio** — define el prefix del código de vendedor y las URLs de QR
- [ ] **Número de WhatsApp de producción** — para registrar en Meta y configurar el bot
