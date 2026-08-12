# Guía de Desarrollo — Leads GMM

> Convenciones, patrones de código y arquitectura para contribuir al sistema.

---

## Arquitectura general

```
app/
├── (auth)/          # Rutas protegidas — agentes y admin
│   ├── layout.tsx   # Server component → ShellClient
│   ├── leads/       # Hub principal del pipeline
│   ├── personas/    # Expediente unificado de pacientes
│   ├── marketing/   # Vendedores, campañas, comisiones
│   ├── medicos/     # Catálogo interno (16k+ médicos)
│   ├── empresas/    # Aseguradoras y convenios
│   ├── callcenter/  # Cola y gestión de agentes
│   └── admin/       # Configuración del sistema
├── (vendedor)/      # Portal de vendedores — autenticación OTP
├── api/             # Route Handlers (backend)
│   ├── leads/
│   ├── vendedores/
│   ├── personas/
│   └── whatsapp/webhook/
├── r/[codigo]/      # Landing pública con código referido
└── docs/[token]/    # Upload de documentos (paciente en celular)

lib/
├── supabase/server.ts   # createClient + createServiceClient
├── supabase/client.ts   # Browser client
├── crypto.ts            # AES-256-GCM + HMAC-SHA256
├── audit.ts             # logAudit + sanitizeLimit
├── license.ts           # Verificación RSA de licencia
└── utils.ts             # normalizePhone, formatDate, cn, etc.

components/ui/
├── shell-client.tsx  # Layout wrapper con estado del sidebar
├── sidebar.tsx       # Navegación — desktop fija / móvil drawer
├── topbar.tsx        # Barra superior con hamburger y usuario
├── modal.tsx         # Modal — sheet en móvil, centrado en desktop
├── button.tsx        # Botón con variantes y loading
├── input.tsx         # Input, Select, Textarea con label
└── badge.tsx         # Badge de color con tamaño sm/md

constants/
├── lead-etapas.ts    # ETAPAS_PIPELINE — key, label, color, bg
├── geo-mx.ts         # GEO_ESTADOS — lista de estados mexicanos
├── aseguradoras.ts   # Catálogo base de aseguradoras
└── procedimientos.ts # Catálogo de procedimientos quirúrgicos
```

---

## Convenciones de código

### Idioma
- **UI y mensajes:** Español mexicano
- **Variables y funciones:** camelCase en inglés o español indistintamente
- **Comentarios:** Solo cuando el "por qué" no es obvio — sin comentarios descriptivos del "qué"
- **SQL:** Todo en minúsculas, snake_case

### Tipografía de datos
- **Texto en DB:** TODO EN MAYÚSCULAS — aplicado en API con `String(v).trim().toUpperCase()`
- **Email:** minúsculas — `normalizeEmail()` en `lib/utils.ts`
- **Teléfonos:** 10 dígitos exactos, solo números — `normalizePhone()` en `lib/utils.ts`
- **CURP:** Mayúsculas, sin espacios — `normalizeCurp()` en `lib/utils.ts`
- **Inputs UI:** `style={{ textTransform: "uppercase" }}` en campos de texto libre

### Colores del sistema (CSS variables)

```css
var(--bg)         /* Fondo general #F0F4F8 */
var(--surface)    /* Cards, sidebar #FFFFFF */
var(--surface-2)  /* Hover, thead */
var(--border)     /* Bordes y separadores */
var(--text)       /* Texto principal */
var(--muted)      /* Texto secundario */
var(--subtle)     /* Texto terciario, labels */
var(--accent)     /* Color principal del sistema */
var(--accent-bg)  /* Fondo suave del acento */
var(--positive)   /* Verde éxito #059669 */
var(--negative)   /* Rojo error #DC2626 */
var(--shadow)     /* Sombra de cards */
```

**Semántica por etapa:**
- Ganado: `color: #059669`, `bg: #ECFDF5`
- No viable / Perdido: `color: #DC2626`, `bg: #FEF2F2`
- En proceso: paleta propia definida en `constants/lead-etapas.ts`

---

## Patrones de API (Route Handlers)

### Estructura estándar de un Route Handler

```ts
// app/api/recurso/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"
import { assertLicense } from "@/lib/license"

export async function GET(req: NextRequest) {
  assertLicense()                                    // 1. Verificar licencia
  const supabase = await createClient()              // 2. Cliente de usuario
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  // 3. Verificar rol si es necesario
  const { data: profile } = await supabase.from("user_profiles").select("rol").eq("id", user.id).single()
  if (!["admin", "supervisor"].includes(profile?.rol ?? "")) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const svc = await createServiceClient()            // 4. Service client para queries
  const { data, error } = await svc.from("tabla").select("*")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })                 // 5. Respuesta
}
```

### Patrón de conteo eficiente

```ts
// CORRECTO — dos queries paralelas, sin count: "exact" en query con joins
const [dataResult, countResult] = await Promise.all([
  svc.from("leads").select("id, nombre, etapa, ...").range(0, 49),
  svc.from("leads").select("id", { count: "exact", head: true }),
])
const total = countResult.count ?? 0
```

### Patrón para campos PII (cifrado)

```ts
import { encryptField, hashField } from "@/lib/crypto"

// Al crear/actualizar — siempre cifrar y hashear en el servidor
const row = {
  nombre_enc:     encryptField(body.nombre),
  telefono_enc:   encryptField(normalizePhone(body.telefono)),
  telefono_hash:  hashField(normalizePhone(body.telefono)),
  email_enc:      encryptField(normalizeEmail(body.email)),
  email_hash:     hashField(normalizeEmail(body.email)),
}

// Al leer — descifrar en el servidor, nunca en el cliente
import { decryptField } from "@/lib/crypto"
const nombre = decryptField(row.nombre_enc)
```

### Patrón de funciones SQL vía RPC

```ts
// Preferable a queries complejas con múltiples JOINs en el cliente
const { data, error } = await svc.rpc("nombre_funcion", {
  p_fecha_desde: fechaDesde ?? null,
  p_fecha_hasta: fechaHasta ?? null,
  p_etapa:       etapa ?? null,
})
```

---

## Patrones de UI

### Componente de página estándar (responsive)

```tsx
"use client"
export default function MiPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text)" }}>
            Título
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Subtítulo</p>
        </div>
        <Button size="sm">
          <Plus size={13} />
          <span className="hidden sm:inline">Texto completo</span>
          <span className="sm:hidden">Corto</span>
        </Button>
      </div>

      {/* Vista móvil: tarjetas */}
      <div className="sm:hidden space-y-2">
        {items.map(item => (
          <div key={item.id} className="p-4 rounded-xl border"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {/* contenido de tarjeta */}
          </div>
        ))}
      </div>

      {/* Vista tablet/desktop: tabla */}
      <div className="hidden sm:block rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">{/* ... */}</table>
        </div>
      </div>
    </div>
  )
}
```

### Breakpoints usados

| Breakpoint | px | Uso |
|---|---|---|
| (ninguno) | 0+ | Móvil — tarjetas, filtros colapsables, drawer |
| `sm:` | 640+ | Tabla, filtros siempre visibles |
| `md:` | 768+ | Grids 2→4 columnas en KPIs |
| `lg:` | 1024+ | Sidebar fija siempre visible |

### Modal — reglas

```tsx
// Sheet en móvil, centrado en desktop
<Modal open={open} onClose={onClose} title="Título" size="lg">
  {/* size: "sm" | "md" | "lg" */}
</Modal>
```
- `sm` → max-w-sm — para QR y confirmaciones
- `md` → max-w-lg — default, formularios simples
- `lg` → max-w-2xl — formularios multi-sección

### Slide panel de detalle (patrón PersonaCard)

```tsx
// Panel fijo a la derecha con backdrop
<div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
  <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
  <div className="relative z-50 flex flex-col h-full overflow-y-auto w-full max-w-lg"
    style={{ background: "var(--surface)" }}
    onClick={e => e.stopPropagation()}>
    {/* contenido */}
  </div>
</div>
```

### Debounce en búsqueda (patrón estándar)

```tsx
const [q, setQ] = useState("")
const [debouncedQ, setDebouncedQ] = useState("")

useEffect(() => {
  const t = setTimeout(() => setDebouncedQ(q), 300)
  return () => clearTimeout(t)
}, [q])

// Usar debouncedQ en el fetch, no q directamente
```

### Fetch paralelo (patrón estándar)

```tsx
const [dataRes, statsRes] = await Promise.all([
  fetch(`/api/leads?${params}`),
  fetch(`/api/leads/stats?${params}`),
])
```

---

## Patrones de SQL (migraciones)

### Funciones de analítica — patrón estándar

```sql
create or replace function get_mi_funcion(
  p_fecha_desde timestamptz default null,
  p_fecha_hasta timestamptz default null,
  p_filtro      text        default null
)
returns jsonb
language sql
stable
security definer
as $$
  with base as (
    select *
    from leads
    where
      (p_fecha_desde is null or fecha_captura >= p_fecha_desde)
      and (p_fecha_hasta is null or fecha_captura < p_fecha_hasta + interval '1 day')
      and (p_filtro is null or etapa = p_filtro)
  ),
  counts as (
    select
      count(*)                                       as total,
      count(*) filter (where etapa = 'ganado')       as ganados
    from base
  )
  select row_to_json(counts)::jsonb from counts
$$;

grant execute on function get_mi_funcion(timestamptz, timestamptz, text) to service_role;
```

### Reglas de migraciones

- Nombre: `NNN_descripcion_corta.sql` — NNN es el número siguiente al mayor existente
- Nunca editar una migración ya aplicada en producción
- Siempre incluir `IF EXISTS` / `IF NOT EXISTS` para idempotencia
- Incluir el `grant execute` al final de cada función nueva
- Probar con datos reales en staging antes de aplicar en producción

---

## Pipeline de etapas — reglas de negocio

```
nuevo → contactado → necesidad_identificada → seguro_identificado
                                                    ↓ (manual)
                        no_viable ←────── viable → programado → ganado
                        perdido   ←────── (disponible desde cualquier etapa activa)
```

### Auto-avance (PATCH /api/leads/[id])

Solo se activa cuando el body **no incluye** `etapa`:
```ts
if (!body.etapa) {
  // calcular nueva etapa según datos presentes
}
```

`save()` en LeadDetailClient.tsx excluye `etapa` y `estado` del payload — esto es intencional y no debe revertirse.

### Cambio manual de etapa

Usar siempre `/api/leads/[id]/etapa` (endpoint separado).
Validación en ese endpoint:
- `programado` requiere `carta_autorizacion_url` OR `numero_autorizacion`

---

## Seguridad — reglas no negociables

1. **`SUPABASE_SERVICE_ROLE_KEY`** — solo en Route Handlers del servidor. Nunca en Client Components ni en `NEXT_PUBLIC_*`
2. **`DATA_ENCRYPTION_KEY`** — nunca cambiar una vez que hay datos en producción. Hacerlo hace ilegibles todos los datos cifrados. Hacer backup antes de cualquier rotación.
3. **`LICENSE_KEY`** — validar en cada Route Handler con `assertLicense()`
4. **Webhook WhatsApp** — siempre validar firma HMAC-SHA256 antes de procesar el body
5. **RLS** — habilitado en todas las tablas. No deshabilitar nunca sin revisión
6. **Llave privada RSA** — `LEADS-GMM-PRIVATE-KEY.pem` fuera del repositorio, en `C:\Users\AlejandroLegorreta\Desktop\`

---

## Flujo de git

```bash
# Feature nueva
git checkout -b feature/nombre-descriptivo
# ... cambios ...
git add <archivos específicos>  # Nunca git add -A sin revisar
git commit -m "feat: descripción"
git push origin feature/nombre-descriptivo

# Fix urgente
git checkout -b fix/descripcion
# ... fix ...
git commit -m "fix: descripción del bug"

# Merge a master (solo después de pruebas)
git checkout master
git merge --no-ff feature/nombre-descriptivo
git push origin master
```

### Convención de mensajes de commit

```
feat:     nueva funcionalidad
fix:      corrección de bug
perf:     mejora de rendimiento
db:       migración o cambio de esquema
refactor: reorganización sin cambio de comportamiento
style:    cambios de CSS/UI sin lógica
docs:     documentación
chore:    tareas de mantenimiento
```

---

## Comandos útiles

```bash
# Desarrollo
npm run dev           # Servidor local en :3000
npm run build         # Build de producción
npx tsc --noEmit      # Verificar tipos sin compilar

# Git
git log --oneline -10       # Últimos 10 commits
git diff HEAD~1 HEAD        # Cambios del último commit

# Supabase local (si se tiene CLI)
npx supabase start          # Levantar Supabase local
npx supabase db push        # Aplicar migraciones pendientes
npx supabase db reset       # Reiniciar DB local (solo desarrollo)

# Vercel
vercel env pull .env.local  # Descargar vars de Vercel a local
vercel logs <URL>           # Ver logs de un deploy
```
