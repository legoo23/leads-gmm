-- 013_personas_vendedor_stats.sql
-- Función de personas: agrupa leads por telefono_hash para vista unificada
-- Función de analítica de vendedores: métricas de rendimiento por vendedor

-- ============================================================================
-- get_personas_list: vista de pacientes únicos desde leads
-- ============================================================================
create or replace function get_personas_list(
  p_q     text    default null,
  p_limit int     default 50
)
returns table (
  ref_lead_id        bigint,
  nombre             text,
  apellido_paterno   text,
  apellido_materno   text,
  telefono_enc       text,
  email_enc          text,
  curp_enc           text,
  telefono_hash      text,
  estado_ciudad      text,
  leads_count        bigint,
  ultima_etapa       text,
  fecha_primer_lead  timestamptz,
  fecha_ultimo_lead  timestamptz
)
language sql
stable
security definer
as $$
  select
    min(id)                                                                         as ref_lead_id,
    (array_agg(nombre           order by fecha_captura desc))[1]                   as nombre,
    (array_agg(apellido_paterno order by fecha_captura desc))[1]                   as apellido_paterno,
    (array_agg(apellido_materno order by fecha_captura desc))[1]                   as apellido_materno,
    (array_agg(telefono_enc     order by (telefono_enc is null), fecha_captura desc))[1] as telefono_enc,
    (array_agg(email_enc        order by (email_enc is null),    fecha_captura desc))[1] as email_enc,
    (array_agg(curp_enc         order by (curp_enc is null),     fecha_captura desc))[1] as curp_enc,
    min(telefono_hash)                                                              as telefono_hash,
    (array_agg(estado_ciudad    order by (estado_ciudad is null), fecha_captura desc))[1] as estado_ciudad,
    count(*)                                                                        as leads_count,
    (array_agg(etapa            order by fecha_captura desc))[1]                   as ultima_etapa,
    min(fecha_captura)                                                              as fecha_primer_lead,
    max(fecha_captura)                                                              as fecha_ultimo_lead
  from leads
  where
    p_q is null
    or nombre           ilike '%' || p_q || '%'
    or apellido_paterno ilike '%' || p_q || '%'
    or apellido_materno ilike '%' || p_q || '%'
  group by coalesce(telefono_hash, 'no-tel-' || id::text)
  order by max(fecha_captura) desc
  limit p_limit;
$$;

grant execute on function get_personas_list(text, int) to service_role;

-- ============================================================================
-- get_vendedor_stats: analítica de rendimiento por vendedor
-- ============================================================================
create or replace function get_vendedor_stats(
  p_fecha_desde timestamptz default null,
  p_fecha_hasta timestamptz default null
)
returns table (
  id_vendedor          int,
  nombre_vendedor      text,
  apellidos_vendedor   text,
  codigo_unico         text,
  activo               boolean,
  id_nivel             int,
  nivel_nombre         text,
  nivel_monto          numeric,
  total_leads          bigint,
  leads_activos        bigint,
  leads_ganados        bigint,
  leads_cerrados       bigint,
  conversion_pct       numeric,
  monto_estimado       numeric,
  monto_ganado         numeric,
  comisiones_total     numeric,
  comisiones_pagadas   numeric,
  comisiones_pendientes numeric,
  fuente_qr            bigint,
  fuente_formulario    bigint,
  fuente_whatsapp      bigint,
  fuente_referido      bigint,
  fuente_llamada       bigint,
  fecha_primer_lead    timestamptz,
  fecha_ultimo_lead    timestamptz
)
language sql
stable
security definer
as $$
  select
    v.id,
    v.nombre,
    coalesce(trim(coalesce(v.apellido_paterno,'') || ' ' || coalesce(v.apellido_materno,'')), '') as apellidos_vendedor,
    v.codigo_unico,
    v.activo,
    v.id_nivel,
    nc.nombre                                                            as nivel_nombre,
    nc.monto                                                             as nivel_monto,

    count(l.id)                                                          as total_leads,
    count(l.id) filter (where l.etapa not in ('ganado','no_viable','perdido')) as leads_activos,
    count(l.id) filter (where l.etapa = 'ganado')                       as leads_ganados,
    count(l.id) filter (where l.etapa in ('ganado','no_viable','perdido')) as leads_cerrados,

    case
      when count(l.id) filter (where l.etapa in ('ganado','no_viable','perdido')) > 0
      then round(
        count(l.id) filter (where l.etapa = 'ganado')::numeric /
        count(l.id) filter (where l.etapa in ('ganado','no_viable','perdido')) * 100, 1
      )
      else 0
    end                                                                  as conversion_pct,

    coalesce(sum(l.costo_estimado), 0)                                   as monto_estimado,
    coalesce(sum(l.costo_estimado) filter (where l.etapa = 'ganado'), 0) as monto_ganado,

    coalesce(sum(c.monto), 0)                                            as comisiones_total,
    coalesce(sum(c.monto) filter (where c.estado = 'pagada'), 0)         as comisiones_pagadas,
    coalesce(sum(c.monto) filter (where c.estado in ('pendiente','aprobada')), 0) as comisiones_pendientes,

    count(l.id) filter (where l.fuente = 'qr')                           as fuente_qr,
    count(l.id) filter (where l.fuente = 'formulario')                   as fuente_formulario,
    count(l.id) filter (where l.fuente = 'whatsapp_bot')                 as fuente_whatsapp,
    count(l.id) filter (where l.fuente = 'referido')                     as fuente_referido,
    count(l.id) filter (where l.fuente = 'llamada')                      as fuente_llamada,

    min(l.fecha_captura)                                                  as fecha_primer_lead,
    max(l.fecha_captura)                                                  as fecha_ultimo_lead

  from vendedores v
  left join leads l
    on  l.id_vendedor = v.id
    and (p_fecha_desde is null or l.fecha_captura >= p_fecha_desde)
    and (p_fecha_hasta is null or l.fecha_captura <  p_fecha_hasta + interval '1 day')
  left join comisiones c
    on  c.id_vendedor = v.id
    and (p_fecha_desde is null or c.fecha_conversion >= p_fecha_desde)
    and (p_fecha_hasta is null or c.fecha_conversion <  p_fecha_hasta + interval '1 day')
  left join niveles_comision nc on nc.id = v.id_nivel

  group by v.id, v.nombre, v.apellido_paterno, v.apellido_materno,
           v.codigo_unico, v.activo, v.id_nivel, nc.nombre, nc.monto
  order by total_leads desc;
$$;

grant execute on function get_vendedor_stats(timestamptz, timestamptz) to service_role;
