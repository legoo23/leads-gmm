-- leads-gmm — Mensajes y noticias para vendedores
-- Copyright © 2026 Alejandro Legorreta Barrera. Todos los derechos reservados.

-- Mensajes del admin hacia los vendedores (broadcast o individual)
create table if not exists mensajes_vendedores (
  id           serial primary key,
  asunto       text not null,
  cuerpo       text not null,
  destinatario text not null default 'todos', -- 'todos' | 'individual'
  id_vendedor  int references vendedores(id) on delete cascade,  -- null si es para todos
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Registro de lecturas por vendedor
create table if not exists mensajes_lecturas (
  id_mensaje  int not null references mensajes_vendedores(id) on delete cascade,
  id_vendedor int not null references vendedores(id) on delete cascade,
  leido_at    timestamptz not null default now(),
  primary key (id_mensaje, id_vendedor)
);

-- Noticias y recursos para el panel del vendedor
create table if not exists noticias_vendedores (
  id          serial primary key,
  titulo      text not null,
  cuerpo      text not null,
  tipo        text not null default 'novedad',  -- 'novedad' | 'aviso' | 'ayuda'
  activo      boolean not null default true,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS
alter table mensajes_vendedores enable row level security;
alter table mensajes_lecturas   enable row level security;
alter table noticias_vendedores enable row level security;

-- Solo service_role puede leer/escribir (las rutas del servidor usan service_role)
create policy "service_role_all_mensajes"
  on mensajes_vendedores for all to service_role using (true) with check (true);

create policy "service_role_all_lecturas"
  on mensajes_lecturas for all to service_role using (true) with check (true);

create policy "service_role_all_noticias"
  on noticias_vendedores for all to service_role using (true) with check (true);

-- Índices de consulta frecuente
create index if not exists idx_mensajes_vendedor on mensajes_vendedores(id_vendedor);
create index if not exists idx_mensajes_activo   on mensajes_vendedores(activo, created_at desc);
create index if not exists idx_lecturas_vendedor on mensajes_lecturas(id_vendedor);
create index if not exists idx_noticias_activo   on noticias_vendedores(activo, orden, created_at desc);
