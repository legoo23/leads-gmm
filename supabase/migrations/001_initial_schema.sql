-- leads-gmm — Esquema inicial de base de datos
-- Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.
--
-- IMPORTANTE: Los campos marcados como [CIFRADO] almacenan el valor
-- encriptado con AES-256-GCM desde la capa de aplicación.
-- La clave de cifrado (DATA_ENCRYPTION_KEY) vive en Vercel Secrets y NUNCA
-- se guarda en la base de datos.
-- Los campos _hash almacenan un HMAC-SHA256 del valor original para búsquedas
-- y deduplicación sin exponer el dato real.
-- ============================================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================================
-- TABLAS DE CATÁLOGO
-- ============================================================================

create table if not exists niveles_comision (
  id          serial primary key,
  nombre      text not null,
  monto       numeric(10,2) not null check (monto >= 0),
  descripcion text,
  activo      boolean not null default true,
  orden       int,
  created_at  timestamptz not null default now()
);

create table if not exists aseguradoras (
  id          serial primary key,
  nombre      text not null,
  nombre_corto text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists hospitales (
  id          serial primary key,
  nombre      text not null,
  ciudad      text,
  estado      text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- VENDEDORES
-- ============================================================================

create table if not exists vendedores (
  id              serial primary key,
  nombre          text not null,
  telefono        text,     -- [CIFRADO]
  email           text,     -- [CIFRADO]
  id_nivel        int references niveles_comision(id),
  codigo_unico    text not null unique,
  activo          boolean not null default true,
  fecha_registro  timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- ============================================================================
-- CAMPAÑAS
-- ============================================================================

create table if not exists campanas (
  id              serial primary key,
  nombre          text not null,
  procedimiento   text,
  fecha_inicio    date,
  fecha_fin       date,
  activa          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ============================================================================
-- PERSONAS (expediente unificado del paciente)
-- Deduplicación en cascada: CURP → teléfono → email
-- ============================================================================

create table if not exists personas (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  apellido_paterno text,
  apellido_materno text,
  telefono        text,        -- [CIFRADO]
  telefono_hash   text,        -- HMAC-SHA256 para deduplicación
  email           text,        -- [CIFRADO]
  email_hash      text,        -- HMAC-SHA256 para deduplicación
  curp            text,        -- [CIFRADO]
  curp_hash       text unique, -- HMAC-SHA256 único para deduplicación
  fecha_nacimiento date,
  estado_ciudad   text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_personas_telefono_hash on personas(telefono_hash);
create index if not exists idx_personas_email_hash    on personas(email_hash);
create index if not exists idx_personas_curp_hash     on personas(curp_hash);

-- ============================================================================
-- MÉDICOS (catálogo interno — sin acceso al sistema)
-- ============================================================================

create table if not exists medicos (
  id              serial primary key,
  nombre          text not null,
  especialidad    text,
  id_hospital     int references hospitales(id),
  telefono        text,
  email           text,
  cedula          text,
  activo          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ============================================================================
-- LEADS — tabla principal
-- ============================================================================

create table if not exists leads (
  id                      bigserial primary key,
  folio                   text unique,

  -- Relaciones
  id_persona              uuid references personas(id),
  id_vendedor             int references vendedores(id),
  id_campana              int references campanas(id),
  codigo_referido         text,
  fuente                  text check (fuente in ('whatsapp_bot','qr','formulario','llamada','referido')),
  en_cola_revision        boolean not null default false,

  -- Contacto (campos sensibles cifrados)
  nombre                  text not null,
  apellido_paterno        text,
  apellido_materno        text,
  telefono                text,       -- [CIFRADO]
  telefono_hash           text,       -- HMAC-SHA256
  email                   text,       -- [CIFRADO]
  email_hash              text,       -- HMAC-SHA256
  fecha_nacimiento        date,
  curp                    text,       -- [CIFRADO]
  curp_hash               text,       -- HMAC-SHA256
  estado_ciudad           text,
  prioridad               text check (prioridad in ('baja','media','alta','urgente')) default 'media',

  -- Padecimientos
  diagnostico_principal   text,
  comorbilidades          text[],
  cirugias_previas        boolean,
  cirugias_previas_desc   text,
  tiene_medico_tratante   boolean,
  medico_tratante_nombre  text,
  notas_clinicas          text,

  -- Procedimiento
  procedimiento           text,
  categoria_quirurgica    text,
  codigo_procedimiento    text,       -- CIE-9 / CPT
  urgencia                text check (urgencia in ('electiva','programada','urgente')),
  fecha_tentativa         date,
  costo_estimado          numeric(12,2),
  estancia_estimada       text,
  notas_procedimiento     text,

  -- Seguro
  id_aseguradora          int references aseguradoras(id),
  numero_poliza           text,       -- [CIFRADO]
  numero_certificado      text,       -- [CIFRADO]
  tipo_plan               text,
  vigencia_inicio         date,
  vigencia_fin            date,
  vigencia_original_inicio date,
  suma_asegurada          numeric(12,2),
  moneda                  text default 'MXN',
  deducible               numeric(10,2),
  coaseguro_pct           numeric(5,2),
  tope_coaseguro          numeric(10,2),
  periodo_espera_cumplido boolean,
  titular_poliza          text,

  -- Cobertura y exclusiones
  cubre_cirugias          boolean,
  requiere_preautorizacion boolean,
  cubre_anestesiologo     boolean,
  cubre_estudios_preop    boolean,
  cubre_honorarios        boolean,
  cubre_hospitalizacion   boolean,
  exclusiones             text[],
  aplica_preexistencia    boolean,
  numero_autorizacion     text,
  fecha_autorizacion      date,
  carta_autorizacion_url  text,       -- URL en Supabase Storage (bucket privado)
  contacto_aseguradora    text,
  notas_validacion        text,

  -- Asignación
  id_agente               int,        -- referencia a usuario Supabase Auth
  id_medico               int references medicos(id),
  id_hospital             int references hospitales(id),

  -- Pipeline (columna directa — permite filtrar por etapa en SQL sin workarounds)
  etapa                   text not null default 'nuevo' check (etapa in (
    'nuevo','contactado','necesidad_identificada','seguro_identificado',
    'en_validacion','viable','programado','ganado','no_viable','perdido'
  )),
  estado                  text not null default 'activo' check (estado in ('activo','convertido','perdido')),

  notas                   text,
  fecha_captura           timestamptz not null default now(),
  fecha_contacto          timestamptz,
  fecha_conversion        timestamptz
);

create index if not exists idx_leads_etapa      on leads(etapa);
create index if not exists idx_leads_estado     on leads(estado);
create index if not exists idx_leads_vendedor   on leads(id_vendedor);
create index if not exists idx_leads_agente     on leads(id_agente);
create index if not exists idx_leads_captura    on leads(fecha_captura desc);
create index if not exists idx_leads_tel_hash   on leads(telefono_hash);
create index if not exists idx_leads_email_hash on leads(email_hash);
create index if not exists idx_leads_curp_hash  on leads(curp_hash);
create index if not exists idx_leads_cola       on leads(en_cola_revision) where en_cola_revision = true;

-- ============================================================================
-- ESTUDIOS PREOPERATORIOS
-- ============================================================================

create table if not exists estudios_preop (
  id          serial primary key,
  id_lead     bigint not null references leads(id) on delete cascade,
  nombre      text not null,
  estado      text not null check (estado in ('requerido','pendiente','realizado')) default 'requerido',
  archivo_url text,   -- URL en Supabase Storage
  notas       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_estudios_lead on estudios_preop(id_lead);

-- ============================================================================
-- COMISIONES
-- ============================================================================

create table if not exists comisiones (
  id                  serial primary key,
  id_lead             bigint not null references leads(id),
  id_vendedor         int not null references vendedores(id),
  id_nivel_snapshot   int references niveles_comision(id),
  monto               numeric(10,2) not null,
  estado              text not null check (estado in ('pendiente','aprobada','pagada','cancelada')) default 'pendiente',
  fecha_conversion    timestamptz not null default now(),
  fecha_aprobacion    timestamptz,
  fecha_pago          timestamptz,
  notas               text
);

create index if not exists idx_comisiones_vendedor on comisiones(id_vendedor);
create index if not exists idx_comisiones_estado   on comisiones(estado);

-- ============================================================================
-- LOG DE AUDITORÍA (acceso a datos personales)
-- ============================================================================

create table if not exists audit_log (
  id          bigserial primary key,
  accion      text not null,
  id_usuario  text,    -- UUID del usuario Supabase Auth
  id_recurso  text,    -- ID del recurso accedido (lead_id, persona_id, etc.)
  meta        jsonb,
  ip          text,
  timestamp   timestamptz not null default now()
);

create index if not exists idx_audit_usuario  on audit_log(id_usuario);
create index if not exists idx_audit_ts       on audit_log(timestamp desc);
create index if not exists idx_audit_accion   on audit_log(accion);

-- ============================================================================
-- TRIGGER: al marcar lead como 'ganado' → crear comisión automáticamente
-- ============================================================================

create or replace function crear_comision_al_ganar()
returns trigger language plpgsql security definer as $$
declare
  v_nivel_id int;
  v_monto    numeric(10,2);
begin
  -- Solo actúa cuando cambia a 'ganado' desde otra etapa
  if NEW.etapa = 'ganado' and OLD.etapa <> 'ganado' and NEW.id_vendedor is not null then
    -- Obtener nivel y monto actual del vendedor
    select v.id_nivel, nc.monto
    into v_nivel_id, v_monto
    from vendedores v
    left join niveles_comision nc on nc.id = v.id_nivel
    where v.id = NEW.id_vendedor and v.activo = true;

    if v_monto is not null then
      insert into comisiones (id_lead, id_vendedor, id_nivel_snapshot, monto)
      values (NEW.id, NEW.id_vendedor, v_nivel_id, v_monto);

      -- Actualizar timestamp de conversión
      NEW.fecha_conversion := now();
      NEW.estado := 'convertido';
    end if;
  end if;

  -- Sync estado cuando se cierra negativamente
  if NEW.etapa in ('no_viable', 'perdido') and OLD.etapa not in ('no_viable','perdido') then
    NEW.estado := 'perdido';
  end if;

  return NEW;
end;
$$;

create or replace trigger trg_lead_ganado
  before update on leads
  for each row execute function crear_comision_al_ganar();

-- ============================================================================
-- RLS (Row Level Security) — habilitado en todas las tablas
-- ============================================================================

alter table leads             enable row level security;
alter table personas          enable row level security;
alter table vendedores        enable row level security;
alter table comisiones        enable row level security;
alter table campanas          enable row level security;
alter table medicos           enable row level security;
alter table hospitales        enable row level security;
alter table aseguradoras      enable row level security;
alter table niveles_comision  enable row level security;
alter table estudios_preop    enable row level security;
alter table audit_log         enable row level security;

-- NOTA: Las políticas RLS detalladas se definen en la migración 002_rls_policies.sql
-- Por ahora solo admins (service_role) tienen acceso total
-- El service_role key nunca se usa en el cliente — solo en Route Handlers del servidor
