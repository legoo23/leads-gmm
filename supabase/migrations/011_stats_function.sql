-- 011_stats_function.sql
-- Función SQL para analítica del pipeline GMM
-- Retorna conteos agregados en un solo query (eficiente — un CTE scan)

create or replace function get_lead_stats(
  p_fecha_desde   timestamptz default null,
  p_fecha_hasta   timestamptz default null,
  p_etapa         text        default null,
  p_fuente        text        default null,
  p_con_medico_red boolean    default false,
  p_id_agente     text        default null
)
returns jsonb
language sql
stable
security definer
as $$
  with base as (
    select etapa, fuente, fecha_captura
    from leads
    where true
      and (p_fecha_desde    is null or fecha_captura >= p_fecha_desde)
      and (p_fecha_hasta    is null or fecha_captura <  p_fecha_hasta + interval '1 day')
      and (p_etapa          is null or etapa  = p_etapa)
      and (p_fuente         is null or fuente = p_fuente)
      and (not p_con_medico_red    or id_medico is not null)
      and (p_id_agente      is null or id_agente::text = p_id_agente)
  ),
  counts as (
    select
      count(*)::int                                                              as total,
      count(*) filter (where etapa = 'ganado')::int                             as ganados,
      count(*) filter (where etapa in ('ganado','no_viable','perdido'))::int    as cerrados,
      count(*) filter (where etapa not in ('ganado','no_viable','perdido'))::int as activos,
      count(*) filter (where fecha_captura >= now() - interval '7 days')::int   as esta_semana,
      count(*) filter (
        where fecha_captura >= now() - interval '14 days'
          and fecha_captura <  now() - interval '7 days'
      )::int                                                                     as semana_pasada
    from base
  ),
  por_etapa as (
    select coalesce(jsonb_object_agg(etapa, cnt), '{}') as data
    from (select etapa, count(*)::int as cnt from base group by etapa) t
  ),
  por_fuente as (
    select coalesce(jsonb_object_agg(coalesce(fuente, 'otro'), cnt), '{}') as data
    from (select fuente, count(*)::int as cnt from base group by fuente) t
  )
  select jsonb_build_object(
    'total',         c.total,
    'ganados',       c.ganados,
    'cerrados',      c.cerrados,
    'activos',       c.activos,
    'esta_semana',   c.esta_semana,
    'semana_pasada', c.semana_pasada,
    'por_etapa',     pe.data,
    'por_fuente',    pf.data
  )
  from counts c, por_etapa pe, por_fuente pf;
$$;

grant execute on function get_lead_stats(timestamptz, timestamptz, text, text, boolean, text) to service_role;
