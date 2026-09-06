create or replace function availability(
    p_location_id uuid,
    p_from        date,
    p_to          date,
    p_duration    interval,
    p_provider_id uuid        default null,
    p_now         timestamptz default now()
)
    returns table (provider_id uuid, start timestamptz)
    language sql
    stable
as
$$
with
    -- template expansion: one merged multirange of working hours per provider
    working as (
        select t.provider_id,
               range_agg(tstzrange(
                       (d::date + t.starts_at) at time zone l.timezone,
                       (d::date + t.ends_at)   at time zone l.timezone,
                       '[)')
               ) as hours
        from provider_template t
                 join location l on l.id = t.location_id
                 cross join generate_series(p_from, p_to, interval '1 day') as d
        where l.id = p_location_id
          and t.isodow = extract(isodow from d)
          and (p_provider_id is null or t.provider_id = p_provider_id)
        group by t.provider_id
    ),

    -- working hours minus live claims minus the past
    free as materialized (
        select w.provider_id,
               w.hours,
               w.hours
                   - coalesce((
                                  select range_agg(tc.during)
                                  from time_claim tc
                                  where tc.provider_id = w.provider_id
                                    and tc.during && w.hours
                                    and tc.released_at is null
                                    and (tc.expires_at is null or tc.expires_at > p_now)
                              ), '{}'::tstzmultirange)
                   - tstzrange(null, p_now, '[)')::tstzmultirange as open
        from working w
    ),

    -- 10-minute grid stepped from each (merged) block's start, not from the free piece
    grid as (
        select f.provider_id,
               s as start,
               f.open
        from free f
                 cross join lateral unnest(f.hours) as blk
                 cross join lateral generate_series(lower(blk), upper(blk) - p_duration, interval '10 minutes') as s
    )

select provider_id, start
from grid
where tstzrange(start, start + p_duration, '[)') <@ open
order by provider_id, start;
$$;