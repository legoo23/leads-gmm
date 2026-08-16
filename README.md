# iHelp Médica — Sistema de Gestión de Leads GMM

> Plataforma para **capturar, calificar y convertir leads** de personas interesadas en procedimientos quirúrgicos cubiertos por Seguro de Gastos Médicos Mayores (GMM).

**Dominio:** ihelpmedica.mx · **Stack:** Next.js 15 · TypeScript · Tailwind CSS v4 · Supabase · Vercel

---

## ¿Qué hace este sistema?

1. **Captura leads** desde QR de vendedores, formulario web, bot de WhatsApp y convenios empresariales
2. **Califica** si el paciente tiene seguro GMM que cubre el procedimiento requerido
3. **Gestiona el pipeline** desde el primer contacto hasta la conversión (cirugía autorizada)
4. **Recompensa** a los vendedores con comisiones fijas al cerrar un lead

---

## Módulos

| Módulo | Ruta | Descripción |
|---|---|---|
| Leads Hub | `/leads` | Pipeline kanban/lista del proceso GMM |
| Personas Hub | `/personas` | Expediente unificado de pacientes |
| Marketing Hub | `/marketing` | Vendedores, campañas y comisiones |
| Médicos Hub | `/medicos` | Catálogo interno (solo admin) |
| Empresas Hub | `/empresas` | Aseguradoras y convenios corporativos |
| Call Center | `/callcenter` | Cola de atención por agente |
| Admin Hub | `/admin` | Configuración del sistema y usuarios |
| Portal Vendedor | `/portal` | Dashboard vendedor (OTP, solo lectura) |
| Landing pública | `/r/[codigo]` | Formulario de captura con QR |
| Convenio empresa | `/c/[slug]` | Landing personalizada por empresa |

---

## Flujo principal

```
QR vendedor / WhatsApp / Landing empresa
  └→ Lead en etapa "nuevo"
       └→ Agente contacta → identifica padecimiento y seguro
            └→ Validación con aseguradora (48-72 h)
                 └→ Autorización → Programación → GANADO ✅
                      └→ Comisión fija al vendedor
```

### Etapas del pipeline

| Etapa | Key | SLA |
|---|---|---|
| Nuevo | `nuevo` | Contactar < 2 h |
| Contactado | `contactado` | — |
| Necesidad Identificada | `necesidad_identificada` | — |
| Seguro Identificado | `seguro_identificado` | — |
| En Validación | `en_validacion` | 48-72 h hábiles |
| Viable | `viable` | — |
| Programado | `programado` | — |
| **Ganado** | `ganado` | ✅ Activa comisión |
| **No Viable** | `no_viable` | ❌ |
| **Perdido** | `perdido` | ❌ |

---

## Inicio rápido

```bash
# 1. Clonar
git clone https://github.com/legoo23/leads-gmm.git
cd leads-gmm

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Levantar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno requeridas

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DATA_ENCRYPTION_KEY=          # AES-256-GCM — generar una sola vez, nunca cambiar con datos en prod
LICENSE_KEY=                  # RSA-SHA256 — payload.firma en base64

WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=

NEXT_PUBLIC_APP_URL=https://ihelpmedica.mx
NEXT_PUBLIC_VENDOR_CODE_PREFIX=IHM
```

---

## Arquitectura de seguridad

- **Cifrado PII:** AES-256-GCM en teléfonos, emails y datos sensibles (`lib/crypto.ts`)
- **Licencia:** RSA-SHA256 verificada en cada Route Handler como primera instrucción
- **RLS:** Habilitado en todas las tablas de Supabase
- **Audit log:** Cada acción relevante queda en tabla `audit_log`
- **Webhook WhatsApp:** Validación HMAC-SHA256 antes de procesar cualquier mensaje
- **Rate limiting:** En memoria (Fluid Compute) en todos los endpoints públicos
- **Honeypot:** Campo oculto `_gotcha` en todos los formularios públicos
- **CAPTCHA:** Canvas matemático en formularios públicos

---

## Estructura del proyecto

```
app/
├── (auth)/          # Rutas protegidas (agentes/admin)
├── (vendedor)/      # Portal de vendedores (OTP)
├── api/             # Route Handlers
├── r/[codigo]/      # Landing pública con QR de vendedor
├── c/[slug]/        # Landing de convenio empresarial
└── docs/[token]/    # Subida de documentos por paciente

lib/
├── supabase/        # Clientes server/client/middleware
├── crypto.ts        # Cifrado y hashing
├── audit.ts         # Log de auditoría
├── license.ts       # Verificación de licencia
└── utils.ts         # Helpers compartidos

components/ui/       # Componentes reutilizables
constants/           # Catálogos (etapas, procedimientos, aseguradoras)
supabase/migrations/ # Historial de migraciones SQL
docs/                # Documentación técnica y operativa
```

---

## Documentación

| Documento | Descripción |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Arquitectura, decisiones y patrones para sesiones de IA |
| [`docs/DESARROLLO.md`](docs/DESARROLLO.md) | Convenciones de código y patrones |
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) | Setup completo: Supabase, Vercel, WhatsApp |
| [`docs/HISTORIAS-USUARIO.md`](docs/HISTORIAS-USUARIO.md) | Historias de usuario por actor |
| [`docs/AUDITORIA.md`](docs/AUDITORIA.md) | Modelo de auditoría y trazabilidad |
| [`docs/PENDIENTES.md`](docs/PENDIENTES.md) | Backlog y posibles mejoras |

---

## Deploy

El proyecto se despliega en **Vercel** (rama `master` → producción automática).
Base de datos en **Supabase** proyecto `ljiqzsdcnxchckkhruol`.

```bash
# Ver estado del deploy
vercel ls

# Jalar env vars a local
vercel env pull .env.local
```

---

## Licencia

Software propietario. © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
